from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from passlib.hash import bcrypt
import logging
from app.models.base import Base

# 获取当前文件所在目录
current_dir = os.path.dirname(os.path.abspath(__file__))

# 使用相对路径构建数据库URL
DATABASE_URL = f"sqlite:///{os.path.join(current_dir, '..', 'app.db')}"

# 创建引擎
engine = create_engine(DATABASE_URL)

# 创建会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def init_db():
    """初始化数据库"""
    # 确保导入所有模型
    from app.models import (
        User, Transaction, ResourceType, ResourceUsageStatistics,
        ResourceUsageHistory, ProxyInfo, AgentPrice, StaticOrder,
        DynamicOrder, Instance
    )
    
    try:
        # 检查数据库文件是否存在
        db_path = os.path.join(current_dir, '..', 'app.db')
        if not os.path.exists(db_path):
            # 创建所有表
            Base.metadata.create_all(bind=engine)
            logging.info("数据库表已创建")
            
            # 初始化测试数据
            init_test_data()
            logging.info("测试数据已初始化")
        else:
            logging.info("数据库已存在，跳过初始化")
    except Exception as e:
        logging.error(f"数据库初始化失败: {str(e)}")
        raise

def init_test_data():
    """Initialize test data."""
    from app.models import User, AgentPrice
    from decimal import Decimal
    
    db = SessionLocal()
    try:
        # 创建管理员账户
        admin = db.query(User).filter_by(username="admin").first()
        if not admin:
            admin = User(
                username="admin",
                password="admin123",
                email="admin@example.com",
                is_admin=True,
                is_agent=False,
                status=1,
                balance=1000.0  # 初始余额
            )
            db.add(admin)
            db.commit()
            logging.info("管理员账户创建成功")

        # 创建代理商账户
        agent = db.query(User).filter_by(username="agent").first()
        if not agent:
            agent = User(
                username="agent",
                password="agent123",
                email="agent@example.com",
                is_admin=False,
                is_agent=True,
                status=1,
                balance=500.0  # 初始余额
            )
            db.add(agent)
            db.commit()
            logging.info("代理商账户创建成功")
            
        # 为代理商创建价格配置
        agent_price = db.query(AgentPrice).filter_by(agent_id=agent.id).first()
        if not agent_price:
            agent_price = AgentPrice(
                agent_id=agent.id,
                dynamic_proxy_price=Decimal('0.1'),  # 动态代理价格
                static_proxy_price=Decimal('0.2')    # 静态代理价格
            )
            db.add(agent_price)
            db.commit()
            logging.info("代理商价格配置创建成功")
        
        logging.info("测试数据初始化完成")
            
    except Exception as e:
        db.rollback()
        logging.error(f"初始化测试数据失败: {str(e)}")
        raise e
    finally:
        db.close()

# 在模块加载时初始化数据库
try:
    init_db()
except Exception as e:
    logging.error(f"数据库初始化失败: {str(e)}")
