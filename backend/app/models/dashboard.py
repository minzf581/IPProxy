from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.models.base import Base, TimestampMixin

class ProxyInfo(Base, TimestampMixin):
    __tablename__ = "proxy_info"

    id = Column(Integer, primary_key=True, index=True)
    balance = Column(Float, default=0.0)  # 当前余额
    total_recharge = Column(Float, default=0.0)  # 累计充值
    total_consumption = Column(Float, default=0.0)  # 累计消费
    month_recharge = Column(Float, default=0.0)  # 本月充值
    month_consumption = Column(Float, default=0.0)  # 本月消费
    last_month_consumption = Column(Float, default=0.0)  # 上月消费

class ResourceUsage(Base, TimestampMixin):
    __tablename__ = "resource_usage"

    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String, nullable=False)  # dynamic: 动态资源, static: 静态资源
    title = Column(String, nullable=False)  # 资源名称
    total = Column(Integer, default=0)  # 总量
    used = Column(Integer, default=0)  # 已使用
    today = Column(Integer, default=0)  # 今日使用
    last_month = Column(Integer, default=0)  # 上月使用
    available = Column(Integer, default=0)  # 可用量（仅静态资源）
    percentage = Column(Float, default=0.0)  # 使用率 