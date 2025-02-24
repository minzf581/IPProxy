from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.instance import Instance
from app.services import ProxyService
from app.core.config import settings
import logging
from typing import List
from app.models.user import User
from app.services.auth import get_current_user
from app.schemas.instance import InstanceResponse, WhitelistResponse
from app.schemas.common import Response

router = APIRouter(
    prefix="/instances",
    tags=["instances"]
)

logger = logging.getLogger(__name__)

@router.get("/{instance_id}/whitelist", response_model=WhitelistResponse)
async def get_instance_whitelist(
    instance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取实例的 IP 白名单"""
    instance = db.query(Instance).filter(
        Instance.id == instance_id,
        Instance.user_id == current_user.id
    ).first()
    
    if not instance:
        raise HTTPException(status_code=404, detail="实例不存在")
        
    return {
        "code": 0,
        "message": "success",
        "data": {
            "instance_id": instance.id,
            "whitelist": instance.ip_whitelist_list
        }
    }

@router.post("/{instance_id}/whitelist/add", response_model=Response)
async def add_ip_to_whitelist(
    instance_id: int,
    ip: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """添加 IP 到白名单"""
    instance = db.query(Instance).filter(
        Instance.id == instance_id,
        Instance.user_id == current_user.id
    ).first()
    
    if not instance:
        raise HTTPException(status_code=404, detail="实例不存在")
        
    if instance.add_ip_to_whitelist(ip):
        db.commit()
        return {"code": 0, "message": "IP 添加成功"}
    else:
        return {"code": 1, "message": "IP 已存在于白名单中"}

@router.post("/{instance_id}/whitelist/remove", response_model=Response)
async def remove_ip_from_whitelist(
    instance_id: int,
    ip: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """从白名单中移除 IP"""
    instance = db.query(Instance).filter(
        Instance.id == instance_id,
        Instance.user_id == current_user.id
    ).first()
    
    if not instance:
        raise HTTPException(status_code=404, detail="实例不存在")
        
    if instance.remove_ip_from_whitelist(ip):
        db.commit()
        return {"code": 0, "message": "IP 移除成功"}
    else:
        return {"code": 1, "message": "IP 不在白名单中"}

@router.post("/{instance_id}/whitelist/clear", response_model=Response)
async def clear_instance_whitelist(
    instance_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """清空实例的 IP 白名单"""
    instance = db.query(Instance).filter(
        Instance.id == instance_id,
        Instance.user_id == current_user.id
    ).first()
    
    if not instance:
        raise HTTPException(status_code=404, detail="实例不存在")
        
    instance.clear_whitelist()
    db.commit()
    return {"code": 0, "message": "白名单已清空"}

@router.get("/instance/sync/v2")
async def sync_instances(db: Session = Depends(get_db)):
    try:
        # 使用配置中的主账号
        params = {
            "instanceNo": settings.IPPROXY_MAIN_USERNAME,
            "page": 1,
            "pageSize": 100
        }
        
        logger.info(f"Syncing instances with params: {params}")
        
        # 调用 API 获取实例列表
        service = ProxyService()
        response = await service.get_instances(params)
        
        if not response or "data" not in response:
            raise HTTPException(status_code=500, detail="Failed to get instance list")
            
        instances = response["data"].get("list", [])
        logger.info(f"Got {len(instances)} instances from API")
        
        # 更新数据库中的实例信息
        created_count = 0
        updated_count = 0
        
        for instance_data in instances:
            instance = db.query(Instance).filter(
                Instance.instance_id == instance_data["instanceId"]
            ).first()
            
            if instance:
                # 更新现有实例
                for key, value in instance_data.items():
                    setattr(instance, key, value)
                updated_count += 1
            else:
                # 创建新实例
                instance = Instance(**instance_data)
                db.add(instance)
                created_count += 1
        
        db.commit()
        logger.info(f"Sync completed: {created_count} instances created, {updated_count} instances updated")
        
        return {
            "message": "Instance sync completed",
            "created": created_count,
            "updated": updated_count
        }
        
    except Exception as e:
        logger.error(f"Error syncing instances: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/instance/v2")
async def get_instances(db: Session = Depends(get_db)):
    try:
        instances = db.query(Instance).all()
        return instances
    except Exception as e:
        logger.error(f"Error getting instances: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 