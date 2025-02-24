from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, func, DECIMAL, ForeignKeyConstraint
from sqlalchemy.orm import relationship, foreign
from app.models.base import Base, TimestampMixin

class ResourceUsageStatistics(Base, TimestampMixin):
    """资源使用统计"""
    __tablename__ = 'resource_usage_statistics'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    product_no = Column(String(50), nullable=False)
    resource_type = Column(String(20), nullable=False)  # dynamic 或 static
    total_amount = Column(Float, default=0)  # 总量
    used_amount = Column(Float, default=0)  # 已使用量
    today_usage = Column(Float, default=0)  # 今日使用量
    month_usage = Column(Float, default=0)  # 本月使用量
    last_month_usage = Column(Float, default=0)  # 上月使用量
    last_sync_time = Column(DateTime)  # 最后同步时间

    # 关系
    user = relationship("User", back_populates="resource_usage_stats")
    product = relationship("ProductInventory", 
                         back_populates="usage_statistics",
                         foreign_keys=[product_no],
                         primaryjoin="and_(foreign(ResourceUsageStatistics.product_no)==ProductInventory.product_no)")

    __table_args__ = (
        ForeignKeyConstraint(
            ['product_no'], ['product_inventory.product_no'],
            name='fk_resource_usage_product_no'
        ),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'product_no': self.product_no,
            'resource_type': self.resource_type,
            'total_amount': self.total_amount,
            'used_amount': self.used_amount,
            'today_usage': self.today_usage,
            'month_usage': self.month_usage,
            'last_month_usage': self.last_month_usage,
            'last_sync_time': self.last_sync_time.strftime('%Y-%m-%d %H:%M:%S') if self.last_sync_time else None,
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