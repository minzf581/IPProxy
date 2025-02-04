from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, nullable=False)  # 订单号
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # 用户ID
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # 代理商ID
    amount = Column(Float, nullable=False)  # 金额
    type = Column(Enum('recharge', 'consumption', name='transaction_type'), nullable=False)  # 交易类型：充值/消费
    status = Column(Enum('pending', 'completed', 'failed', name='transaction_status'), default='pending')  # 交易状态
    remark = Column(String(200))  # 备注
    operator_id = Column(Integer, ForeignKey('users.id'))  # 操作人ID（管理员ID）

    user = relationship("User", foreign_keys=[user_id], back_populates="transactions")
    agent = relationship("User", foreign_keys=[agent_id], backref="agent_transactions")
    operator = relationship("User", foreign_keys=[operator_id], backref="operated_transactions")

    def to_dict(self):
        return {
            'id': self.id,
            'order_no': self.order_no,
            'user_id': self.user_id,
            'agent_id': self.agent_id,
            'amount': float(self.amount) if self.amount is not None else 0.00,
            'type': self.type,
            'status': self.status,
            'remark': self.remark,
            'operator_id': self.operator_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'operator_name': self.operator.username if self.operator else None,
            'user_name': self.user.username if self.user else None,
            'agent_name': self.agent.username if self.agent else None
        }

class FlowUsage(Base):
    __tablename__ = "flow_usage"

    id = Column(Integer, primary_key=True, index=True)
    monthly_usage = Column(Float, default=0.0)  # 月度使用量(GB)
    daily_usage = Column(Float, default=0.0)    # 日使用量(GB)
    last_month_usage = Column(Float, default=0.0)  # 上月使用量(GB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
