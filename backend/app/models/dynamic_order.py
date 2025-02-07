from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class DynamicOrder(Base):
    __tablename__ = "dynamic_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    agent_id = Column(Integer, ForeignKey("users.id"))
    pool_type = Column(String(50))  # 资源来源
    traffic = Column(Integer)  # 流量，单位GB
    status = Column(String(20))  # active, expired, cancelled
    remark = Column(String(255), nullable=True)
    proxy_info = Column(JSON, nullable=True)  # 存储代理信息
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联关系
    user = relationship("User", foreign_keys=[user_id], back_populates="dynamic_orders")
    agent = relationship("User", foreign_keys=[agent_id], back_populates="agent_dynamic_orders")

    def to_dict(self):
        """转换为前端需要的格式"""
        return {
            "id": self.id,
            "order_no": self.order_no,
            "app_order_no": self.app_order_no,
            "user_id": self.user_id,
            "agent_id": self.agent_id,
            "product_no": self.product_no,
            "proxy_type": self.proxy_type,
            "region_code": self.region_code,
            "country_code": self.country_code,
            "city_code": self.city_code,
            "ip_count": self.ip_count,
            "duration": self.duration,
            "unit": self.unit,
            "amount": float(self.amount) if self.amount else 0,
            "status": self.status,
            "callback_count": self.callback_count,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None
        } 