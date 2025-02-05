"""
系统设置路由模块
==============

此模块处理所有与系统设置相关的路由请求，包括：
- 资源类型管理
- 价格配置管理
- 代理商价格设置
- 系统参数配置

重要提示：
---------
1. 此模块涉及核心业务参数，修改需要谨慎
2. 所有价格修改需要记录日志
3. 权限控制需要严格执行

依赖关系：
---------
- 数据模型：
  - ResourceType (app/models/resource_type.py)
  - AgentPrice (app/models/agent_price.py)
  - User (app/models/user.py)
- 服务：
  - AuthService (app/services/auth.py)

前端对应：
---------
- 服务层：src/services/settingsService.ts
- 页面组件：src/pages/settings/index.tsx
- 类型定义：src/types/settings.ts

功能流程：
---------
1. 资源类型管理：
   - 查询资源类型列表
   - 更新资源类型配置
   - 维护资源类型状态

2. 价格配置管理：
   - 获取资源价格列表
   - 更新资源价格设置
   - 价格变更记录

3. 代理商价格设置：
   - 获取代理商价格
   - 更新代理商价格
   - 价格权限控制

修改注意事项：
------------
1. 数据验证：
   - 价格范围验证
   - 数据类型转换
   - 精度控制
   - 有效性检查

2. 权限控制：
   - 管理员权限验证
   - 代理商权限限制
   - 操作日志记录
   - 变更通知

3. 错误处理：
   - 参数验证错误
   - 数据库操作异常
   - 并发修改冲突
   - 系统异常处理

4. 性能优化：
   - 缓存配置数据
   - 批量更新处理
   - 异步日志记录
   - 并发控制
"""

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
async def get_resource_prices(db: Session = Depends(get_db)):
    """获取所有资源价格"""
    try:
        # 返回固定的价格配置
        prices = {
            "dynamic": {
                "pool1": 0.1,  # 动态代理池1的价格
                "pool2": 0.2   # 动态代理池2的价格
            },
            "static": {
                "residential": 0.3,  # 住宅代理价格
                "datacenter": 0.4    # 数据中心代理价格
            }
        }
        return {
            "code": 0,
            "msg": "success",
            "data": prices
        }
    except Exception as e:
        logger.error(f"获取价格配置失败: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={
                "code": 500,
                "message": f"获取价格配置失败: {str(e)}"
            }
        )

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
async def get_resource_prices(
    agent_id: int,
    db: Session = Depends(get_db)
):
    """获取代理商的资源价格设置"""
    try:
        logger.info(f"正在获取代理商[{agent_id}]的价格配置")
        
        # 从数据库获取代理商价格设置
        agent_price = db.query(AgentPrice).filter(AgentPrice.agent_id == agent_id).first()
        
        # 如果没有找到价格设置，使用默认价格
        if not agent_price:
            prices = {
                "dynamic": {
                    "pool1": 0.1,  # 动态代理池1的价格
                    "pool2": 0.2   # 动态代理池2的价格
                },
                "static": {
                    "residential": 0.3,  # 住宅代理价格
                    "datacenter": 0.4    # 数据中心代理价格
                }
            }
        else:
            prices = {
                "dynamic": {
                    "pool1": float(agent_price.dynamic_proxy_price),
                    "pool2": float(agent_price.dynamic_proxy_price)
                },
                "static": {
                    "residential": float(agent_price.static_proxy_price),
                    "datacenter": float(agent_price.static_proxy_price)
                }
            }
        
        logger.info(f"成功获取代理商[{agent_id}]的价格配置: {prices}")
        return {
            "code": 0,
            "msg": "success",
            "data": prices
        }
    except Exception as e:
        logger.error(f"获取代理商[{agent_id}]价格配置失败: {str(e)}")
        return {
            "code": 500,
            "msg": f"获取价格配置失败: {str(e)}",
            "data": None
        }

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