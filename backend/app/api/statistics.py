from flask import Blueprint, request, jsonify
from app.models.resource import Instance, Order
from app.models.user import User
from app.api.auth import token_required
from app import db
from datetime import datetime, timedelta
from sqlalchemy import func

bp = Blueprint('statistics', __name__)

@bp.route('/overview', methods=['GET'])
@token_required
def get_overview(current_user):
    # 获取用户的资源统计
    dynamic_count = Instance.query.filter_by(
        user_id=current_user.id,
        proxy_type='DYNAMIC',
        status='ACTIVE'
    ).count()
    
    static_count = Instance.query.filter_by(
        user_id=current_user.id,
        proxy_type='STATIC',
        status='ACTIVE'
    ).count()
    
    # 获取本月消费
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_expense = db.session.query(func.sum(Order.amount)).filter(
        Order.user_id == current_user.id,
        Order.status == 'COMPLETED',
        Order.create_time >= start_of_month
    ).scalar() or 0
    
    # 获取总消费
    total_expense = db.session.query(func.sum(Order.amount)).filter(
        Order.user_id == current_user.id,
        Order.status == 'COMPLETED'
    ).scalar() or 0
    
    return jsonify({
        'dynamic_resources': dynamic_count,
        'static_resources': static_count,
        'monthly_expense': monthly_expense,
        'total_expense': total_expense,
        'balance': current_user.balance
    })

@bp.route('/resource_trend', methods=['GET'])
@token_required
def get_resource_trend(current_user):
    days = request.args.get('days', 7, type=int)
    if days > 90:  # 限制最大查询天数
        days = 90
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # 查询每天的动态资源数量
    dynamic_stats = db.session.query(
        func.date(Instance.created_at).label('date'),
        func.count().label('count')
    ).filter(
        Instance.user_id == current_user.id,
        Instance.proxy_type == 'DYNAMIC',
        Instance.created_at >= start_date
    ).group_by(func.date(Instance.created_at)).all()
    
    # 查询每天的静态资源数量
    static_stats = db.session.query(
        func.date(Instance.created_at).label('date'),
        func.count().label('count')
    ).filter(
        Instance.user_id == current_user.id,
        Instance.proxy_type == 'STATIC',
        Instance.created_at >= start_date
    ).group_by(func.date(Instance.created_at)).all()
    
    # 格式化数据
    dynamic_data = {str(date): count for date, count in dynamic_stats}
    static_data = {str(date): count for date, count in static_stats}
    
    # 生成日期列表
    date_list = [(datetime.utcnow() - timedelta(days=x)).date() for x in range(days)]
    date_list.reverse()
    
    return jsonify({
        'dates': [str(date) for date in date_list],
        'dynamic': [dynamic_data.get(str(date), 0) for date in date_list],
        'static': [static_data.get(str(date), 0) for date in date_list]
    })

@bp.route('/expense_trend', methods=['GET'])
@token_required
def get_expense_trend(current_user):
    days = request.args.get('days', 7, type=int)
    if days > 90:  # 限制最大查询天数
        days = 90
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # 查询每天的消费金额
    expense_stats = db.session.query(
        func.date(Order.create_time).label('date'),
        func.sum(Order.amount).label('amount')
    ).filter(
        Order.user_id == current_user.id,
        Order.status == 'COMPLETED',
        Order.create_time >= start_date
    ).group_by(func.date(Order.create_time)).all()
    
    # 格式化数据
    expense_data = {str(date): float(amount) for date, amount in expense_stats}
    
    # 生成日期列表
    date_list = [(datetime.utcnow() - timedelta(days=x)).date() for x in range(days)]
    date_list.reverse()
    
    return jsonify({
        'dates': [str(date) for date in date_list],
        'amounts': [expense_data.get(str(date), 0) for date in date_list]
    })

@bp.route('/traffic_stats', methods=['GET'])
@token_required
def get_traffic_stats(current_user):
    # 获取所有动态资源的流量统计
    instances = Instance.query.filter_by(
        user_id=current_user.id,
        proxy_type='DYNAMIC',
        status='ACTIVE'
    ).all()
    
    total_traffic = sum(instance.total_traffic or 0 for instance in instances)
    used_traffic = sum(instance.used_traffic or 0 for instance in instances)
    
    # 计算本月使用的流量
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_traffic = sum(
        instance.used_traffic - (
            instance.total_traffic - instance.used_traffic
            if instance.created_at < start_of_month
            else 0
        )
        for instance in instances
        if instance.used_traffic is not None
    )
    
    return jsonify({
        'total_traffic': total_traffic,
        'used_traffic': used_traffic,
        'available_traffic': total_traffic - used_traffic,
        'monthly_traffic': monthly_traffic,
        'instance_count': len(instances)
    })
