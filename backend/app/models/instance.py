from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, SmallInteger, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base, TimestampMixin
import json

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
    ip_whitelist = Column(Text, comment='IP白名单列表')
    
    # 关联关系
    user = relationship("User", back_populates="instances")
    static_order = relationship("StaticOrder", back_populates="instances")

    @property
    def ip_whitelist_list(self):
        """获取IP白名单列表"""
        if self.ip_whitelist:
            try:
                return json.loads(self.ip_whitelist)
            except json.JSONDecodeError:
                return []
        return []

    @ip_whitelist_list.setter
    def ip_whitelist_list(self, value):
        """设置IP白名单列表"""
        if value is None:
            self.ip_whitelist = None
        else:
            self.ip_whitelist = json.dumps(value)

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
            'ip_whitelist': self.ip_whitelist_list,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def add_ip_to_whitelist(self, ip: str) -> bool:
        """添加 IP 到白名单
        
        Args:
            ip: 要添加的 IP 地址
            
        Returns:
            bool: 是否添加成功
        """
        whitelist = self.ip_whitelist_list
        if ip not in whitelist:
            whitelist.append(ip)
            self.ip_whitelist_list = whitelist
            return True
        return False
        
    def remove_ip_from_whitelist(self, ip: str) -> bool:
        """从白名单中移除 IP
        
        Args:
            ip: 要移除的 IP 地址
            
        Returns:
            bool: 是否移除成功
        """
        whitelist = self.ip_whitelist_list
        if ip in whitelist:
            whitelist.remove(ip)
            self.ip_whitelist_list = whitelist
            return True
        return False
        
    def is_ip_in_whitelist(self, ip: str) -> bool:
        """检查 IP 是否在白名单中
        
        Args:
            ip: 要检查的 IP 地址
            
        Returns:
            bool: IP 是否在白名单中
        """
        return ip in self.ip_whitelist_list
        
    def clear_whitelist(self) -> None:
        """清空白名单"""
        self.ip_whitelist_list = [] 