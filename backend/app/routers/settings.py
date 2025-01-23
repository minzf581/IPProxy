from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.resource_type import ResourceType
from typing import Dict, List

router = APIRouter()

@router.get("/api/settings/resource-types")
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

@router.get("/api/settings/price")
def get_resource_prices(db: Session = Depends(get_db)):
    """获取所有资源价格"""
    try:
        resource_types = db.query(ResourceType).all()
        prices = {f"resource_{rt.id}": rt.price for rt in resource_types}
        return {
            "code": 0,
            "msg": "success",
            "data": prices
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/settings/price")
def update_resource_prices(prices: Dict[str, float], db: Session = Depends(get_db)):
    """更新资源价格"""
    try:
        for key, price in prices.items():
            if not key.startswith("resource_"):
                continue
            resource_id = int(key.split("_")[1])
            resource = db.query(ResourceType).filter(ResourceType.id == resource_id).first()
            if resource:
                resource.price = price
        db.commit()
        return {
            "code": 0,
            "msg": "success"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 