from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.models.base import Base, TimestampMixin

class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)  # 交易金额
    type = Column(String, nullable=False)   # 交易类型：recharge(充值) / consumption(消费)
    status = Column(String, nullable=False) # 交易状态：completed(已完成) / failed(失败) / pending(处理中)
    remark = Column(String, nullable=True)  # 交易备注
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "amount": self.amount,
            "type": self.type,
            "status": self.status,
            "remark": self.remark,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

class FlowUsage(Base):
    __tablename__ = "flow_usage"

    id = Column(Integer, primary_key=True, index=True)
    monthly_usage = Column(Float, default=0.0)  # 月度使用量(GB)
    daily_usage = Column(Float, default=0.0)    # 日使用量(GB)
    last_month_usage = Column(Float, default=0.0)  # 上月使用量(GB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
