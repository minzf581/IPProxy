from app import db
from datetime import datetime

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    type = db.Column(db.String(20))  # recharge, consume
    amount = db.Column(db.Float)
    resource_type = db.Column(db.String(20))  # dynamic, static
    resource_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    order_number = db.Column(db.String(64))
    description = db.Column(db.String(256))
    status = db.Column(db.String(20), default='completed')
