from flask import Blueprint, request, jsonify
from app.models.resource import DynamicResource, StaticResource, Instance, Order, WhitelistIP
from app.models.user import User
from app.api.auth import token_required
from app import db
from datetime import datetime, timedelta
import uuid
import random

bp = Blueprint('resources', __name__)

@bp.route('/dynamic', methods=['GET'])
@token_required
def get_dynamic_resources(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    
    query = Instance.query.filter_by(
        user_id=current_user.id,
        proxy_type='DYNAMIC'
    )
    
    # 应用过滤条件
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    
    order_id = request.args.get('order_id')
    if order_id:
        query = query.filter_by(order_id=order_id)
    
    ip = request.args.get('ip')
    if ip:
        query = query.filter(Instance.ip_address.like(f'%{ip}%'))
    
    # 分页
    pagination = query.order_by(Instance.created_at.desc()).paginate(
        page=page, per_page=per_page
    )
    
    return jsonify({
        'items': [{
            'id': item.id,
            'instance_id': item.instance_id,
            'ip_address': item.ip_address,
            'port': item.port,
            'bandwidth': item.bandwidth,
            'protocol': item.protocol,
            'total_traffic': item.total_traffic,
            'used_traffic': item.used_traffic,
            'status': item.status,
            'expire_time': item.expire_time.isoformat() if item.expire_time else None,
            'created_at': item.created_at.isoformat(),
            'order_id': item.order_id
        } for item in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })

@bp.route('/static', methods=['GET'])
@token_required
def get_static_resources(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    
    query = Instance.query.filter_by(
        user_id=current_user.id,
        proxy_type='STATIC'
    )
    
    # 应用过滤条件
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    
    order_id = request.args.get('order_id')
    if order_id:
        query = query.filter_by(order_id=order_id)
    
    ip = request.args.get('ip')
    if ip:
        query = query.filter(Instance.ip_address.like(f'%{ip}%'))
    
    # 分页
    pagination = query.order_by(Instance.created_at.desc()).paginate(
        page=page, per_page=per_page
    )
    
    return jsonify({
        'items': [{
            'id': item.id,
            'instance_id': item.instance_id,
            'ip_address': item.ip_address,
            'port': item.port,
            'bandwidth': item.bandwidth,
            'protocol': item.protocol,
            'isp': item.isp,
            'country': item.country,
            'city': item.city,
            'status': item.status,
            'expire_time': item.expire_time.isoformat() if item.expire_time else None,
            'created_at': item.created_at.isoformat(),
            'order_id': item.order_id
        } for item in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })

@bp.route('/dynamic', methods=['POST'])
@token_required
def create_dynamic_resource(current_user):
    data = request.get_json()
    
    if not data or not data.get('resource_type'):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # 检查用户余额
    amount = 100  # 假设固定价格
    if current_user.balance < amount:
        return jsonify({'message': 'Insufficient balance'}), 400
    
    # 创建订单
    order = Order(
        order_id=str(uuid.uuid4()),
        user_id=current_user.id,
        order_type='NEW',
        amount=amount,
        status='PENDING',
        description='新建动态代理资源'
    )
    db.session.add(order)
    
    # 扣除用户余额
    current_user.balance -= amount
    
    # 创建实例
    instance = Instance(
        instance_id=str(uuid.uuid4()),
        user_id=current_user.id,
        proxy_type='DYNAMIC',
        ip_address=f'192.168.1.{random.randint(2, 254)}',  # 模拟IP地址
        port=random.randint(10000, 65535),
        bandwidth=10,
        protocol='HTTP',
        username=str(uuid.uuid4())[:8],
        password=str(uuid.uuid4())[:12],
        status='ACTIVE',
        total_traffic=100,  # 100GB
        expire_time=datetime.utcnow() + timedelta(days=30),
        order_id=order.order_id
    )
    db.session.add(instance)
    
    # 更新订单状态
    order.status = 'COMPLETED'
    order.instance_id = instance.instance_id
    order.pay_time = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Dynamic resource created successfully',
        'instance': {
            'id': instance.id,
            'instance_id': instance.instance_id,
            'ip_address': instance.ip_address,
            'port': instance.port,
            'username': instance.username,
            'password': instance.password,
            'total_traffic': instance.total_traffic,
            'expire_time': instance.expire_time.isoformat()
        }
    }), 201

@bp.route('/static', methods=['POST'])
@token_required
def create_static_resource(current_user):
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'Missing required fields'}), 400
    
    # 检查用户余额
    amount = 200  # 假设固定价格
    if current_user.balance < amount:
        return jsonify({'message': 'Insufficient balance'}), 400
    
    # 创建订单
    order = Order(
        order_id=str(uuid.uuid4()),
        user_id=current_user.id,
        order_type='NEW',
        amount=amount,
        status='PENDING',
        description='新建静态代理资源'
    )
    db.session.add(order)
    
    # 扣除用户余额
    current_user.balance -= amount
    
    # 创建实例
    instance = Instance(
        instance_id=str(uuid.uuid4()),
        user_id=current_user.id,
        proxy_type='STATIC',
        country='中国',
        city='上海',
        isp='电信',
        ip_address=f'202.96.{random.randint(1, 254)}.{random.randint(2, 254)}',  # 模拟IP地址
        port=random.randint(10000, 65535),
        bandwidth=100,
        protocol='HTTP',
        username=str(uuid.uuid4())[:8],
        password=str(uuid.uuid4())[:12],
        status='ACTIVE',
        expire_time=datetime.utcnow() + timedelta(days=30),
        order_id=order.order_id
    )
    db.session.add(instance)
    
    # 更新订单状态
    order.status = 'COMPLETED'
    order.instance_id = instance.instance_id
    order.pay_time = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Static resource created successfully',
        'instance': {
            'id': instance.id,
            'instance_id': instance.instance_id,
            'ip_address': instance.ip_address,
            'port': instance.port,
            'username': instance.username,
            'password': instance.password,
            'bandwidth': instance.bandwidth,
            'expire_time': instance.expire_time.isoformat()
        }
    }), 201

