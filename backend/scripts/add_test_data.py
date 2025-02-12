"""
添加测试数据脚本
"""

import os
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from app.database import SessionLocal
from app.models.product_inventory import ProductInventory
from decimal import Decimal
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_test_data():
    """添加测试数据"""
    db = SessionLocal()
    try:
        # 创建测试产品库存数据
        test_products = [
            {
                "product_no": "STATIC-US-001",
                "product_name": "美国静态住宅代理",
                "proxy_type": 103,  # 静态国外家庭代理
                "use_type": "1",  # 账密
                "protocol": "1",  # socks5
                "use_limit": 1,  # 出口ip国外
                "sell_limit": 1,  # 大陆可售
                "area_code": "NA",  # 北美
                "country_code": "US",  # 美国
                "state_code": "CA",  # 加利福尼亚
                "city_code": "LAX",  # 洛杉矶
                "detail": "美国洛杉矶静态住宅代理",
                "cost_price": Decimal('0.5'),
                "global_price": Decimal('1.0'),
                "inventory": 100,
                "ip_type": 1,  # ipv4
                "isp_type": 1,  # 单isp
                "net_type": 1,  # 原生
                "duration": 30,
                "unit": 1,  # 天
                "band_width": 100,
                "band_width_price": Decimal('0.1'),
                "max_band_width": 1000,
                "flow": 1000,
                "ip_count": 1,
                "ip_duration": 60,
                "assign_ip": 1,
                "cidr_status": -1,
                "static_type": "residential",
                "enable": 1
            },
            {
                "product_no": "STATIC-UK-001",
                "product_name": "英国静态住宅代理",
                "proxy_type": 103,  # 静态国外家庭代理
                "use_type": "1",  # 账密
                "protocol": "1",  # socks5
                "use_limit": 1,  # 出口ip国外
                "sell_limit": 1,  # 大陆可售
                "area_code": "EU",  # 欧洲
                "country_code": "GB",  # 英国
                "state_code": "LDN",  # 伦敦
                "city_code": "LON",  # 伦敦
                "detail": "英国伦敦静态住宅代理",
                "cost_price": Decimal('0.6'),
                "global_price": Decimal('1.2'),
                "inventory": 50,
                "ip_type": 1,  # ipv4
                "isp_type": 1,  # 单isp
                "net_type": 1,  # 原生
                "duration": 30,
                "unit": 1,  # 天
                "band_width": 100,
                "band_width_price": Decimal('0.1'),
                "max_band_width": 1000,
                "flow": 1000,
                "ip_count": 1,
                "ip_duration": 60,
                "assign_ip": 1,
                "cidr_status": -1,
                "static_type": "residential",
                "enable": 1
            },
            {
                "product_no": "STATIC-JPN-001",
                "product_name": "日本静态住宅代理",
                "proxy_type": 103,  # 静态国外家庭代理
                "use_type": "1",  # 账密
                "protocol": "1",  # socks5
                "use_limit": 1,  # 出口ip国外
                "sell_limit": 1,  # 大陆可售
                "area_code": "1",  # 亚太地区
                "country_code": "JPN",  # 日本
                "state_code": "TKY",  # 东京
                "city_code": "JPN000000",  # 东京
                "detail": "日本东京静态住宅代理",
                "cost_price": Decimal('0.7'),
                "global_price": Decimal('1.4'),
                "inventory": 80,
                "ip_type": 1,  # ipv4
                "isp_type": 1,  # 单isp
                "net_type": 1,  # 原生
                "duration": 30,
                "unit": 1,  # 天
                "band_width": 100,
                "band_width_price": Decimal('0.1'),
                "max_band_width": 1000,
                "flow": 1000,
                "ip_count": 1,
                "ip_duration": 60,
                "assign_ip": 1,
                "cidr_status": -1,
                "static_type": "2",  # 静态类型为2
                "enable": 1
            }
        ]

        for product_data in test_products:
            # 检查产品是否已存在
            existing_product = db.query(ProductInventory).filter_by(
                product_no=product_data["product_no"]
            ).first()
            
            if existing_product:
                logger.info(f"更新产品: {product_data['product_name']}")
                for key, value in product_data.items():
                    setattr(existing_product, key, value)
            else:
                logger.info(f"创建产品: {product_data['product_name']}")
                product = ProductInventory(**product_data)
                db.add(product)
                
        db.commit()
        logger.info("测试数据添加成功")
        
    except Exception as e:
        db.rollback()
        logger.error(f"添加测试数据失败: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_test_data() 