from typing import Dict, Any
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.instance import Instance
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

async def get_dashboard_data(user_id: int) -> Dict[str, Any]:
    """
    获取用户的仪表盘数据
    :param user_id: 用户ID，可以是当前用户ID或代理商ID
    :return: 仪表盘数据
    """
    db = next(get_db())
    try:
        # 获取用户信息
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {
                "code": 404,
                "message": "用户不存在"
            }

        # 获取当前时间
        now = datetime.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        next_month_start = (current_month_start + timedelta(days=32)).replace(day=1)

        # 统计数据
        statistics = {
            "balance": user.balance,  # 当前余额
            "total_recharge": get_total_recharge(db, user_id),  # 累计充值
            "total_consumption": get_total_consumption(db, user_id),  # 累计消费
            "monthly_recharge": get_monthly_recharge(db, user_id, current_month_start),  # 本月充值
            "monthly_consumption": get_monthly_consumption(db, user_id, current_month_start, next_month_start),  # 本月消费
            "last_month_consumption": get_monthly_consumption(db, user_id, last_month_start, current_month_start),  # 上月消费
        }

        # 动态资源使用情况
        dynamic_resources = get_dynamic_resources_usage(db, user_id)

        # 静态资源使用情况
        static_resources = get_static_resources_usage(db, user_id)

        return {
            "code": 0,
            "message": "success",
            "data": {
                "statistics": statistics,
                "dynamic_resources": dynamic_resources,
                "static_resources": static_resources
            }
        }
    finally:
        db.close()

def get_total_recharge(db: Session, user_id: int) -> float:
    """获取累计充值金额"""
    result = db.query(text("SUM(amount)")).select_from(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == "recharge",
        Transaction.status == "completed"
    ).scalar()
    return float(result or 0)

def get_total_consumption(db: Session, user_id: int) -> float:
    """获取累计消费金额"""
    result = db.query(text("SUM(amount)")).select_from(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == "consumption",
        Transaction.status == "completed"
    ).scalar()
    return float(result or 0)

def get_monthly_recharge(db: Session, user_id: int, start_time: datetime) -> float:
    """获取指定月份的充值金额"""
    result = db.query(text("SUM(amount)")).select_from(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == "recharge",
        Transaction.status == "completed",
        Transaction.created_at >= start_time
    ).scalar()
    return float(result or 0)

def get_monthly_consumption(db: Session, user_id: int, start_time: datetime, end_time: datetime) -> float:
    """获取指定月份的消费金额"""
    result = db.query(text("SUM(amount)")).select_from(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == "consumption",
        Transaction.status == "completed",
        Transaction.created_at >= start_time,
        Transaction.created_at < end_time
    ).scalar()
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
            "total_opened": 1000,
            "monthly_opened": 100,
            "last_month_opened": 90,
            "available": 50,
            "expired": 20,
            "usage_rate": 80
        },
        {
            "name": "静态资源2",
            "total_opened": 2000,
            "monthly_opened": 200,
            "last_month_opened": 180,
            "available": 100,
            "expired": 40,
            "usage_rate": 70
        },
        {
            "name": "静态资源3",
            "total_opened": 3000,
            "monthly_opened": 300,
            "last_month_opened": 270,
            "available": 150,
            "expired": 60,
            "usage_rate": 60
        },
        {
            "name": "静态资源4",
            "total_opened": 4000,
            "monthly_opened": 400,
            "last_month_opened": 360,
            "available": 200,
            "expired": 80,
            "usage_rate": 50
        },
        {
            "name": "静态资源5",
            "total_opened": 5000,
            "monthly_opened": 500,
            "last_month_opened": 450,
            "available": 250,
            "expired": 100,
            "usage_rate": 40
        },
        {
            "name": "静态资源7",
            "total_opened": 7000,
            "monthly_opened": 700,
            "last_month_opened": 630,
            "available": 350,
            "expired": 140,
            "usage_rate": 30
        }
    ] 