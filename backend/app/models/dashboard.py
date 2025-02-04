from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class ProxyInfo(Base, TimestampMixin):
    """代理服务器信息"""
    __tablename__ = 'proxy_info'

    id = Column(Integer, primary_key=True, autoincrement=True)
    balance = Column(Float, default=0.0)  # 余额
    total_recharge = Column(Float, default=0.0)  # 总充值
    total_consumption = Column(Float, default=0.0)  # 总消费
    month_recharge = Column(Float, default=0.0)  # 月充值
    month_consumption = Column(Float, default=0.0)  # 月消费
    last_month_consumption = Column(Float, default=0.0)  # 上月消费

    def to_dict(self):
        return {
            'id': self.id,
            'balance': self.balance,
            'total_recharge': self.total_recharge,
            'total_consumption': self.total_consumption,
            'month_recharge': self.month_recharge,
            'month_consumption': self.month_consumption,
            'last_month_consumption': self.last_month_consumption,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None
        }

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