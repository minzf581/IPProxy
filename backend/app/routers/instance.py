from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.main_user import MainUser
from app.models.instance import Instance
from app.services import ProxyService
import logging

router = APIRouter(prefix="/api/open/app")
logger = logging.getLogger(__name__)

@router.get("/instance/sync/v2")
async def sync_instances(db: Session = Depends(get_db)):
    try:
        # 获取主账号信息
        main_user = db.query(MainUser).filter(MainUser.app_username == "admin").first()
        if not main_user:
            raise HTTPException(status_code=404, detail="Main user not found")

        # 使用主账号的 app_username 作为实例编号
        params = {
            "instanceNo": main_user.app_username,
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