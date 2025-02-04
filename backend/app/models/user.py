from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
from datetime import datetime
from passlib.hash import bcrypt

class User(Base, TimestampMixin):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255))
    email = Column(String(255))
    agent_id = Column(Integer, ForeignKey('users.id'))
    status = Column(Enum('active', 'disabled', name='user_status'), default='active')
    balance = Column(Float, default=0.00)
    is_admin = Column(Boolean, default=False)
    is_agent = Column(Boolean, default=False)
    remark = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    agent = relationship("User", remote_side=[id], backref="users")
    resource_usage_history = relationship("ResourceUsageHistory", back_populates="user")
    instances = relationship("Instance", back_populates="user")
    transactions = relationship("Transaction", foreign_keys="[Transaction.user_id]", back_populates="user")
    dynamic_orders = relationship("DynamicOrder", foreign_keys="[DynamicOrder.user_id]", back_populates="user")
    static_orders = relationship("StaticOrder", foreign_keys="[StaticOrder.user_id]", back_populates="user")
    agent_static_orders = relationship("StaticOrder", foreign_keys="[StaticOrder.agent_id]", backref="order_agent")
    agent_dynamic_orders = relationship("DynamicOrder", foreign_keys="[DynamicOrder.agent_id]", backref="order_agent")

    def __init__(self, **kwargs):
        if 'password' in kwargs:
            kwargs['password'] = bcrypt.hash(kwargs['password'])
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'agent_id': self.agent_id,
            'status': self.status,
            'balance': float(self.balance) if self.balance is not None else 0.00,
            'is_admin': self.is_admin,
            'is_agent': self.is_agent,
            'remark': self.remark,
            'created_at': self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            'updated_at': self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None
        }
