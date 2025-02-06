from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.static_order_service import StaticOrderService
from app.services.ipipv_base_api import IPIPVBaseAPI
from app.utils.auth import get_current_user
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/static-order/create")
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

@router.get("/static-order/{order_no}")
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

@router.put("/static-order/{order_no}/status")
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