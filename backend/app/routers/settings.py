from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.resource_type import ResourceType
from app.models.agent_price import AgentPrice
from app.models.user import User
from app.services.auth import get_current_user
from typing import Dict, List
from decimal import Decimal
import logging

# 设置日志记录器
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings")

@router.get("/resource-types")
def get_resource_types(db: Session = Depends(get_db)):
    """获取所有资源类型"""
    try:
        resource_types = db.query(ResourceType).all()
        return {
            "code": 0,
            "msg": "success",
            "data": [rt.to_dict() for rt in resource_types]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/price")
def get_resource_prices(db: Session = Depends(get_db)):
    """获取所有资源价格"""
    try:
        resource_types = db.query(ResourceType).all()
        prices = {f"resource_{rt.id}": float(rt.price) for rt in resource_types}
        return {
            "code": 0,
            "msg": "success",
            "data": prices
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/price")
def update_resource_prices(prices: Dict[str, float], db: Session = Depends(get_db)):
    """更新资源价格"""
    try:
        for key, price in prices.items():
            if not key.startswith("resource_"):
                continue
            resource_id = int(key.split("_")[1])
            resource = db.query(ResourceType).filter(ResourceType.id == resource_id).first()
            if resource:
                resource.price = Decimal(str(price))
        db.commit()
        return {
            "code": 0,
            "msg": "success"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agent/{agent_id}/prices")
async def get_agent_prices(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取代理商价格设置"""
    try:
        logger.info(f"正在获取代理商 {agent_id} 的价格设置")
        
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            logger.warning(f"代理商 {agent_id} 不存在")
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
        
        logger.info(f"当前用户ID: {current_user.id}, 是否管理员: {current_user.is_admin}")
        # 检查权限：管理员可以查看所有代理商的价格，代理商只能查看自己的价格
        if not current_user.is_admin and current_user.id != agent_id:
            logger.warning(f"用户 {current_user.id} 尝试访问代理商 {agent_id} 的价格设置，权限不足")
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 获取价格设置
        price_settings = db.query(AgentPrice).filter(AgentPrice.agent_id == agent_id).first()
        if not price_settings:
            logger.info(f"代理商 {agent_id} 没有价格设置，创建默认设置")
            # 如果没有设置，创建默认价格设置
            price_settings = AgentPrice(
                agent_id=agent_id,
                dynamic_proxy_price=Decimal('0.1'),
                static_proxy_price=Decimal('0.2')
            )
            try:
                db.add(price_settings)
                db.commit()
                db.refresh(price_settings)
            except Exception as e:
                logger.error(f"创建默认价格设置失败: {str(e)}")
                db.rollback()
                raise HTTPException(status_code=500, detail={"code": 500, "message": "创建默认价格设置失败"})
        
        result = price_settings.to_dict()
        logger.info(f"成功获取代理商 {agent_id} 的价格设置: {result}")
        return {
            "code": 0,
            "message": "success",
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取代理商 {agent_id} 的价格设置时发生错误: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.post("/agent/{agent_id}/prices")
async def update_agent_prices(
    agent_id: int,
    prices: Dict[str, float],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新代理商价格设置"""
    try:
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
        
        # 检查权限：只有管理员可以更新价格
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 获取或创建价格设置
        price_settings = db.query(AgentPrice).filter(AgentPrice.agent_id == agent_id).first()
        if not price_settings:
            price_settings = AgentPrice(
                agent_id=agent_id,
                dynamic_proxy_price=Decimal('0.1'),
                static_proxy_price=Decimal('0.2')
            )
            db.add(price_settings)
        
        # 更新价格
        if 'dynamic_proxy_price' in prices:
            price_settings.dynamic_proxy_price = Decimal(str(prices['dynamic_proxy_price']))
        if 'static_proxy_price' in prices:
            price_settings.static_proxy_price = Decimal(str(prices['static_proxy_price']))
        
        db.commit()
        db.refresh(price_settings)
        
        return {
            "code": 0,
            "message": "价格设置更新成功",
            "data": price_settings.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)}) 