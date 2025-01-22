from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.sql import func
from app.database import Base

class ProxyInfo(Base):
    __tablename__ = "proxy_info"

    id = Column(Integer, primary_key=True, index=True)
    balance = Column(Float, default=0.0)  # 余额
    total_recharge = Column(Float, default=0.0)  # 总充值金额
    total_consumption = Column(Float, default=0.0)  # 总消费金额
    month_recharge = Column(Float, default=0.0)  # 本月充值
    month_consumption = Column(Float, default=0.0)  # 本月消费
    last_month_consumption = Column(Float, default=0.0)  # 上月消费
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ResourceUsage(Base):
    __tablename__ = "resource_usage"

    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String(50))  # 资源类型：dynamic/static
    title = Column(String(100))  # 资源名称
    total = Column(Float, default=0.0)  # 总量
    used = Column(Float, default=0.0)  # 已使用
    today = Column(Float, default=0.0)  # 今日使用
    last_month = Column(Float, default=0.0)  # 上月使用
    available = Column(Float, default=0.0)  # 可用量（仅静态资源）
    percentage = Column(Float, default=0.0)  # 使用率
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 