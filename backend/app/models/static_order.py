from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class StaticOrder(Base):
    __tablename__ = "static_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    agent_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float, default=0.0)
    resource_type = Column(String(50))
    traffic = Column(Integer)  # 流量，单位GB
    expire_time = Column(DateTime)
    continent = Column(String(50))
    region = Column(String(50))
    country = Column(String(50))
    province = Column(String(50))
    city = Column(String(50))
    static_type = Column(String(50))
    ip_range = Column(String(50))
    duration = Column(Integer)  # 时长，单位天
    quantity = Column(Integer)  # IP数量
    status = Column(String(20))  # completed, pending, cancelled
    remark = Column(String(255), nullable=True)
    proxy_info = Column(JSON, nullable=True)  # 存储代理信息
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联关系
    user = relationship("User", foreign_keys=[user_id], back_populates="static_orders")
    agent = relationship("User", foreign_keys=[agent_id], back_populates="agent_static_orders")

    def to_dict(self):
        return {
            "id": self.id,
            "order_no": self.order_no,
            "user_id": self.user_id,
            "agent_id": self.agent_id,
            "amount": self.amount,
            "resource_type": self.resource_type,
            "traffic": self.traffic,
            "expire_time": self.expire_time.strftime("%Y-%m-%d %H:%M:%S") if self.expire_time else None,
            "continent": self.continent,
            "region": self.region,
            "country": self.country,
            "province": self.province,
            "city": self.city,
            "static_type": self.static_type,
            "ip_range": self.ip_range,
            "duration": self.duration,
            "quantity": self.quantity,
            "status": self.status,
            "remark": self.remark,
            "proxy_info": self.proxy_info,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None
        } 