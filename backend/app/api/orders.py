from flask import Blueprint, request, jsonify
from app.models.resource import Order, Instance
from app.models.user import User
from app.api.auth import token_required
from app import db
from datetime import datetime, timedelta
import uuid

bp = Blueprint('orders', __name__)

@bp.route('', methods=['GET'])
@token_required
def get_orders(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    
    query = Order.query.filter_by(user_id=current_user.id)
    
    # 应用过滤条件
    order_type = request.args.get('type')
    if order_type:
        query = query.filter_by(order_type=order_type)
    
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    
    order_id = request.args.get('order_id')
    if order_id:
        query = query.filter_by(order_id=order_id)
    
    # 时间范围过滤
    start_time = request.args.get('start_time')
    if start_time:
        query = query.filter(Order.create_time >= datetime.fromisoformat(start_time))
    
    end_time = request.args.get('end_time')
    if end_time:
        query = query.filter(Order.create_time <= datetime.fromisoformat(end_time))
    
    # 分页
    pagination = query.order_by(Order.create_time.desc()).paginate(
        page=page, per_page=per_page
    )
    
    return jsonify({
        'items': [{
            'id': item.id,
            'order_id': item.order_id,
            'order_type': item.order_type,
            'amount': item.amount,
            'status': item.status,
            'create_time': item.create_time.isoformat(),
            'pay_time': item.pay_time.isoformat() if item.pay_time else None,
            'description': item.description,
            'instance_id': item.instance_id
        } for item in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })

@bp.route('/renew', methods=['POST'])
@token_required
def renew_resource(current_user):
    data = request.get_json()
    
    if not data or not data.get('instance_id') or not data.get('duration'):
        return jsonify({'message': 'Missing required fields'}), 400
    
    instance = Instance.query.filter_by(
        instance_id=data['instance_id'],
        user_id=current_user.id
    ).first()
    
    if not instance:
        return jsonify({'message': 'Instance not found'}), 404
    
    if instance.status not in ['ACTIVE', 'EXPIRED']:
        return jsonify({'message': 'Instance cannot be renewed'}), 400
    
    # 计算续费金额
    duration = int(data['duration'])
    if duration < 1:
        return jsonify({'message': 'Invalid duration'}), 400
    
    amount = duration * (100 if instance.proxy_type == 'DYNAMIC' else 200)
    
    # 检查用户余额
    if current_user.balance < amount:
        return jsonify({'message': 'Insufficient balance'}), 400
    
    # 创建续费订单
    order = Order(
        order_id=str(uuid.uuid4()),
        user_id=current_user.id,
        instance_id=instance.instance_id,
        order_type='RENEW',
        amount=amount,
        status='PENDING',
        description=f'续费{duration}天'
    )
    db.session.add(order)
    
    # 扣除用户余额
    current_user.balance -= amount
    
    # 更新实例过期时间
    if instance.expire_time and instance.expire_time > datetime.utcnow():
        instance.expire_time += timedelta(days=duration)
    else:
        instance.expire_time = datetime.utcnow() + timedelta(days=duration)
    
    instance.status = 'ACTIVE'
    
    # 更新订单状态
    order.status = 'COMPLETED'
    order.pay_time = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Resource renewed successfully',
        'order': {
            'order_id': order.order_id,
            'amount': order.amount,
            'status': order.status,
            'create_time': order.create_time.isoformat(),
            'pay_time': order.pay_time.isoformat()
        },
        'instance': {
            'instance_id': instance.instance_id,
            'status': instance.status,
            'expire_time': instance.expire_time.isoformat()
        }
    })

@bp.route('/release', methods=['POST'])
@token_required
def release_resource(current_user):
    data = request.get_json()
    
    if not data or not data.get('instance_id'):
        return jsonify({'message': 'Missing instance_id'}), 400
    
    instance = Instance.query.filter_by(
        instance_id=data['instance_id'],
        user_id=current_user.id
    ).first()
    
    if not instance:
        return jsonify({'message': 'Instance not found'}), 404
    
    if instance.status not in ['ACTIVE', 'EXPIRED']:
        return jsonify({'message': 'Instance cannot be released'}), 400
    
    # 创建释放订单
    order = Order(
        order_id=str(uuid.uuid4()),
        user_id=current_user.id,
        instance_id=instance.instance_id,
        order_type='RELEASE',
        amount=0,
        status='COMPLETED',
        description='释放资源',
        pay_time=datetime.utcnow()
    )
    db.session.add(order)
    
    # 更新实例状态
    instance.status = 'RELEASED'
    
    db.session.commit()
    
    return jsonify({
        'message': 'Resource released successfully',
        'order': {
            'order_id': order.order_id,
            'status': order.status,
            'create_time': order.create_time.isoformat()
        },
        'instance': {
            'instance_id': instance.instance_id,
            'status': instance.status
        }
    })
