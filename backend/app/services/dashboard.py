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
from app.models.product_inventory import ProductInventory
import logging
from .ipipv_base_api import IPIPVBaseAPI
import traceback

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
            
            # 获取本月统计
            first_day = datetime.utcnow().replace(day=1).date()
            monthly_amount = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user_id,
                Transaction.type == "recharge",
                func.date(Transaction.created_at) >= first_day
            ).scalar() or 0
            
            monthly_consumption = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user_id,
                Transaction.type == "consumption",
                func.date(Transaction.created_at) >= first_day
            ).scalar() or 0
            
            # 获取上月消费
            last_month_start = (datetime.utcnow().replace(day=1) - timedelta(days=1)).replace(day=1).date()
            last_month_end = datetime.utcnow().replace(day=1).date() - timedelta(days=1)
            
            last_month_consumption = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user_id,
                Transaction.type == "consumption",
                func.date(Transaction.created_at).between(last_month_start, last_month_end)
            ).scalar() or 0
            
            # 获取动态资源使用情况
            dynamic_resources = await self.get_dynamic_resources(db, user_id)
            
            return {
                "total_amount": float(user.total_recharge),
                "total_orders": float(user.total_consumption),
                "monthly_amount": float(monthly_amount),
                "monthly_orders": float(monthly_consumption),
                "last_month_orders": float(last_month_consumption),
                "balance": float(user.balance),
                "dynamicResources": dynamic_resources,
                "staticResources": []  # 静态资源待实现
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

    async def get_dynamic_resources(self, db: Session, user_id: int) -> List[Dict[str, Any]]:
        """获取动态资源使用情况"""
        try:
            logger.info(f"[DashboardService] 开始获取动态资源使用情况: user_id={user_id}")
            
            # 获取用户信息
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.error(f"[DashboardService] 用户不存在: user_id={user_id}")
                return []
                
            if not user.username:
                logger.error(f"[DashboardService] 用户未设置用户名: user_id={user_id}")
                return []

            # 查询动态资源产品列表 (proxy_type = 104 或 201)
            products = db.query(ProductInventory).filter(
                ProductInventory.proxy_type.in_([104, 201]),
                ProductInventory.enable == 1  # 只获取可购买的产品
            ).all()
            
            logger.info(f"[DashboardService] 查询到 {len(products)} 个动态资源产品")

            dynamic_resources = []
            now = datetime.now()
            
            # 获取时间范围
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_month_start = (month_start - timedelta(days=1)).replace(day=1)
            last_month_end = month_start - timedelta(seconds=1)

            for product in products:
                logger.info(f"[DashboardService] 处理产品: {product.product_no}")
                
                try:
                    # 获取今日使用量
                    today_usage = await self._get_flow_usage(
                        username=user.username,
                        product_no=product.product_no,
                        start_time=today_start.strftime("%Y-%m-%d %H:%M:%S"),
                        end_time=now.strftime("%Y-%m-%d %H:%M:%S")
                    )
                    
                    # 获取本月使用量
                    month_usage = await self._get_flow_usage(
                        username=user.username,
                        product_no=product.product_no,
                        start_time=month_start.strftime("%Y-%m-%d %H:%M:%S"),
                        end_time=now.strftime("%Y-%m-%d %H:%M:%S")
                    )
                    
                    # 获取上月使用量
                    last_month_usage = await self._get_flow_usage(
                        username=user.username,
                        product_no=product.product_no,
                        start_time=last_month_start.strftime("%Y-%m-%d %H:%M:%S"),
                        end_time=last_month_end.strftime("%Y-%m-%d %H:%M:%S")
                    )

                    # 计算总流量（从flow字段获取）
                    total_flow = product.flow if product.flow else 0

                    dynamic_resources.append({
                        "title": product.product_name,
                        "total": total_flow,
                        "used": month_usage,
                        "remaining": max(0, total_flow - month_usage),
                        "percentage": round((month_usage / total_flow * 100) if total_flow > 0 else 0, 2),
                        "today_usage": today_usage,
                        "month_usage": month_usage,
                        "last_month_usage": last_month_usage
                    })
                    
                    logger.info(f"[DashboardService] 产品 {product.product_no} 使用情况: "
                              f"今日={today_usage}, 本月={month_usage}, 上月={last_month_usage}")
                              
                except Exception as e:
                    logger.error(f"[DashboardService] 获取产品 {product.product_no} 使用情况失败: {str(e)}")
                    continue

            return dynamic_resources
            
        except Exception as e:
            logger.error(f"[DashboardService] 获取动态资源使用情况失败: {str(e)}")
            logger.error(traceback.format_exc())
            return []

    async def _get_flow_usage(
        self, 
        username: str,
        product_no: str,
        start_time: str,
        end_time: str
    ) -> float:
        """获取流量使用记录"""
        try:
            logger.info(f"[DashboardService] 获取流量使用记录: username={username}, "
                       f"product_no={product_no}, start_time={start_time}, end_time={end_time}")
                       
            response = await self._make_request(
                "api/open/app/proxy/flow/use/log/v2",
                {
                    "appUsername": username,
                    "startTime": start_time,
                    "endTime": end_time,
                    "productNo": product_no,
                    "page": 1,
                    "pageSize": 100
                }
            )
            
            if response.get("code") == 200:
                data = response.get("data", {})
                if isinstance(data, dict):
                    flow_list = data.get("list", [])
                    total_usage = 0
                    if flow_list:
                        for flow in flow_list:
                            total_usage += float(flow.get("flow", 0))
                    logger.info(f"[DashboardService] 获取到流量使用量: {total_usage}")
                    return total_usage
                else:
                    logger.warning(f"[DashboardService] 流量使用记录数据格式异常: {data}")
                    return 0
            else:
                logger.error(f"[DashboardService] 获取流量使用记录失败: {response.get('msg')}")
                return 0
                
        except Exception as e:
            logger.error(f"[DashboardService] 获取流量使用记录异常: {str(e)}")
            return 0 