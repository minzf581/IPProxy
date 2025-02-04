from sqlalchemy import Column, Integer, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class AgentPrice(Base, TimestampMixin):
    """代理商价格设置模型"""
    __tablename__ = 'agent_prices'

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    dynamic_proxy_price = Column(Numeric(10, 2), default=0.1)  # 动态代理默认价格
    static_proxy_price = Column(Numeric(10, 2), default=0.2)   # 静态代理默认价格

    # 关联关系
    agent = relationship("User", backref="price_settings")

    def get_dynamic_price(self, resource_type: str = None) -> float:
        """获取动态代理价格"""
        return float(self.dynamic_proxy_price)

    def get_static_price(self, resource_type: str = None, region: str = None) -> float:
        """获取静态代理价格"""
        return float(self.static_proxy_price)

    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            'id': self.id,
            'agent_id': self.agent_id,
            'dynamic_proxy_price': float(self.dynamic_proxy_price),
            'static_proxy_price': float(self.static_proxy_price),
            'created_at': self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            'updated_at': self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None
        } 