from sqlalchemy import Column, Integer, String, DECIMAL, TIMESTAMP, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base, TimestampMixin

class StaticOrder(Base, TimestampMixin):
    __tablename__ = "static_orders"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    order_no = Column(String(32), nullable=False, unique=True, index=True, comment='我方订单号')
    app_order_no = Column(String(32), nullable=False, index=True, comment='IPIPV平台订单号')
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_no = Column(String(50), nullable=False, index=True, comment='产品编号')
    proxy_type = Column(Integer, nullable=False, index=True, comment='代理类型')
    region_code = Column(String(20), index=True, comment='区域代码')
    country_code = Column(String(3), index=True, comment='国家代码')
    city_code = Column(String(9), index=True, comment='城市代码')
    static_type = Column(String(20), index=True, comment='静态代理类型')
    ip_count = Column(Integer, nullable=False, comment='IP数量')
    duration = Column(Integer, nullable=False, comment='购买时长')
    unit = Column(Integer, nullable=False, comment='时长单位(1=天,2=周,3=月)')
    amount = Column(DECIMAL(10,2), nullable=False, comment='订单金额')
    status = Column(String(20), nullable=False, index=True, comment='订单状态')
    callback_count = Column(Integer, default=0, comment='回调次数')
    last_callback_time = Column(TIMESTAMP, comment='最后回调时间')
    remark = Column(Text, comment='备注')
    
    # 关联关系
    user = relationship("User", foreign_keys=[user_id], back_populates="static_orders")
    agent = relationship("User", foreign_keys=[agent_id], back_populates="agent_static_orders")
    instances = relationship("Instance", back_populates="static_order")

    def to_dict(self):
        return {
            'id': self.id,
            'order_no': self.order_no,
            'app_order_no': self.app_order_no,
            'user_id': self.user_id,
            'agent_id': self.agent_id,
            'product_no': self.product_no,
            'proxy_type': self.proxy_type,
            'region_code': self.region_code,
            'country_code': self.country_code,
            'city_code': self.city_code,
            'static_type': self.static_type,
            'ip_count': self.ip_count,
            'duration': self.duration,
            'unit': self.unit,
            'amount': float(self.amount) if self.amount else None,
            'status': self.status,
            'callback_count': self.callback_count,
            'last_callback_time': self.last_callback_time.isoformat() if self.last_callback_time else None,
            'remark': self.remark,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 