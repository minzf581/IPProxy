from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import requests
import json
from datetime import datetime
import logging

from app.database import get_db
from app.models.dashboard import ProxyInfo, ResourceUsage
from app.config import settings
from app.models.instance import Instance
from app.services.ipproxy_service import IPProxyService
from app.routers.instance import sync_instances
from app.models.main_user import MainUser

router = APIRouter(prefix="/api/open/app")
logger = logging.getLogger(__name__)

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
    logger.debug("从数据库获取代理信息")
    proxy_info = db.query(ProxyInfo).first()
    if not proxy_info:
        logger.error("数据库中未找到代理信息")
        raise HTTPException(status_code=404, detail="Proxy info not found in database")
    return proxy_info

def get_resource_usage_from_db(db: Session) -> tuple[List[ResourceUsage], List[ResourceUsage]]:
    """从数据库获取资源使用信息"""
    logger.debug("从数据库获取资源使用信息")
    dynamic_resources = db.query(ResourceUsage).filter_by(resource_type="dynamic").all()
    static_resources = db.query(ResourceUsage).filter_by(resource_type="static").all()
    if not dynamic_resources or not static_resources:
        logger.error("数据库中未找到资源使用数据")
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

def sync_proxy_info(db: Session, main_user: MainUser):
    """同步代理信息到数据库"""
    try:
        service = IPProxyService()
        
        # 同步住宅代理信息
        residential_info = service._make_request("/api/open/app/proxy/info/v2", {
            "appUsername": main_user.app_username,
            "username": main_user.username,
            "proxyType": 1
        })
        
        # 同步数据中心代理信息
        datacenter_info = service._make_request("/api/open/app/proxy/info/v2", {
            "appUsername": main_user.app_username,
            "username": main_user.username,
            "proxyType": 2
        })
        
        # 更新或创建代理信息记录
        proxy_info = db.query(ProxyInfo).first()
        if not proxy_info:
            proxy_info = ProxyInfo()
            db.add(proxy_info)
        
        # 更新代理信息
        proxy_info.residential_balance = residential_info.get("balance", 0)
        proxy_info.datacenter_balance = datacenter_info.get("balance", 0)
        proxy_info.updated_at = datetime.now()
        
        db.commit()
        logger.info("代理信息同步成功")
    except Exception as e:
        logger.error(f"同步代理信息失败: {str(e)}")
        # 同步失败不抛出异常，继续使用数据库中的数据

def sync_resource_usage(db: Session, main_user: MainUser):
    """同步资源使用信息到数据库"""
    try:
        service = IPProxyService()
        
        # 获取流量使用统计
        statistics = service._make_request("/api/open/app/proxy/flow/use/log/v2", {
            "appUsername": main_user.app_username,
            "username": main_user.username,
            "proxyType": 0,
            "page": 1,
            "pageSize": 10
        })
        
        # 更新或创建资源使用记录
        resource_usage = db.query(ResourceUsage).first()
        if not resource_usage:
            resource_usage = ResourceUsage()
            db.add(resource_usage)
        
        # 更新资源使用信息
        resource_usage.monthly_usage = statistics.get("monthlyUsage", 0)
        resource_usage.daily_usage = statistics.get("dailyUsage", 0)
        resource_usage.last_month_usage = statistics.get("lastMonthUsage", 0)
        resource_usage.updated_at = datetime.now()
        
        db.commit()
        logger.info("资源使用信息同步成功")
    except Exception as e:
        logger.error(f"同步资源使用信息失败: {str(e)}")
        # 同步失败不抛出异常，继续使用数据库中的数据

@router.get("/dashboard/info/v2")
async def get_dashboard_info(db: Session = Depends(get_db)):
    try:
        # 获取主账号信息
        main_user = db.query(MainUser).filter(MainUser.app_username == "admin").first()
        if not main_user:
            raise HTTPException(status_code=404, detail="Main user not found")
            
        # 尝试同步最新数据（不阻塞主流程）
        sync_proxy_info(db, main_user)
        sync_resource_usage(db, main_user)
        
        # 从数据库获取代理信息
        proxy_info = db.query(ProxyInfo).first()
        if not proxy_info:
            proxy_info = ProxyInfo()  # 使用默认值
            
        # 从数据库获取资源使用信息
        resource_usage = db.query(ResourceUsage).first()
        if not resource_usage:
            resource_usage = ResourceUsage()  # 使用默认值
            
        # 获取实例信息
        instances = db.query(Instance).all()
        total_instances = len(instances)
        active_instances = len([i for i in instances if i.status == "active"])
        
        # 计算总流量和已使用流量
        total_flow = sum(instance.total_flow for instance in instances)
        used_flow = sum(instance.used_flow for instance in instances)
        remaining_flow = sum(instance.remaining_flow for instance in instances)
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "app_info": {
                    "residential": {
                        "balance": proxy_info.residential_balance,
                        "updated_at": proxy_info.updated_at
                    },
                    "datacenter": {
                        "balance": proxy_info.datacenter_balance,
                        "updated_at": proxy_info.updated_at
                    }
                },
                "statistics": {
                    "monthlyUsage": resource_usage.monthly_usage,
                    "dailyUsage": resource_usage.daily_usage,
                    "lastMonthUsage": resource_usage.last_month_usage,
                    "updated_at": resource_usage.updated_at
                },
                "instance_stats": {
                    "total": total_instances,
                    "active": active_instances,
                    "inactive": total_instances - active_instances
                },
                "flow_stats": {
                    "total": total_flow,
                    "used": used_flow,
                    "remaining": remaining_flow
                }
            }
        }
        
    except Exception as e:
        logger.error(f"获取仪表盘信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/statistics/v2")
async def get_dashboard_statistics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """获取流量使用统计"""
    try:
        # 从数据库获取资源使用信息
        resource_usage = db.query(ResourceUsage).first()
        if not resource_usage:
            resource_usage = ResourceUsage()  # 使用默认值
            
        return {
            "code": 0,
            "message": "success",
            "data": {
                "monthlyUsage": resource_usage.monthly_usage,
                "dailyUsage": resource_usage.daily_usage,
                "lastMonthUsage": resource_usage.last_month_usage,
                "updated_at": resource_usage.updated_at
            }
        }
        
    except Exception as e:
        logger.error(f"获取流量使用统计失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
