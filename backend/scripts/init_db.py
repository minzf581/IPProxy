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

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from app.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.agent_price import AgentPrice
from app.models.agent_statistics import AgentStatistics
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
        # 创建数据库目录
        instance_dir = project_root / "instance"
        instance_dir.mkdir(exist_ok=True)
        
        # 删除现有数据库文件
        db_path = instance_dir / "test.db"
        if db_path.exists():
            db_path.unlink()
            logger.info("已删除现有数据库文件")
        
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
            
            # 创建代理商价格配置
            agent_price = AgentPrice(
                agent_id=agent.id,
                dynamic_proxy_price=Decimal('0.1'),
                static_proxy_price=Decimal('0.2')
            )
            db.add(agent_price)
            db.commit()
            logger.info("已创建代理商价格配置")
            
            # 创建代理商统计信息
            agent_stats = AgentStatistics(
                agent_id=agent.id,
                total_users=0,
                active_users=0,
                total_orders=0,
                active_orders=0,
                total_consumption=Decimal('0.0'),
                monthly_consumption=Decimal('0.0'),
                dynamic_resource_count=0,
                static_resource_count=0
            )
            db.add(agent_stats)
            db.commit()
            logger.info("已创建代理商统计信息")
            
            # 创建示例产品库存
            product = ProductInventory(
                product_no="STATIC_USA_LAX_1",
                product_name="美国洛杉矶静态代理",
                proxy_type=103,
                use_type="1",
                protocol="1",
                use_limit=1,
                sell_limit=1,
                area_code="6",
                country_code="USA",
                state_code="CA",
                city_code="USA0CALAX",
                detail="美国洛杉矶静态代理",
                cost_price=Decimal('0.1'),
                inventory=100,
                ip_type=1,
                isp_type=1,
                net_type=1,
                duration=30,
                unit=1,
                band_width=100,
                band_width_price=Decimal('0.1'),
                max_band_width=1000,
                flow=1000,
                cpu=1,
                memory=1.0,
                enable=1,
                supplier_code="SUP001",
                ip_count=1,
                ip_duration=30,
                assign_ip=1,
                cidr_status=1,
                static_type="1"
            )
            db.add(product)
            db.commit()
            logger.info("已创建示例产品库存")
            
            logger.info("数据库初始化完成！")
            logger.info("\n默认用户:")
            logger.info("1. 管理员")
            logger.info("   - 用户名: admin")
            logger.info("   - 密码: admin123")
            logger.info("2. 代理商")
            logger.info("   - 用户名: agent")
            logger.info("   - 密码: agent123")
            
        except Exception as e:
            db.rollback()
            logger.error(f"初始化数据失败: {str(e)}")
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    init_db() 