from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, func, DECIMAL
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class ResourceUsageStatistics(Base, TimestampMixin):
    """资源使用统计"""
    __tablename__ = 'resource_usage_statistics'

    id = Column(Integer, primary_key=True)
    resource_type_id = Column(Integer, ForeignKey('product_inventory.id'))
    total_openings = Column(Integer, default=0)  # 总开通数
    monthly_openings = Column(Integer, default=0)  # 月开通数
    available_count = Column(Integer, default=0)  # 可用数量
    expired_count = Column(Integer, default=0)  # 过期数量

    resource_type = relationship("ProductInventory", back_populates="usage_statistics")

    def to_dict(self):
        return {
            'id': self.id,
            'resource_type_id': self.resource_type_id,
            'total_openings': self.total_openings,
            'monthly_openings': self.monthly_openings,
            'available_count': self.available_count,
            'expired_count': self.expired_count,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None
        }

class ResourceUsageHistory(Base, TimestampMixin):
    """资源使用历史"""
    __tablename__ = 'resource_usage_history'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    resource_type_id = Column(Integer, ForeignKey('product_inventory.id'))
    usage_amount = Column(Float)  # 使用量
    usage_type = Column(String(50))  # 使用类型
    remark = Column(String(255))  # 备注
    status = Column(String(20))

    # 关系
    user = relationship("User", back_populates="resource_usage_history")
    resource_type = relationship("ProductInventory", back_populates="usage_history")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'resource_type_id': self.resource_type_id,
            'usage_amount': self.usage_amount,
            'usage_type': self.usage_type,
            'remark': self.remark,
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None
        } 