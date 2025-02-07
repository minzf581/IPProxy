from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.static_order_service import StaticOrderService
from app.services.ipipv_base_api import IPIPVBaseAPI
from app.utils.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/proxy/inventory/sync")
async def sync_product_inventory(db: Session = Depends(get_db)):
    """同步产品库存"""
    try:
        service = StaticOrderService(db, IPIPVBaseAPI())
        success = await service.sync_product_inventory()
        if not success:
            raise HTTPException(status_code=500, detail="同步产品库存失败")
        return {"message": "同步成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inventory")
async def get_product_inventory(
    area_code: Optional[str] = None,
    country_code: Optional[str] = None,
    city_code: Optional[str] = None,
    proxy_type: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """获取产品库存信息"""
    service = StaticOrderService(db, IPIPVBaseAPI())
    return service.get_product_inventory(
        area_code=area_code,
        country_code=country_code,
        city_code=city_code,
        proxy_type=proxy_type
    )

@router.post("/user/{user_id}/activate-business")
async def activate_business(
    user_id: int,
    order_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """业务开通"""
    try:
        # 检查权限
        if not current_user.is_agent and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="没有权限执行此操作")

        service = StaticOrderService(db, IPIPVBaseAPI())
        result = await service.activate_business(
            user_id=user_id,
            username=order_data["username"],
            agent_id=int(order_data["agentId"]),
            agent_username=order_data["agentUsername"],
            proxy_type=order_data["proxyType"],
            pool_type=order_data.get("poolType"),
            traffic=order_data.get("traffic"),
            region=order_data.get("region"),
            country=order_data.get("country"),
            city=order_data.get("city"),
            static_type=order_data.get("staticType"),
            ip_range=order_data.get("ipRange"),
            duration=order_data.get("duration"),
            quantity=order_data.get("quantity"),
            remark=order_data.get("remark"),
            total_cost=order_data["total_cost"]
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/user/{user_id}/deactivate-business")
async def deactivate_business(
    user_id: int,
    order_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """释放业务资源"""
    try:
        # 检查权限
        if not current_user.is_agent and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="没有权限执行此操作")

        service = StaticOrderService(db, IPIPVBaseAPI())
        result = await service.deactivate_business(
            user_id=user_id,
            order_no=order_data["orderNo"],
            proxy_type=order_data["proxyType"]
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/open/app/product/query/v2")
async def query_products(
    params: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """查询产品列表
    
    Args:
        params: 查询参数
            - proxyType: 代理类型 (101=静态云平台, 102=静态国内家庭, 103=静态国外家庭)
            - regionCode: 区域代码
            - countryCode: 国家代码
            - cityCode: 城市代码
            - staticType: 静态代理类型
            - version: API版本
    
    Returns:
        List[Dict]: 产品列表
    """
    try:
        logger.info(f"[产品查询] 收到请求参数: {params}")
        
        service = StaticOrderService(db, IPIPVBaseAPI())
        logger.info("[产品查询] 开始调用服务层查询产品")
        
        result = await service.query_products(params)
        logger.info(f"[产品查询] 查询结果: {result}")
        
        response = {
            "code": 0,
            "msg": "success",
            "data": result
        }
        logger.info(f"[产品查询] 返回响应: {response}")
        return response
        
    except Exception as e:
        logger.error(f"[产品查询] 发生错误: {str(e)}")
        logger.exception(e)
        raise HTTPException(
            status_code=500, 
            detail=f"查询产品列表失败: {str(e)}"
        ) 