from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class ResourceUsageStatistics(Base, TimestampMixin):
    __tablename__ = 'resource_usage_statistics'

    id = Column(Integer, primary_key=True, index=True)
    resource_type_id = Column(Integer, ForeignKey('resource_types.id'), nullable=False)
    total_openings = Column(Integer, default=0)
    monthly_openings = Column(Integer, default=0)
    available_count = Column(Integer, default=0)
    expired_count = Column(Integer, default=0)

    resource_type = relationship("ResourceType", back_populates="usage_statistics")

    def to_dict(self):
        return {
            'id': self.id,
            'resource_type_id': self.resource_type_id,
            'total_openings': self.total_openings,
            'monthly_openings': self.monthly_openings,
            'available_count': self.available_count,
            'expired_count': self.expired_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ResourceUsageHistory(Base, TimestampMixin):
    __tablename__ = 'resource_usage_history'

    id = Column(Integer, primary_key=True, index=True)
    resource_type_id = Column(Integer, ForeignKey('resource_types.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    agent_id = Column(Integer, ForeignKey('agents.id'), nullable=False)
    status = Column(Enum('active', 'expired', name='resource_status'), default='active')

    resource_type = relationship("ResourceType", back_populates="usage_history")
    user = relationship("User", back_populates="resource_usage_history")
    agent = relationship("Agent", back_populates="resource_usage_history")

    def to_dict(self):
        return {
            'id': self.id,
            'resource_type_id': self.resource_type_id,
            'user_id': self.user_id,
            'agent_id': self.agent_id,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 