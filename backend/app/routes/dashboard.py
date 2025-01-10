from flask import Blueprint, jsonify
from ..services.ipproxy_service import IPProxyService

dashboard_bp = Blueprint('dashboard', __name__)
ipproxy_service = IPProxyService()

@dashboard_bp.route('/api/dashboard/info', methods=['GET'])
def get_dashboard_info():
    try:
        data = ipproxy_service.get_app_info()
        return jsonify({
            "code": 200,
            "msg": "success",
            "data": {
                "totalRecharge": data.get("totalRecharge", 0),
                "totalConsumption": data.get("totalConsumption", 0),
                "balance": data.get("balance", 0)
            }
        })
    except Exception as e:
        return jsonify({
            "code": 500,
            "msg": str(e),
            "data": None
        }), 500

@dashboard_bp.route('/api/dashboard/statistics', methods=['GET'])
def get_dashboard_statistics():
    try:
        data = ipproxy_service.get_statistics()
        return jsonify({
            "code": 200,
            "msg": "success",
            "data": {
                "monthRecharge": data.get("monthRecharge", 0),
                "monthConsumption": data.get("monthConsumption", 0),
                "lastMonthConsumption": data.get("lastMonthConsumption", 0)
            }
        })
    except Exception as e:
        return jsonify({
            "code": 500,
            "msg": str(e),
            "data": None
        }), 500
