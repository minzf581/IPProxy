from sqlalchemy import Column, Integer, String, DECIMAL, TIMESTAMP, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base, TimestampMixin

class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_no = Column(String(32), nullable=False, unique=True, index=True, comment='交易编号')
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    order_no = Column(String(32), nullable=False, index=True, comment='关联订单号')
    amount = Column(DECIMAL(10,2), nullable=False, comment='交易金额')
    balance = Column(DECIMAL(10,2), nullable=False, comment='交易后余额')
    type = Column(String(20), nullable=False, index=True, comment='交易类型(recharge=充值,consume=消费,refund=退款)')
    status = Column(String(20), nullable=False, index=True, comment='交易状态(success=成功,failed=失败)')
    remark = Column(Text, comment='备注')
    
    # 关联关系
    user = relationship("User", foreign_keys=[user_id], back_populates="transactions")
    agent = relationship("User", foreign_keys=[agent_id], back_populates="agent_transactions")

    def to_dict(self):
        return {
            'id': self.id,
            'transaction_no': self.transaction_no,
            'user_id': self.user_id,
            'agent_id': self.agent_id,
            'order_no': self.order_no,
            'amount': float(self.amount) if self.amount else None,
            'balance': float(self.balance) if self.balance else None,
            'type': self.type,
            'status': self.status,
            'remark': self.remark,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class FlowUsage(Base, TimestampMixin):
    """流量使用记录"""
    __tablename__ = "flow_usage"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    instance_no = Column(String(32), nullable=False, index=True)
    daily_usage = Column(Float, default=0.0, comment='日使用量(GB)')
    monthly_usage = Column(Float, default=0.0, comment='月度使用量(GB)')
    total_usage = Column(Float, default=0.0, comment='总使用量(GB)')
    remark = Column(Text, comment='备注')
    
    # 关联关系
    user = relationship("User", back_populates="flow_usage")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'instance_no': self.instance_no,
            'daily_usage': self.daily_usage,
            'monthly_usage': self.monthly_usage,
            'total_usage': self.total_usage,
            'remark': self.remark,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
