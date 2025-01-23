from sqlalchemy import Column, Integer, String, Enum, DECIMAL, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class ResourceType(Base, TimestampMixin):
    __tablename__ = 'resource_types'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    type = Column(String(20), nullable=False)  # dynamic or static
    price = Column(DECIMAL(10, 2), nullable=False)

    usage_statistics = relationship("ResourceUsageStatistics", back_populates="resource_type")
    usage_history = relationship("ResourceUsageHistory", back_populates="resource_type")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'price': float(self.price),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 