from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class MainUser(Base):
    """主账户模型"""
    __tablename__ = "main_users"

    id = Column(Integer, primary_key=True, index=True)
    app_username = Column(String(32), unique=True, index=True, comment="渠道商主账号")
    username = Column(String(32), unique=True, index=True, comment="平台主账号")
    password = Column(String(64), comment="主账号密码")
    phone = Column(String(20), comment="主账号手机号")
    email = Column(String(64), comment="主账号邮箱")
    auth_type = Column(Integer, comment="认证类型 1=未实名 2=个人实名 3=企业实名")
    auth_name = Column(String(64), comment="主账号实名认证的真实名字或者企业名")
    auth_no = Column(String(64), comment="主账号实名认证的实名证件号码或者企业营业执照号码")
    status = Column(Integer, comment="状态 1=正常 2=禁用")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "app_username": self.app_username,
            "username": self.username,
            "phone": self.phone,
            "email": self.email,
            "auth_type": self.auth_type,
            "auth_name": self.auth_name,
            "auth_no": self.auth_no,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        } 