from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Agent(Base, TimestampMixin):
    """代理商模型"""
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(100), nullable=False)
    email = Column(String(100))
    balance = Column(Float, default=0.00)
    status = Column(String(20), default='active')

    users = relationship("User", back_populates="agent")
    resource_usage_history = relationship("ResourceUsageHistory", back_populates="agent")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "balance": self.balance,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        } 