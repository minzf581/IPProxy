from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class DynamicOrder(Base):
    __tablename__ = "dynamic_orders"

    id = Column(String(50), primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True)
    app_order_no = Column(String(50), unique=True, index=True)  # 上游订单号
    user_id = Column(Integer, ForeignKey("users.id"))
    agent_id = Column(Integer, ForeignKey("users.id"))
    pool_type = Column(String(50))  # 资源来源
    traffic = Column(Integer)  # 流量，单位GB
    unit_price = Column(Float)  # 单价
    total_amount = Column(Float)  # 总金额
    proxy_type = Column(String(20))  # 代理类型：dynamic, static
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
            "pool_type": self.pool_type,
            "traffic": self.traffic,
            "unit_price": float(self.unit_price) if self.unit_price else 0,
            "total_amount": float(self.total_amount) if self.total_amount else 0,
            "proxy_type": self.proxy_type,
            "status": self.status,
            "proxy_info": self.proxy_info,
            "remark": self.remark,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None
        } 