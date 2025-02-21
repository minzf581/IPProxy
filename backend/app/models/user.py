from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, Boolean, DECIMAL, TIMESTAMP, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
from datetime import datetime

class User(Base, TimestampMixin):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    app_username = Column(String(50), unique=True, index=True, nullable=True)
    platform_account = Column(String(50), unique=True, nullable=True)  # 添加 platform_account 字段
    password = Column(String(255), nullable=False)
    email = Column(String(255), index=True, nullable=True)  # 允许为空的邮箱字段
    phone = Column(String(20), unique=True, nullable=True)
    status = Column(Integer, nullable=False, default=1, server_default='1')  # 1=正常 0=禁用
    is_admin = Column(Boolean, default=False)
    is_agent = Column(Boolean, default=False)
    balance = Column(Float, nullable=False, default=0.0)
    remark = Column(Text)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.now)
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ipipv_username = Column(String(50), unique=True, nullable=True)  # IPIPV平台用户名
    ipipv_password = Column(String(255), nullable=True)  # IPIPV平台密码

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
