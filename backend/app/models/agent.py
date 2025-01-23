from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Agent(Base):
    """代理商模型"""
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    app_username = Column(String(32), unique=True, index=True, comment="渠道商子账号")
    platform_account = Column(String(32), unique=True, index=True, comment="平台子账号")
    password = Column(String(64), comment="账号密码")
    status = Column(String(20), comment="状态：active=正常, disabled=禁用")
    remark = Column(String(255), comment="备注")
    balance = Column(Float, default=0.0, comment="余额")
    limit_flow = Column(Integer, comment="动态流量上限(MB)")
    main_account = Column(String(32), ForeignKey("main_users.app_username"), comment="关联的主账户")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "app_username": self.app_username,
            "platform_account": self.platform_account,
            "status": self.status,
            "remark": self.remark,
            "balance": self.balance,
            "limit_flow": self.limit_flow,
            "main_account": self.main_account,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        } 