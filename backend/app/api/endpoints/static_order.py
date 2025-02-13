from fastapi import APIRouter, Depends, HTTPException, Body, Request
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.static_order_service import StaticOrderService
from app.services.ipipv_base_api import IPIPVBaseAPI
from app.services.auth import get_current_user
from app.models.user import User
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/open/app/static/order", tags=["静态订单"])

@router.post("/create/v2")
async def create_static_order(
    order_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建静态代理订单"""
    try:
        # 检查权限
        if not current_user.is_agent and current_user.id != order_data.get('userId'):
            raise HTTPException(status_code=403, detail="没有权限执行此操作")
            
        service = StaticOrderService(db, IPIPVBaseAPI())
        result = await service.create_order(
            user_id=order_data['userId'],
            username=order_data['username'],
            agent_id=order_data['agentId'],
            agent_username=order_data['agentUsername'],
            order_data=order_data
        )
        return result
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"创建静态代理订单失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list/v2")
async def list_static_orders(
    request: Request,
    page: int = 1,
    page_size: int = 10,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取静态代理订单列表"""
    try:
        # 权限检查：
        # 1. 如果用户是代理商，可以查看所有订单
        # 2. 如果用户不是代理商，只能查看自己的订单
        target_user_id = user_id if user_id else current_user.id
        
        if not current_user.is_agent and target_user_id != current_user.id:
            logger.warning(f"[StaticOrder] 非代理商用户 {current_user.id} 尝试查看用户 {target_user_id} 的订单列表")
            raise HTTPException(status_code=403, detail="没有权限查看其他用户的订单")
            
        logger.info(f"[StaticOrder] 查询用户 {target_user_id} 的订单列表")
        
        service = StaticOrderService(db, IPIPVBaseAPI())
        result = await service.list_orders(
            user_id=target_user_id,
            page=page,
            page_size=page_size
        )
        
        # 转换返回格式以匹配前端期望
        return {
            "code": 0,
            "msg": "success",
            "data": {
                "total": result["data"]["total"],
                "list": [
                    {
                        **order,
                        "userId": order["user_id"],
                        "agentId": order["agent_id"],
                        "productNo": order["product_no"],
                        "proxyType": order["proxy_type"],
                        "regionCode": order["region_code"],
                        "countryCode": order["country_code"],
                        "cityCode": order["city_code"],
                        "staticType": order["static_type"],
                        "ipCount": order["ip_count"],
                        "createdAt": order["created_at"].isoformat() if isinstance(order["created_at"], datetime) else order["created_at"],
                        "updatedAt": order["updated_at"].isoformat() if isinstance(order["updated_at"], datetime) else order["updated_at"],
                    }
                    for order in result["data"]["list"]
                ]
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"获取静态代理订单列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{order_no}/v2")
async def get_static_order(
    order_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取静态代理订单信息"""
    try:
        service = StaticOrderService(db, IPIPVBaseAPI())
        result = await service.get_order_info(order_no)
        
        # 检查权限
        order_data = result['data']
        if not current_user.is_agent and current_user.id != order_data['user_id']:
            raise HTTPException(status_code=403, detail="没有权限查看此订单")
            
        return result
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"获取静态代理订单失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{order_no}/status/v2")
async def update_static_order_status(
    order_no: str,
    status: str = Body(...),
    remark: Optional[str] = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新静态代理订单状态"""
    try:
        service = StaticOrderService(db, IPIPVBaseAPI())
        
        # 先获取订单信息
        order_info = await service.get_order_info(order_no)
        order_data = order_info['data']
        
        # 检查权限
        if not current_user.is_agent and current_user.id != order_data['user_id']:
            raise HTTPException(status_code=403, detail="没有权限修改此订单")
            
        result = await service.update_order_status(
            order_no=order_no,
            status=status,
            remark=remark
        )
        return result
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"更新静态代理订单状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 