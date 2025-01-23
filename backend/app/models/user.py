from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(100), nullable=False)
    email = Column(String(100))
    agent_id = Column(Integer, ForeignKey('agents.id'))
    status = Column(Enum('active', 'disabled', name='user_status'), default='active')
    balance = Column(Float, default=0.00)

    agent = relationship("Agent", back_populates="users")
    resource_usage_history = relationship("ResourceUsageHistory", back_populates="user")
    instances = relationship("Instance", back_populates="user")

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'agent_id': self.agent_id,
            'status': self.status,
            'balance': float(self.balance) if self.balance is not None else 0.00,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
