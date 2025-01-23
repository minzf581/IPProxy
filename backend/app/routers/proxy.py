from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dashboard import ProxyInfo
from app.models.transaction import FlowUsage
from typing import Dict, Any

router = APIRouter()

@router.get("/api/open/app/proxy/info/v2")
async def get_proxy_info(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """获取代理信息"""
    proxy_info = db.query(ProxyInfo).first()
    if not proxy_info:
        # 如果没有数据，创建测试数据
        proxy_info = ProxyInfo(
            balance=1000.0,
            total_recharge=5000.0,
            total_consumption=4000.0,
            month_recharge=500.0,
            month_consumption=300.0,
            last_month_consumption=800.0
        )
        db.add(proxy_info)
        db.commit()
        db.refresh(proxy_info)
    
    return {
        "code": "200",
        "msg": "success",
        "data": {
            "balance": proxy_info.balance,
            "totalRecharge": proxy_info.total_recharge,
            "totalConsumption": proxy_info.total_consumption,
            "monthRecharge": proxy_info.month_recharge,
            "monthConsumption": proxy_info.month_consumption,
            "lastMonthConsumption": proxy_info.last_month_consumption
        }
    }

@router.get("/api/open/app/proxy/flow/use/log/v2")
async def get_flow_usage(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """获取流量使用记录"""
    flow_usage = db.query(FlowUsage).first()
    if not flow_usage:
        # 如果没有数据，创建测试数据
        flow_usage = FlowUsage(
            monthly_usage=150.5,    # 本月已使用 150.5GB
            daily_usage=5.2,        # 今日已使用 5.2GB
            last_month_usage=200.8  # 上月使用 200.8GB
        )
        db.add(flow_usage)
        db.commit()
        db.refresh(flow_usage)
    
    return {
        "code": "200",
        "msg": "success",
        "data": {
            "monthlyUsage": flow_usage.monthly_usage,
            "dailyUsage": flow_usage.daily_usage,
            "lastMonthUsage": flow_usage.last_month_usage
        }
    } 