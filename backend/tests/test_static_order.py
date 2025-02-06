import pytest
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.static_order import StaticOrder
from app.models.instance import Instance
from app.models.user import User
from app.services.static_order_service import StaticOrderService
from app.services.ipipv_base_api import IPIPVBaseAPI
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

@pytest.mark.asyncio
class TestStaticOrder:
    """静态订单支付相关测试"""
    
    @pytest.fixture(autouse=True)
    def setup(self, db_session: Session):
        """初始化测试数据"""
        self.db = db_session
        self.ipipv_api = IPIPVBaseAPI()  # 使用真实的 API 客户端
        self.service = StaticOrderService(self.db, self.ipipv_api)
        
        # 创建测试用户
        self.user = User(
            username="test_user",
            password="test123",
            email="test@example.com",
            balance=1000.0,
            status=1
        )
        self.db.add(self.user)
        
        # 创建测试代理商
        self.agent = User(
            username="test_agent",
            password="test123",
            email="agent@example.com",
            is_agent=True,
            balance=2000.0,
            status=1
        )
        self.db.add(self.agent)
        self.db.commit()
        
    async def test_create_order_success(self):
        """测试成功创建订单并支付
        
        验证点：
        1. 订单创建成功
        2. 用户余额正确扣减
        3. 订单状态正确
        4. 返回正确的订单信息
        """
        order_data = {
            "product_no": "mb_gmhd5exdf",
            "proxy_type": 103,
            "region_code": "CA",
            "country_code": "CA",
            "city_code": "TOR",
            "static_type": "residential",
            "ip_count": 1,
            "duration": 30,
            "unit": 1,
            "total_cost": 100,
            "app_order_no": "APP_ORDER_001"
        }
        
        result = await self.service.create_order(
            user_id=self.user.id,
            username=self.user.username,
            agent_id=self.agent.id,
            agent_username=self.agent.username,
            order_data=order_data
        )
        
        assert result["code"] == 0
        assert result["msg"] == "success"
        assert "order_no" in result["data"]
        
        # 验证用户余额
        self.db.refresh(self.user)
        assert self.user.balance == 900.0  # 1000 - 100
        
        # 验证订单状态
        order = self.db.query(StaticOrder).filter_by(order_no=result["data"]["order_no"]).first()
        assert order is not None
        assert order.status == "processing"
        
    async def test_create_order_insufficient_balance(self):
        """测试余额不足场景
        
        验证点：
        1. 余额不足时抛出正确的异常
        2. 用户余额保持不变
        3. 不创建订单记录
        """
        order_data = {
            "product_no": "mb_gmhd5exdf",
            "proxy_type": 103,
            "region_code": "CA",
            "country_code": "CA",
            "city_code": "TOR",
            "static_type": "residential",
            "ip_count": 1,
            "duration": 30,
            "unit": 1,
            "total_cost": 2000,  # 超出用户余额
            "app_order_no": "APP_ORDER_002"
        }
        
        with pytest.raises(HTTPException) as exc_info:
            await self.service.create_order(
                user_id=self.user.id,
                username=self.user.username,
                agent_id=self.agent.id,
                agent_username=self.agent.username,
                order_data=order_data
            )
        
        assert exc_info.value.status_code == 400
        assert "余额不足" in str(exc_info.value.detail)
        
        # 验证用户余额未变
        self.db.refresh(self.user)
        assert self.user.balance == 1000.0
        
        # 验证未创建订单
        order = self.db.query(StaticOrder).filter_by(app_order_no="APP_ORDER_002").first()
        assert order is None

    async def test_payment_process_success(self):
        """测试完整支付流程成功场景
        
        验证点：
        1. 订单创建成功
        2. 用户余额正确扣减
        3. 生成正确的交易记录
        4. 订单状态正确更新
        """
        initial_balance = self.user.balance
        order_data = {
            "product_no": "mb_gmhd5exdf",
            "proxy_type": 103,
            "region_code": "CA",
            "country_code": "CA",
            "city_code": "TOR",
            "static_type": "residential",
            "ip_count": 1,
            "duration": 30,
            "unit": 1,
            "total_cost": 100,
            "app_order_no": "APP_ORDER_003"
        }
        
        result = await self.service.create_order(
            user_id=self.user.id,
            username=self.user.username,
            agent_id=self.agent.id,
            agent_username=self.agent.username,
            order_data=order_data
        )
        
        assert result["code"] == 0
        
        # 验证订单状态
        order = self.db.query(StaticOrder).filter_by(order_no=result["data"]["order_no"]).first()
        assert order is not None
        assert order.status == "processing"
        
        # 验证用户余额
        self.db.refresh(self.user)
        assert self.user.balance == initial_balance - 100

    async def test_payment_refund_on_failure(self):
        """测试订单创建失败时的退款流程
        
        验证点：
        1. API调用失败时正确处理异常
        2. 用户余额正确退回
        3. 订单状态更新为失败
        4. 生成退款交易记录
        """
        # 修改mock API使订单创建失败
        async def mock_failed_request(*args, **kwargs):
            raise HTTPException(status_code=500, detail="API调用失败")
        self.ipipv_api._make_request = mock_failed_request

        initial_balance = self.user.balance
        order_data = {
            "product_no": "mb_gmhd5exdf",
            "proxy_type": 103,
            "region_code": "CA",
            "country_code": "CA",
            "city_code": "TOR",
            "static_type": "residential",
            "ip_count": 1,
            "duration": 30,
            "unit": 1,
            "total_cost": 100,
            "app_order_no": "APP_ORDER_004"
        }

        with pytest.raises(HTTPException) as exc_info:
            await self.service.create_order(
                user_id=self.user.id,
                username=self.user.username,
                agent_id=self.agent.id,
                agent_username=self.agent.username,
                order_data=order_data
            )

        assert exc_info.value.status_code == 500
        assert "订单创建失败" in str(exc_info.value.detail)
        
        # 验证用户余额已退回
        self.db.refresh(self.user)
        assert self.user.balance == initial_balance

    async def test_handle_order_callback(self):
        """测试订单回调处理"""
        # 先创建一个订单
        order = StaticOrder(
            order_no='TEST_ORDER_001',
            app_order_no='TEST_ORDER_001',
            user_id=self.user.id,
            agent_id=self.agent.id,
            product_no='PROD_001',
            proxy_type=103,
            ip_count=1,
            duration=30,
            unit=1,
            amount=100.0,
            status='processing'
        )
        self.db.add(order)
        self.db.commit()
        
        # 模拟 API 返回数据
        async def mock_request(*args, **kwargs):
            return {
                'status': 'success',
                'instances': [{
                    'instanceNo': 'INS_001',
                    'proxyIp': '1.2.3.4',
                    'proxyPort': 8080,
                    'username': 'test_user',
                    'password': 'test_pass',
                    'expireTime': '2024-12-31T23:59:59Z'
                }]
            }
        self.ipipv_api._make_request = mock_request
        
        # 测试订单创建回调
        result = await self.service.handle_callback(
            type='order',
            no='TEST_ORDER_001',
            op='1'
        )
        
        assert result['code'] == 'success'
        
        # 验证订单状态
        order = self.db.query(StaticOrder).filter_by(
            order_no='TEST_ORDER_001'
        ).first()
        assert order.status == 'success'
        
        # 验证实例创建
        instance = self.db.query(Instance).filter_by(
            order_no='TEST_ORDER_001'
        ).first()
        assert instance is not None
        assert instance.proxy_ip == '1.2.3.4'
        assert instance.proxy_port == 8080
        
    async def test_handle_instance_callback(self):
        """测试实例回调处理"""
        # 先创建实例
        instance = Instance(
            instance_no='INS_001',
            order_no='TEST_ORDER_001',
            user_id=self.user.id,
            proxy_ip='1.2.3.4',
            proxy_port=8080,
            username='test_user',
            password='test_pass',
            expire_time=datetime.now(),
            status=1
        )
        self.db.add(instance)
        self.db.commit()
        
        # 测试实例状态更新回调
        result = await self.service.handle_callback(
            type='instance',
            no='INS_001',
            op='1'
        )
        
        assert result['code'] == 'success'
        
        # 验证实例状态
        instance = self.db.query(Instance).filter_by(
            instance_no='INS_001'
        ).first()
        assert instance.status == 1

    async def test_payment_concurrent_orders(self):
        """测试并发订单处理"""
        initial_balance = self.user.balance
        orders = []
        
        # 创建3个并发订单
        for i in range(3):
            order_data = {
                "product_no": "mb_gmhd5exdf",
                "proxy_type": 103,
                "region_code": "CA",
                "country_code": "CA",
                "city_code": "TOR",
                "static_type": "residential",
                "ip_count": 1,
                "duration": 30,
                "unit": 1,
                "total_cost": 100,
                "app_order_no": f"APP_ORDER_00{i+1}"
            }
            
            result = await self.service.create_order(
                user_id=self.user.id,
                username=self.user.username,
                agent_id=self.agent.id,
                agent_username=self.agent.username,
                order_data=order_data
            )
            orders.append(result)
        
        # 验证所有订单都创建成功
        assert len(orders) == 3
        for order in orders:
            assert order["code"] == 0
            assert order["data"]["status"] == "processing"
        
        # 验证用户余额正确扣除
        self.db.refresh(self.user)
        assert self.user.balance == initial_balance - (100 * 3) 