from sqlalchemy import Column, Integer, String, DECIMAL, TIMESTAMP, SmallInteger, Text, Float, CheckConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base, TimestampMixin

class ProductInventory(Base, TimestampMixin):
    __tablename__ = "product_inventory"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_no = Column(String(50), nullable=False, comment='产品编号', unique=True)
    product_name = Column(String(100), nullable=False, comment='商品名称')
    proxy_type = Column(SmallInteger, nullable=False, comment='代理类型')
    use_type = Column(String(20), nullable=False, comment='使用类型(1=账密,2=白名单,3=uuid)')
    protocol = Column(String(20), nullable=False, comment='协议(1=socks5,2=http,3=https,4=ssh)')
    use_limit = Column(SmallInteger, nullable=False, comment='使用限制(1=出口ip国外,2=出口ip国内,3=无限制)')
    sell_limit = Column(SmallInteger, nullable=False, comment='销售限制(1=大陆可售,2=海外可售,3=无限制)')
    area_code = Column(String(20), comment='区域代码')
    country_code = Column(String(3), nullable=False, comment='国家代码')
    state_code = Column(String(6), nullable=False, comment='州省代码')
    city_code = Column(String(9), nullable=False, comment='城市代码')
    detail = Column(Text, comment='商品描述')
    cost_price = Column(DECIMAL(10,4), nullable=False, comment='成本价格')
    global_price = Column(DECIMAL(10,4), comment='全局销售价格')
    min_agent_price = Column(DECIMAL(10,4), comment='最低代理商价格')
    inventory = Column(Integer, nullable=False, default=0, comment='库存')
    ip_type = Column(SmallInteger, default=1, comment='ip类型(1=ipv4,2=ipv6,3=随机)')
    isp_type = Column(SmallInteger, default=0, comment='isp类型(1=单isp,2=双isp,0=未知)')
    net_type = Column(SmallInteger, default=0, comment='网络类型(1=原生,2=广播,0=未知)')
    duration = Column(Integer, nullable=False, comment='时长')
    unit = Column(SmallInteger, nullable=False, comment='单位(1=天,2=周,3=月,4=年)')
    band_width = Column(Integer, comment='带宽(MB)')
    band_width_price = Column(DECIMAL(10,4), comment='额外带宽价格')
    max_band_width = Column(Integer, comment='最大带宽')
    flow = Column(Integer, comment='流量包大小(MB)')
    cpu = Column(Integer, comment='CPU数量')
    memory = Column(Float, comment='内存容量')
    enable = Column(SmallInteger, default=1, comment='是否可购买')
    supplier_code = Column(String(20), comment='供应商代码')
    ip_count = Column(Integer, comment='IP数量')
    ip_duration = Column(Integer, comment='IP时长(分钟)')
    assign_ip = Column(SmallInteger, default=-1, comment='是否支持指定IP(-1=否,1=是)')
    cidr_status = Column(SmallInteger, default=-1, comment='是否支持网段(-1=否,1=是)')
    static_type = Column(String(20), comment='静态代理类型')
    last_sync_time = Column(TIMESTAMP, comment='最后同步时间')
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)
    ip_start = Column(String(15), comment='IP段起始地址')
    ip_end = Column(String(15), comment='IP段结束地址')

    # 添加关系
    usage_statistics = relationship("ResourceUsageStatistics", back_populates="resource_type")
    usage_history = relationship("ResourceUsageHistory", back_populates="resource_type")

    __table_args__ = (
        Index('ix_product_inventory_product_no', 'product_no'),
        Index('ix_product_inventory_proxy_type', 'proxy_type'),
        Index('ix_product_inventory_area_code', 'area_code'),
        Index('ix_product_inventory_country_code', 'country_code'),
        Index('ix_product_inventory_city_code', 'city_code'),
        Index('ix_product_inventory_supplier_code', 'supplier_code'),
        Index('ix_product_inventory_static_type', 'static_type'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'product_no': self.product_no,
            'product_name': self.product_name,
            'proxy_type': self.proxy_type,
            'use_type': self.use_type,
            'protocol': self.protocol,
            'use_limit': self.use_limit,
            'sell_limit': self.sell_limit,
            'area_code': self.area_code,
            'country_code': self.country_code,
            'state_code': self.state_code,
            'city_code': self.city_code,
            'detail': self.detail,
            'cost_price': float(self.cost_price) if self.cost_price else None,
            'global_price': float(self.global_price) if self.global_price else None,
            'min_agent_price': float(self.min_agent_price) if self.min_agent_price else None,
            'inventory': self.inventory,
            'ip_type': self.ip_type,
            'isp_type': self.isp_type,
            'net_type': self.net_type,
            'duration': self.duration,
            'unit': self.unit,
            'band_width': self.band_width,
            'band_width_price': float(self.band_width_price) if self.band_width_price else None,
            'max_band_width': self.max_band_width,
            'flow': self.flow,
            'cpu': self.cpu,
            'memory': self.memory,
            'enable': self.enable,
            'supplier_code': self.supplier_code,
            'ip_count': self.ip_count,
            'ip_duration': self.ip_duration,
            'assign_ip': self.assign_ip,
            'cidr_status': self.cidr_status,
            'static_type': self.static_type,
            'last_sync_time': self.last_sync_time.isoformat() if self.last_sync_time else None,
            'ip_start': self.ip_start,
            'ip_end': self.ip_end,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 