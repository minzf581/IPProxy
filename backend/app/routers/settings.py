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

from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.resource_type import ResourceType
from app.models.user import User
from app.models.prices import AgentPrice
from app.models.product_inventory import ProductInventory
from typing import Dict, Any, List, Optional
from app.services.auth import get_current_user
from app.crud import product_prices
import logging

# 设置日志记录器
logger = logging.getLogger(__name__)

router = APIRouter(tags=["设置"])

@router.get("/settings/resource-types")
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

@router.get("/settings/prices")
async def get_resource_prices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取所有资源价格"""
    try:
        if not current_user.is_admin:
            raise HTTPException(
                status_code=403,
                detail="只有管理员可以查看价格设置"
            )
            
        prices = await product_prices.get_prices(db, is_global=True)
        return {
            "code": 0,
            "msg": "success",
            "data": prices
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取价格配置失败: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={
                "code": 500,
                "message": f"获取价格配置失败: {str(e)}"
            }
        )

@router.post("/settings/price")
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

@router.get("/settings/agent/{agent_id}/prices")
async def get_agent_prices(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商价格设置"""
    try:
        logger.info(f"获取代理商价格设置: agent_id={agent_id}, current_user_id={current_user.id}, is_admin={current_user.is_admin}, is_agent={current_user.is_agent}")
        
        # 权限检查：只有管理员或者代理商自己可以查看价格设置
        if not current_user.is_admin and (current_user.id != agent_id or not current_user.is_agent):
            logger.warning(f"权限不足: current_user_id={current_user.id}, is_agent={current_user.is_agent}, agent_id={agent_id}")
            raise HTTPException(status_code=403, detail="没有权限访问此资源")
            
        # 检查目标代理商是否存在且是代理商
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            logger.warning(f"代理商不存在或用户不是代理商: agent_id={agent_id}")
            raise HTTPException(status_code=404, detail="代理商不存在")
            
        # 返回价格配置
        # TODO: 从数据库获取实际价格配置，这里先返回默认配置
        default_config = {
            "code": 0,
            "msg": "success",
            "data": {
                "dynamic": {
                    "pool1": 100,
                    "pool2": 200
                },
                "static": {
                    "residential": 300,
                    "datacenter": 400
                }
            }
        }
        logger.info(f"返回默认价格配置: agent_id={agent_id}")
        return default_config
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取代理商价格设置失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/settings/agent/{agent_id}/prices")
async def update_agent_prices(
    agent_id: int,
    prices: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新代理商价格设置"""
    try:
        logger.info(f"更新代理商价格设置: agent_id={agent_id}, prices={prices}")
        
        # 权限检查
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="只有管理员可以修改价格设置")
            
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            raise HTTPException(status_code=404, detail="代理商不存在")
            
        # TODO: 保存价格配置到数据库
        
        return {
            "code": 0,
            "msg": "success",
            "data": None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新代理商价格设置失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings/prices/batch")
async def batch_update_prices(
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """批量更新价格设置"""
    try:
        logger.info(f"收到价格更新请求数据: {request_data}")
        
        # 权限检查
        if not current_user.is_admin and not current_user.is_agent:
            raise HTTPException(status_code=403, detail="没有权限修改价格设置")
        
        # 验证请求数据
        if not isinstance(request_data, dict) or 'prices' not in request_data:
            logger.error(f"无效的请求数据格式: {request_data}")
            raise HTTPException(status_code=400, detail="无效的请求数据格式")
        
        prices = request_data['prices']
        is_global = request_data.get('is_global', True)
        agent_id = request_data.get('agent_id')
        
        if not isinstance(prices, list):
            logger.error("价格数据必须是数组格式")
            raise HTTPException(status_code=400, detail="价格数据必须是数组格式")
        
        if not prices:
            logger.error("没有需要更新的数据")
            raise HTTPException(status_code=400, detail="没有需要更新的数据")
        
        logger.info(f"开始处理 {len(prices)} 条价格数据")
        logger.info(f"更新模式: {'全局价格' if is_global else '代理商价格'}")
        if agent_id:
            logger.info(f"代理商ID: {agent_id}")
        
        # 处理价格更新
        total = len(prices)
        success = 0
        failed = 0
        
        for price_data in prices:
            try:
                logger.info(f"处理价格数据: {price_data}")
                product_id = price_data.get('product_id')
                if not product_id:
                    logger.warning(f"缺少产品ID: {price_data}")
                    failed += 1
                    continue
                
                product = db.query(ProductInventory).filter(
                    ProductInventory.id == product_id
                ).first()
                
                if not product:
                    logger.warning(f"未找到产品: {product_id}")
                    failed += 1
                    continue
                
                if is_global:
                    old_price = product.global_price
                    new_price = float(price_data['price'])
                    product.global_price = new_price
                    logger.info(f"更新全局价格: product_id={product_id}, old={old_price}, new={new_price}")
                    
                    if 'min_agent_price' in price_data:
                        old_min = product.min_agent_price
                        new_min = float(price_data['min_agent_price'])
                        product.min_agent_price = new_min
                        logger.info(f"更新最低代理商价格: product_id={product_id}, old={old_min}, new={new_min}")
                
                elif agent_id:
                    agent_price = db.query(AgentPrice).filter(
                        AgentPrice.agent_id == agent_id,
                        AgentPrice.product_id == product_id
                    ).first()
                    
                    new_price = float(price_data['price'])
                    
                    if agent_price:
                        old_price = agent_price.price
                        agent_price.price = new_price
                        logger.info(f"更新代理商价格: agent_id={agent_id}, product_id={product_id}, old={old_price}, new={new_price}")
                    else:
                        agent_price = AgentPrice(
                            agent_id=agent_id,
                            product_id=product_id,
                            price=new_price
                        )
                        db.add(agent_price)
                        logger.info(f"创建代理商价格记录: agent_id={agent_id}, product_id={product_id}, price={new_price}")
                
                success += 1
                
            except Exception as e:
                logger.error(f"更新产品价格失败: {str(e)}")
                failed += 1
                continue
        
        try:
            db.commit()
            logger.info(f"价格更新完成: 总数={total}, 成功={success}, 失败={failed}")
            return {
                "code": 0,
                "msg": "success",
                "data": {
                    "total": total,
                    "success": success,
                    "failed": failed
                }
            }
        except Exception as e:
            db.rollback()
            logger.error(f"提交数据库更改失败: {str(e)}")
            raise HTTPException(status_code=500, detail="数据库更新失败")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"批量更新价格失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 