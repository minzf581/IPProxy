from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import requests
import json
from datetime import datetime

from app.database import get_db
from app.models.dashboard import ProxyInfo, ResourceUsage
from app.config import settings

router = APIRouter()

def fetch_from_ipipv_api(endpoint: str) -> Dict[str, Any]:
    """从IPIPV API获取数据"""
    try:
        response = requests.get(f"{settings.IPIPV_API_BASE_URL}{endpoint}")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data from IPIPV API: {str(e)}")

def get_proxy_info_from_db(db: Session) -> ProxyInfo:
    """从数据库获取代理信息"""
    proxy_info = db.query(ProxyInfo).first()
    if not proxy_info:
        raise HTTPException(status_code=404, detail="Proxy info not found in database")
    return proxy_info

def get_resource_usage_from_db(db: Session) -> tuple[List[ResourceUsage], List[ResourceUsage]]:
    """从数据库获取资源使用信息"""
    dynamic_resources = db.query(ResourceUsage).filter_by(resource_type="dynamic").all()
    static_resources = db.query(ResourceUsage).filter_by(resource_type="static").all()
    if not dynamic_resources or not static_resources:
        raise HTTPException(status_code=404, detail="Resource usage data not found in database")
    return dynamic_resources, static_resources

def update_proxy_balance_from_api(db: Session, proxy_info: ProxyInfo) -> ProxyInfo:
    """从API更新代理余额信息"""
    try:
        api_data = fetch_from_ipipv_api("/api/open/app/proxy/info/v2")
        if api_data.get("code") == 0:
            data = api_data.get("data", {})
            proxy_info.balance = data.get("balance", proxy_info.balance)
            proxy_info.updated_at = datetime.now()
            db.commit()
            db.refresh(proxy_info)
    except Exception as e:
        # API获取失败时继续使用数据库中的数据
        pass
    return proxy_info

def update_resource_usage_from_api(db: Session, dynamic_resources: List[ResourceUsage], 
                                 static_resources: List[ResourceUsage]) -> tuple[List[ResourceUsage], List[ResourceUsage]]:
    """从API更新资源使用信息"""
    try:
        api_data = fetch_from_ipipv_api("/api/open/app/proxy/info/v2")
        if api_data.get("code") == 0:
            data = api_data.get("data", {})
            
            # 更新动态资源
            for item in data.get("dynamic_resource", []):
                resource = next((r for r in dynamic_resources if r.title == item.get("title")), None)
                if resource:
                    resource.used = item.get("used", resource.used)
                    resource.today = item.get("today", resource.today)
                    resource.percentage = item.get("percentage", resource.percentage)
                    resource.updated_at = datetime.now()
            
            # 更新静态资源
            for item in data.get("static_resource", []):
                resource = next((r for r in static_resources if r.title == item.get("title")), None)
                if resource:
                    resource.used = item.get("used", resource.used)
                    resource.today = item.get("today", resource.today)
                    resource.available = item.get("available", resource.available)
                    resource.percentage = item.get("percentage", resource.percentage)
                    resource.updated_at = datetime.now()
            
            db.commit()
            for resource in dynamic_resources + static_resources:
                db.refresh(resource)
    except Exception as e:
        # API获取失败时继续使用数据库中的数据
        pass
    return dynamic_resources, static_resources

@router.get("/dashboard/info")
async def get_dashboard_info(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """获取仪表盘信息"""
    try:
        # 首先从数据库获取所有数据
        proxy_info = get_proxy_info_from_db(db)
        dynamic_resources, static_resources = get_resource_usage_from_db(db)
        
        # 尝试从API更新部分数据
        proxy_info = update_proxy_balance_from_api(db, proxy_info)
        dynamic_resources, static_resources = update_resource_usage_from_api(db, dynamic_resources, static_resources)
        
        # 返回数据
        return {
            "balance": proxy_info.balance,
            "total_recharge": proxy_info.total_recharge,
            "total_consumption": proxy_info.total_consumption,
            "month_recharge": proxy_info.month_recharge,
            "month_consumption": proxy_info.month_consumption,
            "last_month_consumption": proxy_info.last_month_consumption,
            "dynamic_resource": [
                {
                    "title": r.title,
                    "total": r.total,
                    "used": r.used,
                    "today": r.today,
                    "last_month": r.last_month,
                    "percentage": r.percentage
                } for r in dynamic_resources
            ],
            "static_resource": [
                {
                    "title": r.title,
                    "total": r.total,
                    "used": r.used,
                    "today": r.today,
                    "last_month": r.last_month,
                    "available": r.available,
                    "percentage": r.percentage
                } for r in static_resources
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/statistics")
async def get_dashboard_statistics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """获取流量使用统计"""
    try:
        # 从数据库获取数据
        proxy_info = get_proxy_info_from_db(db)
        
        return {
            "month_consumption": proxy_info.month_consumption,
            "last_month_consumption": proxy_info.last_month_consumption
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
