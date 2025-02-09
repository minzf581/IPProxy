"""
仪表盘服务模块
===========

此模块提供所有与仪表盘相关的功能，包括：
1. 总体统计数据
2. 每日统计数据
3. 用户统计数据
4. 代理商统计数据

使用示例：
--------
```python
dashboard_service = DashboardService()
stats = await dashboard_service.get_statistics(db)
```
"""

from typing import Dict, Any, List
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.instance import Instance
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.dynamic_order import DynamicOrder
from app.models.static_order import StaticOrder
import logging
from .ipipv_base_api import IPIPVBaseAPI

logger = logging.getLogger(__name__)

class DashboardService(IPIPVBaseAPI):
    """仪表盘服务类，处理所有仪表盘相关的操作"""
    
    async def get_statistics(self, db: Session) -> Dict[str, Any]:
        """获取总体统计数据"""
        try:
            logger.info("[DashboardService] 获取总体统计数据")
            
            # 获取用户统计
            total_users = db.query(func.count(User.id)).scalar()
            active_users = db.query(func.count(User.id)).filter(User.status == 1).scalar()
            agent_users = db.query(func.count(User.id)).filter(User.is_agent == True).scalar()
            
            # 获取订单统计（合并动态和静态订单）
            total_dynamic_orders = db.query(func.count(DynamicOrder.id)).scalar() or 0
            total_static_orders = db.query(func.count(StaticOrder.id)).scalar() or 0
            total_orders = total_dynamic_orders + total_static_orders
            
            today = datetime.utcnow().date()
            today_dynamic_orders = db.query(func.count(DynamicOrder.id)).filter(
                func.date(DynamicOrder.created_at) == today
            ).scalar() or 0
            today_static_orders = db.query(func.count(StaticOrder.id)).filter(
                func.date(StaticOrder.created_at) == today
            ).scalar() or 0
            today_orders = today_dynamic_orders + today_static_orders
            
            # 获取交易统计
            total_amount = db.query(func.sum(Transaction.amount)).scalar() or 0
            today_amount = db.query(func.sum(Transaction.amount)).filter(
                func.date(Transaction.created_at) == today
            ).scalar() or 0
            
            return {
                "users": {
                    "total": total_users,
                    "active": active_users,
                    "agents": agent_users
                },
                "orders": {
                    "total": total_orders,
                    "today": today_orders
                },
                "transactions": {
                    "total_amount": float(total_amount),
                    "today_amount": float(today_amount)
                }
            }
            
        except Exception as e:
            logger.error(f"[DashboardService] 获取统计数据失败: {str(e)}")
            return {
                "users": {"total": 0, "active": 0, "agents": 0},
                "orders": {"total": 0, "today": 0},
                "transactions": {"total_amount": 0, "today_amount": 0}
            }
            
    async def get_daily_statistics(
        self,
        db: Session,
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """获取每日统计数据"""
        try:
            logger.info(f"[DashboardService] 获取每日统计数据: days={days}")
            
            result = []
            today = datetime.utcnow().date()
            
            for i in range(days):
                date = today - timedelta(days=i)
                
                # 获取当日订单数（合并动态和静态订单）
                dynamic_orders = db.query(func.count(DynamicOrder.id)).filter(
                    func.date(DynamicOrder.created_at) == date
                ).scalar() or 0
                static_orders = db.query(func.count(StaticOrder.id)).filter(
                    func.date(StaticOrder.created_at) == date
                ).scalar() or 0
                orders_count = dynamic_orders + static_orders
                
                # 获取当日交易额
                daily_amount = db.query(func.sum(Transaction.amount)).filter(
                    func.date(Transaction.created_at) == date
                ).scalar() or 0
                
                # 获取当日新增用户数
                new_users = db.query(func.count(User.id)).filter(
                    func.date(User.created_at) == date
                ).scalar()
                
                result.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "orders": orders_count,
                    "amount": float(daily_amount),
                    "new_users": new_users
                })
                
            return result
            
        except Exception as e:
            logger.error(f"[DashboardService] 获取每日统计数据失败: {str(e)}")
            return []
            
    async def get_user_statistics(
        self,
        user_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """获取用户统计数据"""
        try:
            logger.info(f"[DashboardService] 获取用户统计数据: user_id={user_id}")
            
            # 获取用户信息
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"[DashboardService] 用户不存在: {user_id}")
                return {}
                
            # 获取用户订单统计（合并动态和静态订单）
            total_dynamic_orders = db.query(func.count(DynamicOrder.id)).filter(
                DynamicOrder.user_id == user_id
            ).scalar() or 0
            total_static_orders = db.query(func.count(StaticOrder.id)).filter(
                StaticOrder.user_id == user_id
            ).scalar() or 0
            total_orders = total_dynamic_orders + total_static_orders
            
            # 获取用户交易统计
            total_amount = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user_id
            ).scalar() or 0
            
            # 获取本月统计
            first_day = datetime.utcnow().replace(day=1).date()
            monthly_dynamic_orders = db.query(func.count(DynamicOrder.id)).filter(
                DynamicOrder.user_id == user_id,
                func.date(DynamicOrder.created_at) >= first_day
            ).scalar() or 0
            monthly_static_orders = db.query(func.count(StaticOrder.id)).filter(
                StaticOrder.user_id == user_id,
                func.date(StaticOrder.created_at) >= first_day
            ).scalar() or 0
            monthly_orders = monthly_dynamic_orders + monthly_static_orders
            
            monthly_amount = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user_id,
                func.date(Transaction.created_at) >= first_day
            ).scalar() or 0
            
            return {
                "total_orders": total_orders,
                "total_amount": float(total_amount),
                "monthly_orders": monthly_orders,
                "monthly_amount": float(monthly_amount),
                "balance": float(user.balance)
            }
            
        except Exception as e:
            logger.error(f"[DashboardService] 获取用户统计数据失败: {str(e)}")
            return {}
            
    async def get_agent_statistics(
        self,
        agent_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """获取代理商统计数据"""
        try:
            logger.info(f"[DashboardService] 获取代理商统计数据: agent_id={agent_id}")
            
            # 获取代理商信息
            agent = db.query(User).filter(
                User.id == agent_id,
                User.is_agent == True
            ).first()
            
            if not agent:
                logger.warning(f"[DashboardService] 代理商不存在: {agent_id}")
                return {}
                
            # 获取下级用户数
            sub_users = db.query(func.count(User.id)).filter(
                User.agent_id == agent_id
            ).scalar()
            
            # 获取订单统计（合并动态和静态订单）
            total_dynamic_orders = db.query(func.count(DynamicOrder.id)).filter(
                DynamicOrder.agent_id == agent_id
            ).scalar() or 0
            total_static_orders = db.query(func.count(StaticOrder.id)).filter(
                StaticOrder.agent_id == agent_id
            ).scalar() or 0
            total_orders = total_dynamic_orders + total_static_orders
            
            # 获取交易统计
            total_amount = db.query(func.sum(Transaction.amount)).filter(
                Transaction.agent_id == agent_id
            ).scalar() or 0
            
            # 获取本月统计
            first_day = datetime.utcnow().replace(day=1).date()
            monthly_dynamic_orders = db.query(func.count(DynamicOrder.id)).filter(
                DynamicOrder.agent_id == agent_id,
                func.date(DynamicOrder.created_at) >= first_day
            ).scalar() or 0
            monthly_static_orders = db.query(func.count(StaticOrder.id)).filter(
                StaticOrder.agent_id == agent_id,
                func.date(StaticOrder.created_at) >= first_day
            ).scalar() or 0
            monthly_orders = monthly_dynamic_orders + monthly_static_orders
            
            monthly_amount = db.query(func.sum(Transaction.amount)).filter(
                Transaction.agent_id == agent_id,
                func.date(Transaction.created_at) >= first_day
            ).scalar() or 0
            
            return {
                "sub_users": sub_users,
                "total_orders": total_orders,
                "total_amount": float(total_amount),
                "monthly_orders": monthly_orders,
                "monthly_amount": float(monthly_amount),
                "balance": float(agent.balance)
            }
            
        except Exception as e:
            logger.error(f"[DashboardService] 获取代理商统计数据失败: {str(e)}")
            return {} 