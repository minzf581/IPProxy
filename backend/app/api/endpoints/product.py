from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.static_order_service import StaticOrderService
from app.services.ipipv_base_api import IPIPVBaseAPI
from app.utils.auth import get_current_user
import logging
from pydantic import BaseModel, Field
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter()

class BusinessActivationRequest(BaseModel):
    userId: str = Field(..., description="用户ID")
    username: str = Field(..., description="用户名")
    agentId: str = Field(..., description="代理商ID")
    agentUsername: str = Field(..., description="代理商用户名")
    proxyType: str = Field(..., description="代理类型")
    poolType: Optional[str] = Field(None, description="动态代理池类型")
    traffic: Optional[str] = Field(None, description="流量大小")
    region: Optional[str] = Field(None, description="区域")
    country: Optional[str] = Field(None, description="国家")
    city: Optional[str] = Field(None, description="城市")
    staticType: Optional[str] = Field(None, description="静态代理类型")
    ipRange: Optional[str] = Field(None, description="IP范围")
    duration: Optional[int] = Field(None, description="时长")
    quantity: Optional[int] = Field(None, description="数量")
    remark: Optional[str] = Field(None, description="备注")
    total_cost: float = Field(..., description="总费用")

@router.post("/proxy/inventory/sync")
async def sync_product_inventory(db: Session = Depends(get_db)):
    """同步产品库存"""
    try:
        service = StaticOrderService(db, IPIPVBaseAPI())
        logger.info("开始同步产品库存")
        success = await service.sync_product_inventory()
        
        if not success:
            logger.error("同步产品库存失败")
            return {
                "code": 500,
                "msg": "同步产品库存失败",
                "data": None
            }
            
        logger.info("同步产品库存成功")
        return {
            "code": 0,
            "msg": "同步成功",
            "data": None
        }
    except Exception as e:
        logger.error(f"同步产品库存出错: {str(e)}")
        return {
            "code": 500,
            "msg": str(e),
            "data": None
        }

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

@router.post("/product/user/activate-business")
async def activate_business(
    request: BusinessActivationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """业务开通"""
    try:
        logger.info("[业务激活] 开始处理业务激活请求")
        logger.info(f"[业务激活] 请求数据: {request}")

        # 1. 检查权限
        if not current_user.is_admin and str(current_user.id) != request.userId:
            raise HTTPException(
                status_code=403,
                detail="没有权限执行此操作"
            )

        # 2. 验证业务参数
        if request.proxyType == 'dynamic':
            if not request.poolType or not request.traffic:
                raise HTTPException(
                    status_code=400,
                    detail="动态代理需要填写IP池和流量信息"
                )
        else:
            if not all([request.region, request.country, request.staticType, request.duration, request.quantity]):
                raise HTTPException(
                    status_code=400,
                    detail="静态代理需要填写完整的区域和代理信息"
                )

        # 3. 创建订单
        service = StaticOrderService(db, IPIPVBaseAPI())
        result = await service.create_order(
            user_id=int(request.userId),
            username=request.username,
            agent_id=int(request.agentId),
            agent_username=request.agentUsername,
            order_data=request.dict()
        )

        return {
            "code": 0,
            "msg": "success",
            "data": result
        }

    except ValueError as e:
        logger.error(f"[业务激活] 参数错误: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[业务激活] 处理失败: {str(e)}")
        logger.exception(e)
        raise HTTPException(
            status_code=500,
            detail=f"业务激活失败: {str(e)}"
        )

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
        Dict: 包含产品列表的响应
    """
    try:
        logger.info("[产品查询] 开始调用服务层查询产品")
        logger.info(f"[产品查询] 请求参数: {params}")
        
        # 验证必要参数
        if not params:
            raise ValueError("请求参数不能为空")
            
        if "proxyType" not in params:
            params["proxyType"] = [103]  # 默认使用静态国外家庭代理
            
        if not isinstance(params["proxyType"], list):
            params["proxyType"] = [params["proxyType"]]
            
        # 确保所有参数都是正确的类型
        if "regionCode" in params and not isinstance(params["regionCode"], str):
            params["regionCode"] = str(params["regionCode"])
            
        if "countryCode" in params and not isinstance(params["countryCode"], str):
            params["countryCode"] = str(params["countryCode"])
            
        if "cityCode" in params and not isinstance(params["cityCode"], str):
            params["cityCode"] = str(params["cityCode"])
            
        if "staticType" in params and not isinstance(params["staticType"], str):
            params["staticType"] = str(params["staticType"])
            
        service = StaticOrderService(db, IPIPVBaseAPI())
        result = await service.query_products(params)
        
        if not result:
            logger.warning("[产品查询] 未找到匹配的产品")
            return {
                "code": 0,
                "msg": "success",
                "data": []
            }
            
        logger.info(f"[产品查询] 查询成功，找到 {len(result.get('data', []))} 个产品")
        return result
        
    except ValueError as e:
        logger.error(f"[产品查询] 参数错误: {str(e)}")
        return JSONResponse(
            status_code=400,
            content={
                "code": 400,
                "msg": str(e),
                "data": None
            }
        )
    except Exception as e:
        logger.error(f"[产品查询] 发生错误: {str(e)}")
        logger.exception(e)
        return JSONResponse(
            status_code=500,
            content={
                "code": 500,
                "msg": f"查询产品列表失败: {str(e)}",
                "data": None
            }
        ) 