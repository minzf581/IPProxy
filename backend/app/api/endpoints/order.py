from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.dynamic_order import DynamicOrder
from app.core.logging import logger
from typing import Dict
import json

router = APIRouter()

@router.post("/callback/{order_id}")
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
        
        # 查找订单
        order = db.query(DynamicOrder).filter(DynamicOrder.id == order_id).first()
        if not order:
            logger.error(f"[OrderCallback] 未找到订单: {order_id}")
            raise HTTPException(status_code=404, detail="订单不存在")
            
        # 解析回调数据
        status = callback_data.get("status")
        proxy_info = callback_data.get("proxyInfo")
        
        if not status:
            logger.error(f"[OrderCallback] 回调数据缺少状态信息: {callback_data}")
            raise HTTPException(status_code=400, detail="回调数据格式错误")
            
        # 更新订单状态
        if status == "success":
            order.status = "active"
            order.proxy_info = proxy_info
            logger.info(f"[OrderCallback] 订单激活成功: {order_id}")
        elif status == "failed":
            order.status = "failed"
            error_msg = callback_data.get("message", "未知错误")
            logger.error(f"[OrderCallback] 订单激活失败: {order_id}, 原因: {error_msg}")
            
        # 保存更新
        db.commit()
        
        return {"message": "回调处理成功"}
        
    except Exception as e:
        logger.error(f"[OrderCallback] 处理回调异常: {str(e)}")
        raise HTTPException(status_code=500, detail="处理回调失败") 