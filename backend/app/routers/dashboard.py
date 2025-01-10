from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import user, agent, order, ip_resource
from sqlalchemy import func
from datetime import datetime, date

router = APIRouter()

@router.get("/statistics")
async def get_dashboard_statistics(db: Session = Depends(get_db)):
    # 获取当前月份的开始日期和上月开始日期
    today = date.today()
    current_month_start = date(today.year, today.month, 1)
    if today.month == 1:
        last_month_start = date(today.year - 1, 12, 1)
    else:
        last_month_start = date(today.year, today.month - 1, 1)
    
    try:
        # 获取用户统计
        total_users = db.query(func.count(user.User.id)).scalar() or 0
        active_users = db.query(func.count(user.User.id))\
            .filter(user.User.status == 'active')\
            .scalar() or 0
            
        # 获取代理商统计
        total_agents = db.query(func.count(agent.Agent.id)).scalar() or 0
        active_agents = db.query(func.count(agent.Agent.id))\
            .filter(agent.Agent.status == 'active')\
            .scalar() or 0
            
        # 获取收入统计
        total_recharge = db.query(func.sum(order.Order.amount))\
            .filter(order.Order.type == 'recharge')\
            .scalar() or 0
            
        total_consumption = db.query(func.sum(order.Order.amount))\
            .filter(order.Order.type == 'consumption')\
            .scalar() or 0
            
        monthly_recharge = db.query(func.sum(order.Order.amount))\
            .filter(order.Order.type == 'recharge')\
            .filter(order.Order.created_at >= current_month_start)\
            .scalar() or 0
            
        monthly_consumption = db.query(func.sum(order.Order.amount))\
            .filter(order.Order.type == 'consumption')\
            .filter(order.Order.created_at >= current_month_start)\
            .scalar() or 0
            
        last_month_consumption = db.query(func.sum(order.Order.amount))\
            .filter(order.Order.type == 'consumption')\
            .filter(order.Order.created_at >= last_month_start)\
            .filter(order.Order.created_at < current_month_start)\
            .scalar() or 0
            
        # 获取IP资源统计
        static_ips = db.query(func.count(ip_resource.IpResource.id))\
            .filter(ip_resource.IpResource.type == 'static')\
            .scalar() or 0
            
        dynamic_ips = db.query(func.count(ip_resource.IpResource.id))\
            .filter(ip_resource.IpResource.type == 'dynamic')\
            .scalar() or 0
            
        # 获取最近订单
        recent_orders = db.query(order.Order)\
            .order_by(order.Order.created_at.desc())\
            .limit(5)\
            .all()
            
        return {
            "users": {
                "total": total_users,
                "active": active_users
            },
            "agents": {
                "total": total_agents,
                "active": active_agents
            },
            "income": {
                "total": total_recharge - total_consumption,
                "monthly": monthly_recharge - monthly_consumption
            },
            "ips": {
                "static": static_ips,
                "dynamic": dynamic_ips
            },
            "totalRecharge": total_recharge,
            "totalConsumption": total_consumption,
            "balance": total_recharge - total_consumption,
            "monthlyRecharge": monthly_recharge,
            "monthlyConsumption": monthly_consumption,
            "lastMonthConsumption": last_month_consumption,
            "recentOrders": [{
                "id": str(order.id),
                "type": order.type,
                "username": order.username,
                "amount": order.amount,
                "status": order.status,
                "createdAt": order.created_at.isoformat()
            } for order in recent_orders]
        }
    except Exception as e:
        print(f"Error getting dashboard statistics: {e}")
        raise
