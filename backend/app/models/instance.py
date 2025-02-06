from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, SmallInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base, TimestampMixin

class Instance(Base, TimestampMixin):
    __tablename__ = "instances"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    instance_no = Column(String(32), nullable=False, unique=True, index=True, comment='实例编号')
    order_no = Column(String(32), ForeignKey("static_orders.order_no"), nullable=False, index=True, comment='关联订单号')
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    proxy_ip = Column(String(15), nullable=False, comment='代理IP')
    proxy_port = Column(Integer, nullable=False, comment='代理端口')
    username = Column(String(50), nullable=False, comment='用户名')
    password = Column(String(50), nullable=False, comment='密码')
    expire_time = Column(TIMESTAMP, nullable=False, comment='到期时间')
    status = Column(SmallInteger, nullable=False, default=1, comment='状态(1=正常,0=停用)')
    
    # 关联关系
    user = relationship("User", back_populates="instances")
    static_order = relationship("StaticOrder", back_populates="instances")

    def to_dict(self):
        return {
            'id': self.id,
            'instance_no': self.instance_no,
            'order_no': self.order_no,
            'user_id': self.user_id,
            'proxy_ip': self.proxy_ip,
            'proxy_port': self.proxy_port,
            'username': self.username,
            'password': self.password,
            'expire_time': self.expire_time.isoformat() if self.expire_time else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 