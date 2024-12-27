from app import db
from datetime import datetime

class DynamicResource(db.Model):
    __tablename__ = 'dynamic_resources'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    resource_type = db.Column(db.Integer)  # 1/2/3
    total_traffic = db.Column(db.Float)  # 总流量配额
    used_traffic = db.Column(db.Float, default=0)  # 已使用流量
    monthly_traffic = db.Column(db.Float, default=0)  # 本月使用流量
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    order_number = db.Column(db.String(64), unique=True)
    status = db.Column(db.String(20), default='active')

class StaticResource(db.Model):
    __tablename__ = 'static_resources'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    ip_address = db.Column(db.String(64))
    ip_range = db.Column(db.String(64))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    order_number = db.Column(db.String(64), unique=True)
    status = db.Column(db.String(20), default='active')

class Instance(db.Model):
    __tablename__ = 'instances'
    
    id = db.Column(db.Integer, primary_key=True)
    instance_id = db.Column(db.String(64), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    proxy_type = db.Column(db.String(20))  # DYNAMIC, STATIC
    country = db.Column(db.String(64))
    city = db.Column(db.String(64))
    isp = db.Column(db.String(64))
    ip_address = db.Column(db.String(64))
    port = db.Column(db.Integer)
    bandwidth = db.Column(db.Integer)
    protocol = db.Column(db.String(20))
    username = db.Column(db.String(64))
    password = db.Column(db.String(64))
    status = db.Column(db.String(20))
    total_traffic = db.Column(db.Float)
    used_traffic = db.Column(db.Float, default=0)
    expire_time = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    order_id = db.Column(db.String(64))

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String(64), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    instance_id = db.Column(db.String(64))
    order_type = db.Column(db.String(20))  # NEW, RENEW, RELEASE
    amount = db.Column(db.Float)
    status = db.Column(db.String(20))
    create_time = db.Column(db.DateTime, default=datetime.utcnow)
    pay_time = db.Column(db.DateTime)
    description = db.Column(db.String(256))

class WhitelistIP(db.Model):
    __tablename__ = 'whitelist_ips'
    
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(64), nullable=False)
    proxy_type = db.Column(db.String(20), nullable=False)  # DYNAMIC, STATIC
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('ip_address', 'proxy_type', name='uix_ip_type'),
    )
