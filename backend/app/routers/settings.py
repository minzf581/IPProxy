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
from app.utils.auth import get_current_user
from typing import Dict, List, Any
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
async def get_agent_prices(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """获取代理商价格设置"""
    try:
        logger.info(f"获取代理商 {agent_id} 的价格设置，当前用户ID: {current_user.id}")
        
        # 检查权限：
        # 1. 管理员可以查看所有价格
        # 2. 代理商可以查看自己的价格
        # 3. 普通用户可以查看其所属代理商的价格
        if not current_user.is_admin and current_user.id != agent_id and current_user.agent_id != agent_id:
            logger.warning(f"用户 {current_user.id} 尝试访问代理商 {agent_id} 的价格设置被拒绝")
            raise HTTPException(
                status_code=403,
                detail={"code": 403, "message": "没有权限访问此资源"}
            )
            
        # 获取代理商价格配置
        agent_price = db.query(AgentPrice).filter(AgentPrice.agent_id == agent_id).first()
        if not agent_price:
            logger.warning(f"代理商 {agent_id} 没有价格配置，返回默认价格")
            return {
                "code": 0,
                "msg": "success",
                "data": {
                    "dynamic": {
                        "pool1": 0.1,  # 默认价格
                        "pool2": 0.2
                    },
                    "static": {
                        "residential": 0.3,
                        "datacenter": 0.4
                    }
                }
            }
            
        # 返回价格配置
        return {
            "code": 0,
            "msg": "success",
            "data": {
                "dynamic": {
                    "pool1": float(agent_price.dynamic_proxy_price),
                    "pool2": float(agent_price.dynamic_proxy_price * 1.5)  # 高级池价格上浮50%
                },
                "static": {
                    "residential": float(agent_price.static_proxy_price),
                    "datacenter": float(agent_price.static_proxy_price * 0.8)  # 数据中心价格下浮20%
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取代理商价格设置失败: {str(e)}")
        logger.exception(e)
        raise HTTPException(
            status_code=500,
            detail={"code": 500, "message": "获取价格设置失败"}
        )

@router.put("/agent/{agent_id}/prices")
async def update_agent_prices(
    agent_id: int,
    prices: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """更新代理商价格设置"""
    try:
        logger.info(f"更新代理商 {agent_id} 的价格设置: {prices}")
        
        # 检查权限
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="只有管理员可以修改价格设置")
            
        # 获取或创建代理商价格配置
        agent_price = db.query(AgentPrice).filter(AgentPrice.agent_id == agent_id).first()
        if not agent_price:
            agent_price = AgentPrice(agent_id=agent_id)
            db.add(agent_price)
            
        # 更新价格
        if "dynamic" in prices:
            agent_price.dynamic_proxy_price = prices["dynamic"].get("pool1", 0.1)
        if "static" in prices:
            agent_price.static_proxy_price = prices["static"].get("residential", 0.3)
            
        db.commit()
        
        return {
            "code": 0,
            "msg": "success",
            "data": {
                "dynamic": {
                    "pool1": float(agent_price.dynamic_proxy_price),
                    "pool2": float(agent_price.dynamic_proxy_price * 1.5)
                },
                "static": {
                    "residential": float(agent_price.static_proxy_price),
                    "datacenter": float(agent_price.static_proxy_price * 0.8)
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"更新代理商价格设置失败: {str(e)}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail="更新价格设置失败") 