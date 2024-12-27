from celery import Celery
from flask import current_app
from ..models import db, Instance, Order, User
from .api_client import APIClient

celery = Celery('tasks')

@celery.task
def sync_instance_status(instance_id):
    """同步实例状态"""
    with current_app.app_context():
        api_client = APIClient()
        instance = Instance.query.get(instance_id)
        if not instance:
            return
        
        try:
            result = api_client.get_instance_info(instance_id)
            if result['code'] == 200:
                instance_data = result['data']
                instance.status = instance_data['status']
                instance.expire_time = instance_data['expireTime']
                instance.bandwidth = instance_data['bandwidth']
                instance.used_traffic = instance_data['usedTraffic']
                db.session.commit()
        except Exception as e:
            current_app.logger.error(f"Failed to sync instance {instance_id}: {str(e)}")

@celery.task
def process_order_callback(order_data):
    """处理订单回调"""
    with current_app.app_context():
        order = Order.query.filter_by(order_id=order_data['orderId']).first()
        if not order:
            order = Order(order_id=order_data['orderId'])
        
        order.status = order_data['status']
        order.amount = order_data['amount']
        order.create_time = order_data['createTime']
        
        if order_data['status'] == 'SUCCESS':
            user = User.query.get(order.user_id)
            if user:
                user.balance += order.amount
        
        db.session.add(order)
        db.session.commit()

@celery.task
def sync_app_info():
    """同步应用信息"""
    with current_app.app_context():
        api_client = APIClient()
        try:
            result = api_client.get_app_info()
            if result['code'] == 200:
                # 更新系统配置或缓存
                current_app.config['APP_BALANCE'] = result['data']['balance']
                current_app.config['APP_STATUS'] = result['data']['status']
        except Exception as e:
            current_app.logger.error(f"Failed to sync app info: {str(e)}")

@celery.task
def clean_expired_instances():
    """清理过期实例"""
    with current_app.app_context():
        instances = Instance.query.filter_by(status='EXPIRED').all()
        for instance in instances:
            try:
                api_client = APIClient()
                result = api_client.release_dynamic_proxy({
                    'instanceId': instance.instance_id
                })
                if result['code'] == 200:
                    instance.status = 'RELEASED'
                    db.session.commit()
            except Exception as e:
                current_app.logger.error(
                    f"Failed to release instance {instance.instance_id}: {str(e)}"
                )
