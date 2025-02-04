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
            "id": str(self.id),
            "orderNo": self.order_no,
            "userId": str(self.user_id),
            "username": self.user.username if self.user else None,
            "poolType": self.pool_type,
            "traffic": self.traffic,
            "status": self.status or "active",
            "remark": self.remark or "",
            "createTime": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "proxyInfo": self.proxy_info
        } 