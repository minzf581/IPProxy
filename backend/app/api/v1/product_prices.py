from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from typing import List
from sqlalchemy.orm import Session
from app.schemas.product import (
    ProductPriceBase,
    ProductPriceUpdateRequest,
    ProductPriceResponse,
    BatchImportRequest
)
from app.crud import product_prices
from app.core.deps import get_db, get_current_user, get_static_order_service
from app.models.user import User
from app.services.static_order_service import StaticOrderService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def check_price_permission(user: User, is_global: bool, agent_id: int = None) -> bool:
    """检查用户是否有权限访问或修改价格"""
    if is_global:
        return user.is_admin
    if agent_id:
        return user.is_admin or user.id == agent_id
    return False

@router.get("/prices", response_model=ProductPriceResponse)
async def get_prices(
    is_global: bool,
    agent_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取价格列表"""
    if not check_price_permission(current_user, is_global, agent_id):
        raise HTTPException(
            status_code=403,
            detail="没有权限访问价格信息"
        )
    
    try:
        prices = product_prices.get_prices(db, is_global, agent_id)
        return {
            "code": 200,
            "message": "success",
            "data": [price.dict() for price in prices]
        }
    except Exception as e:
        logger.error(f"获取价格信息失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"获取价格信息失败: {str(e)}"
        )

@router.post("/prices/sync")
async def sync_prices(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    static_order_service: StaticOrderService = Depends(get_static_order_service)
):
    """触发价格同步（仅管理员可用）"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="没有权限执行同步操作"
        )
    
    try:
        background_tasks.add_task(static_order_service.sync_product_inventory)
        return {
            "code": 200,
            "message": "同步任务已启动"
        }
    except Exception as e:
        logger.error(f"触发同步任务失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="触发同步任务失败"
        )

@router.post("/prices")
async def update_prices(
    request: ProductPriceUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新价格"""
    if not check_price_permission(current_user, request.is_global, request.agent_id):
        raise HTTPException(
            status_code=403,
            detail="没有权限修改价格"
        )
    
    try:
        product_prices.update_prices(db, request)
        return {
            "code": 200,
            "message": "价格更新成功"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"更新价格失败: {str(e)}"
        )

@router.post("/prices/import")
async def import_prices(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """导入价格数据"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="只有管理员可以导入价格数据"
        )
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="只支持Excel文件格式"
        )
    
    try:
        result = await product_prices.import_prices(db, file)
        return {
            "code": 200,
            "message": "导入成功",
            "data": {
                "total": result.get("total", 0),
                "success": result.get("success", 0),
                "failed": result.get("failed", 0)
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"导入失败: {str(e)}"
        )

@router.post("/prices/batch-import")
async def batch_import_prices(
    request: BatchImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量导入价格数据"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="只有管理员可以导入价格数据"
        )
    
    try:
        result = product_prices.batch_import_prices(db, request.prices)
        return {
            "code": 200,
            "message": "导入成功",
            "data": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"导入失败: {str(e)}"
        ) 