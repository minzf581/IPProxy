from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.region import Region
import logging

logger = logging.getLogger(__name__)


def get_multi(db: Session) -> List[Region]:
    """获取所有状态为1的区域"""
    try:
        regions = db.query(Region).filter(Region.status == 1).all()
        return regions
    except Exception as e:
        logger.error(f"获取区域列表失败: {e}")
        return []


def get_by_code(db: Session, code: str) -> Optional[Region]:
    """根据代码获取状态为1的区域"""
    try:
        return db.query(Region).filter(Region.code == code, Region.status == 1).first()
    except Exception as e:
        logger.error(f"查询区域失败，code: {code}, error: {e}")
        return None


def create_or_update(db: Session, obj_in: Dict[str, Any]) -> Region:
    """创建或更新区域
    
    如果区域存在则更新，否则创建新区域。
    """
    try:
        region = db.query(Region).filter(Region.code == obj_in["code"]).first()
        if region:
            logger.info(f"更新区域: {obj_in['code']}")
            for key, value in obj_in.items():
                if hasattr(region, key):
                    setattr(region, key, value)
        else:
            logger.info(f"创建区域: {obj_in['code']}")
            region = Region(
                code=obj_in["code"],
                name=obj_in["name"],
                status=obj_in.get("status", 1)
            )
            db.add(region)
        db.commit()
        db.refresh(region)
        return region
    except Exception as e:
        db.rollback()
        logger.error(f"create_or_update 操作失败: {e}")
        raise


def delete_by_code(db: Session, code: str) -> bool:
    """根据区域代码进行逻辑删除, 将status更新为0"""
    try:
        region = db.query(Region).filter(Region.code == code, Region.status == 1).first()
        if region:
            region.status = 0
            db.commit()
            logger.info(f"区域 {code} 删除成功")
            return True
        logger.warning(f"区域 {code} 不存在或已删除")
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"删除区域失败, code: {code}, error: {e}")
        return False 