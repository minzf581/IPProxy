from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.database import Base

class Instance(Base):
    __tablename__ = "instances"

    id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(String(50), unique=True, index=True)  # 实例编号
    app_username = Column(String(50), index=True)  # 渠道商子账号
    total_flow = Column(Float, default=0)  # 总流量
    used_flow = Column(Float, default=0)  # 已使用流量
    remaining_flow = Column(Float, default=0)  # 剩余流量
    month_flow = Column(Float, default=0)  # 本月流量
    month_used = Column(Float, default=0)  # 本月已使用
    last_month_used = Column(Float, default=0)  # 上月使用
    today_used = Column(Float, default=0)  # 今日使用
    status = Column(String(20))  # 实例状态
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "instance_id": self.instance_id,
            "app_username": self.app_username,
            "total_flow": self.total_flow,
            "used_flow": self.used_flow,
            "remaining_flow": self.remaining_flow,
            "month_flow": self.month_flow,
            "month_used": self.month_used,
            "last_month_used": self.last_month_used,
            "today_used": self.today_used,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        } 