@bp.route('/whitelist', methods=['GET'])
@token_required
def get_whitelist(current_user):
    whitelist = WhitelistIP.query.filter_by(user_id=current_user.id).all()
    return jsonify({
        'items': [{
            'id': item.id,
            'ip_address': item.ip_address,
            'proxy_type': item.proxy_type,
            'created_at': item.created_at.isoformat()
        } for item in whitelist]
    })

@bp.route('/whitelist', methods=['POST'])
@token_required
def add_whitelist(current_user):
    data = request.get_json()
    
    if not data or not data.get('ip_address') or not data.get('proxy_type'):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # 检查IP格式
    ip = data['ip_address']
    if not all(0 <= int(part) <= 255 for part in ip.split('.')):
        return jsonify({'message': 'Invalid IP address'}), 400
    
    # 检查代理类型
    proxy_type = data['proxy_type'].upper()
    if proxy_type not in ['DYNAMIC', 'STATIC']:
        return jsonify({'message': 'Invalid proxy type'}), 400
    
    # 检查是否已存在
    if WhitelistIP.query.filter_by(
        ip_address=ip,
        proxy_type=proxy_type,
        user_id=current_user.id
    ).first():
        return jsonify({'message': 'IP already in whitelist'}), 400
    
    whitelist = WhitelistIP(
        ip_address=ip,
        proxy_type=proxy_type,
        user_id=current_user.id
    )
    db.session.add(whitelist)
    db.session.commit()
    
    return jsonify({
        'message': 'IP added to whitelist',
        'whitelist': {
            'id': whitelist.id,
            'ip_address': whitelist.ip_address,
            'proxy_type': whitelist.proxy_type,
            'created_at': whitelist.created_at.isoformat()
        }
    }), 201

@bp.route('/whitelist/<int:id>', methods=['DELETE'])
@token_required
def remove_whitelist(current_user, id):
    whitelist = WhitelistIP.query.filter_by(
        id=id,
        user_id=current_user.id
    ).first()
    
    if not whitelist:
        return jsonify({'message': 'Whitelist not found'}), 404
    
    db.session.delete(whitelist)
    db.session.commit()
    
    return jsonify({'message': 'IP removed from whitelist'})
