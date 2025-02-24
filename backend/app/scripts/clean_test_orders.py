from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sys
import os
import logging

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import get_db
from app.models.dynamic_order import DynamicOrder

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_test_orders():
    """清理测试订单数据"""
    try:
        # 获取数据库会话
        db = next(get_db())
        
        # 查询需要清理的订单
        test_orders = db.query(DynamicOrder).filter(
            (DynamicOrder.order_no.like('TEST%')) |
            (DynamicOrder.app_order_no.like('TEST%')) |
            (DynamicOrder.status == 'pending')
        ).all()
        
        logger.info(f"找到 {len(test_orders)} 个测试订单")
        
        # 打印订单信息
        for order in test_orders:
            logger.info(f"订单号: {order.order_no}, 应用订单号: {order.app_order_no}, "
                       f"状态: {order.status}, 创建时间: {order.created_at}")
        
        # 删除订单
        for order in test_orders:
            db.delete(order)
        
        # 提交更改
        db.commit()
        logger.info("测试订单清理完成")
        
    except Exception as e:
        logger.error(f"清理测试订单时发生错误: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clean_test_orders() 