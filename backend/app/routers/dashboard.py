from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import requests
import json
from datetime import datetime, timedelta
import logging
from sqlalchemy import func

from app.database import get_db
from app.models.dashboard import ProxyInfo, ResourceUsage
from app.config import settings
from app.models.instance import Instance
from app.services.ipproxy_service import IPProxyService
from app.routers.instance import sync_instances
from app.models.main_user import MainUser
from app.models.user import User
from app.services.auth import get_current_user
from app.services.dashboard import get_dashboard_data
from app.models.transaction import Transaction
from app.models.resource_type import ResourceType
from app.models.resource_usage import ResourceUsageStatistics, ResourceUsageHistory

router = APIRouter(prefix="/api")
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

@router.get("/open/app/dashboard/info/v2")
async def get_dashboard_data(
    agent_id: Optional[int] = Query(None, description="代理商ID，不传则返回当前用户的仪表盘数据"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """
    获取用户的仪表盘数据
    :param agent_id: 代理商ID，不传则返回当前用户的仪表盘数据
    :return: 仪表盘数据
    """
    try:
        # 获取用户信息
        user = current_user  # 直接使用当前用户
        if agent_id:
            # 如果指定了代理商ID，检查权限并获取代理商信息
            if current_user.agent_id:  # 如果当前用户是普通用户
                return {
                    "code": 403,
                    "message": "没有权限查看其他代理商数据"
                }
            agent = db.query(User).filter(User.id == agent_id).first()
            if not agent:
                return {
                    "code": 404,
                    "message": "代理商不存在"
                }
            user = agent

        # 获取当前时间
        now = datetime.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        next_month_start = (current_month_start + timedelta(days=32)).replace(day=1)

        # 统计数据
        statistics = {
            "balance": user.balance,  # 当前余额
            "total_recharge": get_total_recharge(db, user.id),  # 累计充值
            "total_consumption": get_total_consumption(db, user.id),  # 累计消费
            "monthly_recharge": get_monthly_recharge(db, user.id, current_month_start),  # 本月充值
            "monthly_consumption": get_monthly_consumption(db, user.id, current_month_start, next_month_start),  # 本月消费
            "last_month_consumption": get_monthly_consumption(db, user.id, last_month_start, current_month_start),  # 上月消费
        }

        # 动态资源使用情况
        dynamic_resources = get_dynamic_resources_usage(db, user.id)

        # 静态资源使用情况
        static_resources = get_static_resources_usage(db, user.id)

        return {
            "code": 0,
            "message": "success",
            "data": {
                "statistics": statistics,
                "dynamic_resources": dynamic_resources,
                "static_resources": static_resources
            }
        }
    except Exception as e:
        logger.error(f"获取仪表盘数据失败: {str(e)}", exc_info=True)
        return {
            "code": 500,
            "message": str(e),
            "data": None
        }
    finally:
        db.close()

def get_total_recharge(db: Session, user_id: int) -> float:
    """获取累计充值金额"""
    result = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == "recharge",
        Transaction.status == "completed"
    ).with_entities(func.sum(Transaction.amount)).scalar()
    return float(result or 0)

def get_total_consumption(db: Session, user_id: int) -> float:
    """获取累计消费金额"""
    result = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == "consumption",
        Transaction.status == "completed"
    ).with_entities(func.sum(Transaction.amount)).scalar()
    return float(result or 0)

def get_monthly_recharge(db: Session, user_id: int, start_time: datetime) -> float:
    """获取指定月份的充值金额"""
    result = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == "recharge",
        Transaction.status == "completed",
        Transaction.created_at >= start_time
    ).with_entities(func.sum(Transaction.amount)).scalar()
    return float(result or 0)

def get_monthly_consumption(db: Session, user_id: int, start_time: datetime, end_time: datetime) -> float:
    """获取指定月份的消费金额"""
    result = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == "consumption",
        Transaction.status == "completed",
        Transaction.created_at >= start_time,
        Transaction.created_at < end_time
    ).with_entities(func.sum(Transaction.amount)).scalar()
    return float(result or 0)

def get_dynamic_resources_usage(db: Session, user_id: int) -> list:
    """获取动态资源使用情况"""
    # 这里需要根据实际的数据结构来实现
    # 示例数据
    return [
        {
            "name": "动态资源1",
            "total_usage": 1000,
            "monthly_usage": 100,
            "daily_usage": 10,
            "last_month_usage": 90,
            "usage_rate": 75
        },
        {
            "name": "动态资源2",
            "total_usage": 2000,
            "monthly_usage": 200,
            "daily_usage": 20,
            "last_month_usage": 180,
            "usage_rate": 60
        },
        {
            "name": "动态资源3",
            "total_usage": 3000,
            "monthly_usage": 300,
            "daily_usage": 30,
            "last_month_usage": 270,
            "usage_rate": 45
        }
    ]

def get_static_resources_usage(db: Session, user_id: int) -> list:
    """获取静态资源使用情况"""
    # 这里需要根据实际的数据结构来实现
    # 示例数据
    return [
        {
            "name": "静态资源1",
            "total": 100,
            "available": 80,
            "used": 20,
            "expired": 0
        },
        {
            "name": "静态资源2",
            "total": 200,
            "available": 150,
            "used": 40,
            "expired": 10
        },
        {
            "name": "静态资源3",
            "total": 300,
            "available": 200,
            "used": 80,
            "expired": 20
        },
        {
            "name": "静态资源4",
            "total": 400,
            "available": 300,
            "used": 90,
            "expired": 10
        },
        {
            "name": "静态资源5",
            "total": 500,
            "available": 400,
            "used": 80,
            "expired": 20
        },
        {
            "name": "静态资源7",
            "total": 700,
            "available": 600,
            "used": 80,
            "expired": 20
        }
    ]

@router.get("/api/dashboard/resource-statistics")
async def get_resource_statistics(db: Session = Depends(get_db)):
    try:
        # 获取当前月份的开始时间
        now = datetime.now()
        start_of_month = datetime(now.year, now.month, 1)

        # 查询所有资源类型及其统计数据
        resource_stats = []
        resource_types = db.query(ResourceType).all()

        for resource_type in resource_types:
            # 获取或创建统计记录
            stats = db.query(ResourceUsageStatistics).filter(
                ResourceUsageStatistics.resource_type_id == resource_type.id
            ).first()

            if not stats:
                stats = ResourceUsageStatistics(
                    resource_type_id=resource_type.id,
                    total_openings=0,
                    monthly_openings=0,
                    available_count=0,
                    expired_count=0
                )
                db.add(stats)

            # 更新月度开通数
            monthly_openings = db.query(func.count(ResourceUsageHistory.id)).filter(
                ResourceUsageHistory.resource_type_id == resource_type.id,
                ResourceUsageHistory.created_at >= start_of_month
            ).scalar()

            # 更新可用和过期资源数
            active_count = db.query(func.count(ResourceUsageHistory.id)).filter(
                ResourceUsageHistory.resource_type_id == resource_type.id,
                ResourceUsageHistory.status == 'active'
            ).scalar()

            expired_count = db.query(func.count(ResourceUsageHistory.id)).filter(
                ResourceUsageHistory.resource_type_id == resource_type.id,
                ResourceUsageHistory.status == 'expired'
            ).scalar()

            # 更新统计数据
            stats.monthly_openings = monthly_openings
            stats.available_count = active_count
            stats.expired_count = expired_count
            stats.total_openings = active_count + expired_count

            resource_stats.append({
                'resource_type': resource_type.to_dict(),
                'statistics': stats.to_dict()
            })

        db.commit()

        return {
            'success': True,
            'data': resource_stats
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
