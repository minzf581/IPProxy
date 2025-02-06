"""
数据库重置脚本
============

此脚本用于重置数据库并创建默认用户，包括：
1. 删除现有数据库
2. 运行所有迁移
3. 创建默认用户（管理员和代理商）

使用方法：
python3 scripts/reset_db.py
"""

import os
import sys
import logging
from pathlib import Path
import subprocess
import traceback

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from app.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.agent_price import AgentPrice
from decimal import Decimal
from app.core.security import get_password_hash
from sqlalchemy import text

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 设置其他模块的日志级别
logging.getLogger('alembic').setLevel(logging.INFO)
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

def reset_db():
    """重置数据库"""
    try:
        logger.info("开始重置数据库...")
        
        # 创建数据库目录
        instance_dir = project_root / "instance"
        instance_dir.mkdir(exist_ok=True)
        logger.debug(f"数据库目录: {instance_dir}")
        
        # 删除现有数据库文件
        db_path = instance_dir / "test.db"
        if db_path.exists():
            db_path.unlink()
            logger.info(f"已删除现有数据库文件: {db_path}")
        
        # 运行数据库迁移
        logger.info("开始运行数据库迁移...")
        try:
            result = subprocess.run(
                ["alembic", "upgrade", "head"],
                check=True,
                capture_output=True,
                text=True
            )
            logger.debug(f"迁移输出: {result.stdout}")
            logger.info("数据库迁移完成")
        except subprocess.CalledProcessError as e:
            logger.error(f"迁移失败: {e.stderr}")
            raise
        
        # 创建会话
        logger.info("开始创建默认用户...")
        db = SessionLocal()
        try:
            # 清除现有数据
            logger.debug("清除现有数据...")
            db.execute(text("DELETE FROM agent_prices"))
            db.execute(text("DELETE FROM users"))
            db.commit()
            logger.info("已清除现有用户数据")
            
            # 创建管理员用户
            logger.debug("创建管理员用户...")
            admin_password = get_password_hash("admin123")
            logger.debug(f"管理员密码哈希: {admin_password}")
            admin = User(
                username="admin",
                password=admin_password,
                email="admin@example.com",
                is_admin=True,
                is_agent=False,
                status=1,
                balance=1000.0
            )
            db.add(admin)
            db.commit()
            logger.info(f"已创建管理员用户: {admin.username}")
            
            # 创建代理商用户
            logger.debug("创建代理商用户...")
            agent_password = get_password_hash("agent123")
            logger.debug(f"代理商密码哈希: {agent_password}")
            agent = User(
                username="agent",
                password=agent_password,
                email="agent@example.com",
                is_admin=False,
                is_agent=True,
                status=1,
                balance=500.0
            )
            db.add(agent)
            db.commit()
            logger.info(f"已创建代理商用户: {agent.username}")
            
            # 创建代理商价格配置
            logger.debug("创建代理商价格配置...")
            agent_price = AgentPrice(
                agent_id=agent.id,
                dynamic_proxy_price=Decimal('0.1'),
                static_proxy_price=Decimal('0.2')
            )
            db.add(agent_price)
            db.commit()
            logger.info("已创建代理商价格配置")
            
            logger.info("=" * 50)
            logger.info("数据库重置完成！")
            logger.info("默认用户:")
            logger.info("1. 管理员")
            logger.info("   - 用户名: admin")
            logger.info("   - 密码: admin123")
            logger.info("2. 代理商")
            logger.info("   - 用户名: agent")
            logger.info("   - 密码: agent123")
            logger.info("=" * 50)
            
        except Exception as e:
            db.rollback()
            logger.error("初始化数据失败:")
            logger.error(traceback.format_exc())
            raise
        finally:
            db.close()
            
    except Exception as e:
        logger.error("数据库重置失败:")
        logger.error(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    reset_db() 