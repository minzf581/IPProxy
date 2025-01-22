from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.sql import func
from app.database import Base

class ProxyInfo(Base):
    __tablename__ = "proxy_info"

    id = Column(Integer, primary_key=True, index=True)
    balance = Column(Float, default=0.0)  # 余额
    total_recharge = Column(Float, default=0.0)  # 总充值金额
    total_consumption = Column(Float, default=0.0)  # 总消费金额
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class FlowUsage(Base):
    __tablename__ = "flow_usage"

    id = Column(Integer, primary_key=True, index=True)
    monthly_usage = Column(Float, default=0.0)  # 月度使用量(GB)
    daily_usage = Column(Float, default=0.0)    # 日使用量(GB)
    last_month_usage = Column(Float, default=0.0)  # 上月使用量(GB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
