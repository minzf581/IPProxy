"""
数据库初始化脚本
==============

此脚本用于初始化数据库，包括：
1. 创建所有必要的表
2. 创建默认用户（管理员和代理商）
3. 设置初始配置

使用方法：
python3 scripts/init_db.py
"""

import os
import sys
import logging
from pathlib import Path
from datetime import datetime

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from app.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.prices import AgentPrice
from app.models.product_inventory import ProductInventory
from decimal import Decimal
from passlib.context import CryptContext

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 配置密码上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    """初始化数据库"""
    try:
        # 检查并删除现有数据库文件
        db_path = project_root / "app.db"
        if db_path.exists():
            db_path.unlink()
            logger.info("已删除现有数据库文件")
        
        # 删除所有表
        Base.metadata.drop_all(bind=engine)
        logger.info("已删除所有数据库表")
        
        # 创建所有表
        Base.metadata.create_all(bind=engine)
        logger.info("已创建所有数据库表")
        
        # 创建会话
        db = SessionLocal()
        try:
            # 创建管理员用户
            admin = User(
                username="admin",
                password=pwd_context.hash("admin123"),
                email="admin@example.com",
                is_admin=True,
                is_agent=False,
                status=1,
                balance=1000.0
            )
            db.add(admin)
            db.commit()
            logger.info("已创建管理员用户 (admin/admin123)")
            
            # 创建代理商用户
            agent = User(
                username="agent",
                password=pwd_context.hash("agent123"),
                email="agent@example.com",
                is_admin=False,
                is_agent=True,
                status=1,
                balance=500.0
            )
            db.add(agent)
            db.commit()
            logger.info("已创建代理商用户 (agent/agent123)")
            
            # 创建示例产品
            dynamic_proxy = ProductInventory(
                product_no="out_dynamic_1",
                product_name="海外动态",
                proxy_type=104,  # 动态代理
                use_type="1",  # 账密
                protocol="1",  # socks5
                use_limit=3,   # 无限制
                sell_limit=3,  # 无限制
                area_code="",  # 区域代码
                country_code="",  # 国家代码
                state_code="",  # 州省代码
                city_code="",  # 城市代码
                cost_price=Decimal('0.05'),
                global_price=Decimal('0.1'),
                min_agent_price=Decimal('0.08'),
                inventory=10000,  # 库存
                duration=1,
                unit=1,  # 天
                flow=1024,  # 1GB流量
                enable=1,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(dynamic_proxy)
            db.commit()
            logger.info("已创建示例动态代理产品")
            
            # 创建代理商价格配置
            agent_price = AgentPrice(
                agent_id=agent.id,
                product_id=dynamic_proxy.id,
                price=Decimal('0.1')
            )
            db.add(agent_price)
            db.commit()
            logger.info("已创建代理商价格配置")
            
        except Exception as e:
            db.rollback()
            logger.error(f"初始化数据库失败: {e}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"初始化数据库失败: {e}")
        raise

if __name__ == "__main__":
    init_db() 