from sqlalchemy import Column, Integer, DECIMAL, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base, TimestampMixin

class AgentPrice(Base, TimestampMixin):
    """代理商价格模型"""
    __tablename__ = 'agent_prices'

    id = Column(Integer, primary_key=True)
    agent_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    dynamic_proxy_price = Column(DECIMAL(10, 4), nullable=False)
    static_proxy_price = Column(DECIMAL(10, 4), nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.now)
    updated_at = Column(TIMESTAMP, nullable=False, default=datetime.now, onupdate=datetime.now)

    # 关系定义
    agent = relationship("User", back_populates="prices")

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "agent_id": self.agent_id,
            "dynamic_proxy_price": float(self.dynamic_proxy_price),
            "static_proxy_price": float(self.static_proxy_price),
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S")
        } 