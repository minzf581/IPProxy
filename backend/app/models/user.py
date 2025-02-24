from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, Boolean, DECIMAL, TIMESTAMP, Text, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
from datetime import datetime
import sqlalchemy as sa

class User(Base, TimestampMixin):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), index=True, nullable=False)
    app_username = Column(String(50), unique=True, index=True, nullable=True)
    platform_account = Column(String(50), unique=True, nullable=True)
    password = Column(String(255), nullable=False)
    email = Column(String(255), index=True, nullable=True)
    phone = Column(String(20), nullable=True)
    status = Column(Integer, nullable=False, default=1, server_default='1')
    is_admin = Column(Boolean, default=False)
    is_agent = Column(Boolean, default=False)
    balance = Column(Numeric(10, 2), nullable=False, default=0)
    remark = Column(Text)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ipipv_username = Column(String(50), unique=True, nullable=True)
    ipipv_password = Column(String(255), nullable=True)
    total_recharge = Column(Numeric(10, 2), nullable=False, default=0, server_default='0')
    total_consumption = Column(Numeric(10, 2), nullable=False, default=0, server_default='0')

    # 添加复合唯一约束
    __table_args__ = (
        sa.UniqueConstraint('username', 'agent_id', name='uq_username_agent_id'),
    )

    # 关系定义
    agent = relationship("User", remote_side=[id], backref="sub_users")
    resource_usage_history = relationship("ResourceUsageHistory", back_populates="user")
    instances = relationship("Instance", back_populates="user")
    flow_usage = relationship("FlowUsage", back_populates="user")
    transactions = relationship("Transaction", foreign_keys="[Transaction.user_id]", back_populates="user")
    agent_transactions = relationship("Transaction", foreign_keys="[Transaction.agent_id]", back_populates="agent")
    dynamic_orders = relationship("DynamicOrder", foreign_keys="DynamicOrder.user_id", back_populates="user")
    static_orders = relationship("StaticOrder", foreign_keys="StaticOrder.user_id", back_populates="user")
    agent_dynamic_orders = relationship("DynamicOrder", foreign_keys="DynamicOrder.agent_id", back_populates="agent")
    agent_static_orders = relationship("StaticOrder", foreign_keys="StaticOrder.agent_id", back_populates="agent")
    agent_prices = relationship("AgentPrice", foreign_keys="[AgentPrice.agent_id]", back_populates="agent", cascade="all, delete-orphan")
    user_prices = relationship("UserPrice", foreign_keys="[UserPrice.user_id]", back_populates="user")
    managed_user_prices = relationship("UserPrice", foreign_keys="[UserPrice.agent_id]", back_populates="agent")
    resource_usage_stats = relationship("ResourceUsageStatistics", back_populates="user")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "app_username": self.app_username,
            "platform_account": self.platform_account,
            "email": self.email,
            "phone": self.phone,
            "status": self.status,
            "is_admin": self.is_admin,
            "is_agent": self.is_agent,
            "balance": self.balance,
            "remark": self.remark,
            "last_login_at": self.last_login_at.strftime("%Y-%m-%d %H:%M:%S") if self.last_login_at else None,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            "agent_id": self.agent_id,
            "ipipv_username": self.ipipv_username
        }
