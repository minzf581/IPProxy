from sqlalchemy import Column, Integer, DECIMAL, TIMESTAMP, ForeignKey, UniqueConstraint, CheckConstraint, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base
import json

class AgentPrice(Base):
    """代理商价格模型"""
    __tablename__ = "agent_prices"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("product_inventory.id"), nullable=False, index=True)
    price = Column(DECIMAL(10, 4), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.now, onupdate=None)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)

    # 关联关系
    agent = relationship("User", foreign_keys=[agent_id])
    product = relationship("ProductInventory", foreign_keys=[product_id])

    # 约束
    __table_args__ = (
        UniqueConstraint('agent_id', 'product_id', name='uix_agent_product'),
        CheckConstraint('price >= 0', name='chk_agent_price_positive'),
        {'extend_existing': True}
    )

    def to_dict(self):
        return {
            'id': self.id,
            'agent_id': self.agent_id,
            'product_id': self.product_id,
            'price': float(self.price) if self.price is not None else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class UserPrice(Base):
    """用户价格模型"""
    __tablename__ = "user_prices"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("product_inventory.id"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    price = Column(DECIMAL(10, 4), nullable=False)
    ip_whitelist = Column(Text, comment='IP白名单列表', nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)

    # 关联关系
    user = relationship("User", foreign_keys=[user_id])
    product = relationship("ProductInventory", foreign_keys=[product_id])
    agent = relationship("User", foreign_keys=[agent_id])

    # 约束
    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='uix_user_product'),
        {'extend_existing': True}
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'product_id': self.product_id,
            'agent_id': self.agent_id,
            'price': float(self.price),
            'ip_whitelist': json.loads(self.ip_whitelist) if self.ip_whitelist else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 