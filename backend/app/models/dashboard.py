from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.sql import func
from app.database import Base

class ProxyInfo(Base):
    __tablename__ = "proxy_info"

    id = Column(Integer, primary_key=True, index=True)
    residential_balance = Column(Float, default=0.0)  # 住宅代理余额
    datacenter_balance = Column(Float, default=0.0)  # 数据中心代理余额
    total_recharge = Column(Float, default=0.0)  # 总充值金额
    total_consumption = Column(Float, default=0.0)  # 总消费金额
    month_recharge = Column(Float, default=0.0)  # 本月充值
    month_consumption = Column(Float, default=0.0)  # 本月消费
    last_month_consumption = Column(Float, default=0.0)  # 上月消费
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ResourceUsage(Base):
    __tablename__ = "resource_usage"

    id = Column(Integer, primary_key=True, index=True)
    monthly_usage = Column(Float, default=0.0)  # 月度使用量
    daily_usage = Column(Float, default=0.0)  # 日使用量
    last_month_usage = Column(Float, default=0.0)  # 上月使用量
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()) 