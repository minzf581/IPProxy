from fastapi import APIRouter, Depends, Query, Request, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.static_order_service import StaticOrderService
from app.services.ipipv_base_api import IPIPVBaseAPI
import logging
from app.models.dynamic_order import DynamicOrder
from app.models.static_order import StaticOrder
from sqlalchemy import and_
from datetime import datetime
import json

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/api/callback/proxy")
async def proxy_callback(
    type: str = Query(..., description="回调类型(order/instance/product)"),
    no: str = Query(..., description="回调编号"),
    op: str = Query(..., description="操作类型(1=创建,2=续费,3=释放)"),
    db: Session = Depends(get_db)
):
    """
    处理IPIPV回调
    
    参数:
    - type: 回调类型(order/instance/product)
    - no: 回调编号
    - op: 操作类型(1=创建,2=续费,3=释放)
    """
    try:
        logger.info(f"收到IPIPV回调请求: type={type}, no={no}, op={op}")
        
        service = StaticOrderService(db, IPIPVBaseAPI())
        result = await service.handle_callback(type, no, op)
        
        logger.info(f"回调处理结果: {result}")
        return result
        
    except Exception as e:
        logger.error(f"回调处理失败: {str(e)}")
        return {
            'code': 'failed',
            'msg': str(e)
        }

@router.post("/order/callback/{order_id}")
async def handle_order_callback(
    order_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    处理代理订单回调
    
    Args:
        order_id: 订单ID
        request: 请求对象
        db: 数据库会话
    """
    try:
        # 获取回调数据
        callback_data = await request.json()
        logger.info(f"[OrderCallback] 收到订单回调: order_id={order_id}, data={json.dumps(callback_data, ensure_ascii=False)}")
        
        # 刷新数据库会话
        db.expire_all()
        
        # 查找动态订单
        logger.info(f"[OrderCallback] 开始查询动态订单: order_id={order_id}")
        order = db.query(DynamicOrder).filter(DynamicOrder.id == order_id).first()
        logger.info(f"[OrderCallback] 动态订单查询结果: {order}")
        
        if not order:
            # 如果不是动态订单，尝试查找静态订单
            logger.info(f"[OrderCallback] 开始查询静态订单: order_id={order_id}")
            order = db.query(StaticOrder).filter(StaticOrder.id == order_id).first()
            logger.info(f"[OrderCallback] 静态订单查询结果: {order}")
            
        if not order:
            logger.error(f"[OrderCallback] 未找到订单: {order_id}")
            # 检查数据库中是否存在任何订单
            all_orders = db.query(DynamicOrder).all()
            logger.info(f"[OrderCallback] 当前数据库中的所有动态订单: {[o.id for o in all_orders]}")
            raise HTTPException(status_code=404, detail="订单不存在")
            
        # 解析回调数据
        status = callback_data.get("status")
        proxy_info = callback_data.get("proxyInfo")
        
        if not status:
            logger.error(f"[OrderCallback] 回调数据缺少状态信息: {callback_data}")
            raise HTTPException(status_code=400, detail="回调数据格式错误")
            
        # 更新订单状态
        if status == "success":
            # 更新订单状态为成功
            order.status = "active"
            if hasattr(order, 'proxy_info'):  # 如果是动态订单
                order.proxy_info = proxy_info
            order.updated_at = datetime.now()
            db.commit()  # 添加事务提交
            logger.info(f"[OrderCallback] 订单激活成功: {order_id}")
            return {"code": 200, "message": "订单激活成功"}
        else:
            logger.error(f"[OrderCallback] 订单激活失败: {status}")
            raise HTTPException(status_code=400, detail=f"订单激活失败: {status}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[OrderCallback] 处理回调时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 