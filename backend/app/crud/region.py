from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.area import Area
import logging

logger = logging.getLogger(__name__)


def get_multi(db: Session) -> List[Area]:
    """获取所有启用的区域"""
    try:
        areas = db.query(Area).filter(Area.enable == True).all()
        return areas
    except Exception as e:
        logger.error(f"获取区域列表失败: {e}")
        return []


def get_by_code(db: Session, code: str) -> Optional[Area]:
    """根据代码获取启用的区域"""
    try:
        return db.query(Area).filter(Area.area_code == code, Area.enable == True).first()
    except Exception as e:
        logger.error(f"查询区域失败，code: {code}, error: {e}")
        return None


def create_or_update(db: Session, obj_in: Dict[str, Any]) -> Area:
    """创建或更新区域
    
    如果区域存在则更新，否则创建新区域。
    """
    try:
        area = db.query(Area).filter(Area.area_code == obj_in["area_code"]).first()
        if area:
            logger.info(f"更新区域: {obj_in['area_code']}")
            for key, value in obj_in.items():
                if hasattr(area, key):
                    setattr(area, key, value)
        else:
            logger.info(f"创建区域: {obj_in['area_code']}")
            area = Area(
                area_code=obj_in["area_code"],
                area_name=obj_in["area_name"],
                enable=obj_in.get("enable", True)
            )
            db.add(area)
        db.commit()
        db.refresh(area)
        return area
    except Exception as e:
        db.rollback()
        logger.error(f"create_or_update 操作失败: {e}")
        raise


def delete_by_code(db: Session, code: str) -> bool:
    """根据区域代码进行逻辑删除, 将enable更新为False"""
    try:
        area = db.query(Area).filter(Area.area_code == code, Area.enable == True).first()
        if area:
            area.enable = False
            db.commit()
            logger.info(f"区域 {code} 删除成功")
            return True
        logger.warning(f"区域 {code} 不存在或已删除")
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"删除区域失败, code: {code}, error: {e}")
        return False 