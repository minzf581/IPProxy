from flask import Blueprint

bp = Blueprint('api', __name__)

from . import auth, resources, orders, statistics

bp.register_blueprint(auth.bp, url_prefix='/auth')
bp.register_blueprint(resources.bp, url_prefix='/resources')
bp.register_blueprint(orders.bp, url_prefix='/orders')
bp.register_blueprint(statistics.bp, url_prefix='/statistics')
