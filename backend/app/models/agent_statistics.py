from sqlalchemy import Column, Integer, Float, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class AgentStatistics(Base, TimestampMixin):
    """代理商统计信息"""
    __tablename__ = 'agent_statistics'

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    total_users = Column(Integer, nullable=False, default=0)  # 总用户数
    active_users = Column(Integer, nullable=False, default=0)  # 活跃用户数
    total_orders = Column(Integer, nullable=False, default=0)  # 总订单数
    active_orders = Column(Integer, nullable=False, default=0)  # 活跃订单数
    total_consumption = Column(Numeric(10, 2), nullable=False, default=0.0)  # 总消费
    monthly_consumption = Column(Numeric(10, 2), nullable=False, default=0.0)  # 月消费
    dynamic_resource_count = Column(Integer, nullable=False, default=0)  # 动态资源数量
    static_resource_count = Column(Integer, nullable=False, default=0)  # 静态资源数量

    # 关联关系
    agent = relationship("User", backref="statistics")

    def update_consumption(self, amount: float):
        """更新消费金额"""
        if self.total_consumption is None:
            self.total_consumption = 0.0
        if self.monthly_consumption is None:
            self.monthly_consumption = 0.0
        self.total_consumption = float(self.total_consumption) + amount
        self.monthly_consumption = float(self.monthly_consumption) + amount

    def update_resource_count(self, is_dynamic: bool, count: int):
        """更新资源数量"""
        if is_dynamic:
            if self.dynamic_resource_count is None:
                self.dynamic_resource_count = 0
            self.dynamic_resource_count += count
        else:
            if self.static_resource_count is None:
                self.static_resource_count = 0
            self.static_resource_count += count

    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            'id': self.id,
            'agent_id': self.agent_id,
            'total_users': self.total_users or 0,
            'active_users': self.active_users or 0,
            'total_orders': self.total_orders or 0,
            'active_orders': self.active_orders or 0,
            'total_consumption': float(self.total_consumption or 0),
            'monthly_consumption': float(self.monthly_consumption or 0),
            'dynamic_resource_count': self.dynamic_resource_count or 0,
            'static_resource_count': self.static_resource_count or 0,
            'created_at': self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            'updated_at': self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None
        } 