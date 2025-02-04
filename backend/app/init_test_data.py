from app.database import SessionLocal
from app.models.user import User
from app.models.resource_usage import ResourceUsageHistory, ResourceUsageStatistics
from app.models.static_order import StaticOrder
from app.models.dynamic_order import DynamicOrder
from app.models.transaction import Transaction
from app.models.instance import Instance
from app.models.dashboard import ProxyInfo
from app.models.resource_type import ResourceType
from datetime import datetime, timedelta

def init_test_data():
    """初始化测试数据"""
    db = SessionLocal()
    try:
        # 1. 创建管理员用户
        admin = User(
            username="admin",
            password="admin123",
            email="admin@example.com",
            is_admin=True,
            status="active",
            balance=10000.0
        )
        db.add(admin)
        
        # 2. 创建测试代理商
        agent1 = User(
            username="agent1",
            password="agent123",
            email="agent1@example.com",
            is_agent=True,
            status="active",
            balance=5000.0,
            remark="测试代理商1"
        )
        agent2 = User(
            username="agent2",
            password="agent123",
            email="agent2@example.com",
            is_agent=True,
            status="disabled",
            balance=3000.0,
            remark="测试代理商2"
        )
        db.add_all([agent1, agent2])
        
        # 3. 创建普通用户
        user1 = User(
            username="user1",
            password="user123",
            email="user1@example.com",
            is_agent=False,
            status="active",
            balance=1000.0,
            agent_id=1  # 关联到agent1
        )
        user2 = User(
            username="user2",
            password="user123",
            email="user2@example.com",
            is_agent=False,
            status="active",
            balance=500.0,
            agent_id=1  # 关联到agent1
        )
        user3 = User(
            username="user3",
            password="user123",
            email="user3@example.com",
            is_agent=False,
            status="disabled",
            balance=0.0,
            agent_id=2  # 关联到agent2
        )
        db.add_all([user1, user2, user3])
        
        # 4. 创建代理服务器信息
        proxy_info = ProxyInfo(
            balance=10000.0,
            total_recharge=15000.0,
            total_consumption=5000.0,
            month_recharge=2000.0,
            month_consumption=1000.0,
            last_month_consumption=1500.0
        )
        db.add(proxy_info)
        
        # 5. 创建资源使用统计
        usage_stats = ResourceUsageStatistics(
            resource_type_id=1,  # 假设资源类型ID为1
            total_openings=100,
            monthly_openings=20,
            available_count=80,
            expired_count=20
        )
        db.add(usage_stats)
        
        # 6. 创建订单记录
        order1 = StaticOrder(
            order_no="ORD202401010001",
            user_id=3,  # user1
            agent_id=1,  # agent1
            amount=100.0,
            status="completed",
            resource_type="static1",
            traffic=100,
            expire_time=datetime.now() + timedelta(days=30),
            continent="亚洲",
            country="中国",
            province="广东",
            city="深圳"
        )
        order2 = StaticOrder(
            order_no="ORD202401010002",
            user_id=4,  # user2
            agent_id=1,  # agent1
            amount=200.0,
            status="pending",
            resource_type="static2",
            traffic=200,
            expire_time=datetime.now() + timedelta(days=60),
            continent="欧洲",
            country="德国",
            province="柏林",
            city="柏林"
        )
        db.add_all([order1, order2])
        
        # 7. 创建交易记录
        transaction1 = Transaction(
            user_id=3,  # user1
            amount=100.0,
            type="recharge",
            status="completed",
            remark="充值"
        )
        transaction2 = Transaction(
            user_id=4,  # user2
            amount=50.0,
            type="consumption",
            status="completed",
            remark="消费"
        )
        db.add_all([transaction1, transaction2])
        
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_test_data() 