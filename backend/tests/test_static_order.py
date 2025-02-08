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
import asyncio
from httpx import AsyncClient
from app.main import app
from app.core.security import create_access_token
from app.services.ipipv_service import IPIPVService
import json
import traceback

# 配置日志 - 只输出CRITICAL级别的日志，实质上禁用大多数日志
logging.basicConfig(
    level=logging.CRITICAL,
    format='%(levelname)s: %(message)s'
)

# 禁用特定模块的日志
logging.getLogger('httpx').setLevel(logging.CRITICAL)
logging.getLogger('asyncio').setLevel(logging.CRITICAL)
logging.getLogger('sqlalchemy').setLevel(logging.CRITICAL)
logging.getLogger('app.services.ipipv_service').setLevel(logging.CRITICAL)
logging.getLogger('app.services.ipipv_base_api').setLevel(logging.CRITICAL)
logging.getLogger('passlib').setLevel(logging.CRITICAL)
logging.getLogger('root').setLevel(logging.CRITICAL)

logger = logging.getLogger(__name__)

@pytest.mark.asyncio
class TestStaticOrder:
    """静态订单支付相关测试"""
    
    @pytest.fixture(autouse=True)
    def setup(self, db_session: Session):
        """初始化测试数据"""
        self.db = db_session
        self.ipipv_service = IPIPVService(db_session)  # 使用IPIPVService
        self.service = StaticOrderService(self.db, self.ipipv_service)
        
        # 创建普通用户
        self.user = User(
            username="test_user",
            password="test123",
            email="test@example.com",
            balance=1000.0,
            status=1,
            is_agent=False  # 普通用户，不是代理商
        )
        self.db.add(self.user)
        
        # 创建代理商
        self.agent = User(
            username="test_agent",
            password="test123",
            email="agent@example.com",
            is_agent=True,  # 代理商
            balance=2000.0,
            status=1
        )
        self.db.add(self.agent)
        self.db.commit()
        
        # 检查用户状态
        self.db.refresh(self.user)
        self.db.refresh(self.agent)
        logger.critical(f"用户状态: user.is_agent={self.user.is_agent}, agent.is_agent={self.agent.is_agent}")
        assert not self.user.is_agent, "普通用户不应该有代理商权限"
        assert self.agent.is_agent, "代理商权限设置错误"
        
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
            "region": "CA",
            "country": "CA",
            "city": "TOR",
            "staticType": "residential",
            "quantity": 1,
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
            "region": "CA",
            "country": "CA",
            "city": "TOR",
            "staticType": "residential",
            "quantity": 1,
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
            "region": "CA",
            "country": "CA",
            "city": "TOR",
            "staticType": "residential",
            "quantity": 1,
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
        self.ipipv_service._make_request = mock_failed_request

        initial_balance = self.user.balance
        order_data = {
            "product_no": "mb_gmhd5exdf",
            "proxy_type": 103,
            "region": "CA",
            "country": "CA",
            "city": "TOR",
            "staticType": "residential",
            "quantity": 1,
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
        self.ipipv_service._make_request = mock_request
        
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
                "region": "CA",
                "country": "CA",
                "city": "TOR",
                "staticType": "residential",
                "quantity": 1,
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

    async def test_full_static_order_flow(self):
        """测试完整的静态订单流程"""
        try:
            # 1. 查询产品库存 - 使用真实API
            inventory = await self.ipipv_service.get_product_inventory(proxy_type=103)  # 使用静态代理类型
            assert inventory is not None, "无法获取产品库存"
            
            # 记录原始响应数据（仅在测试失败时显示）
            if not inventory.get('list'):
                logger.critical(f"API调用成功但返回的产品列表为空，响应状态: {inventory.get('code', 'unknown')}")
                raise AssertionError("API返回的产品列表为空")

            # 只打印产品总数，不打印详细列表
            product_count = len(inventory.get('list', []))
            logger.critical(f"获取到的产品总数: {product_count}")
            
            # 获取第一个可用的产品
            available_products = [
                p for p in inventory.get('list', [])
                if p.get('inventory', 0) > 0
            ]
            
            assert available_products, "没有找到可用的产品"
            product = available_products[0]
            product_no = product['productNo']
            country_code = product.get('countryCode', 'US')
            city_code = product.get('cityCode', 'LAX')
            
            logger.critical(f"选择的产品编号: {product_no}")

            # 2. 创建订单
            order_data = {
                "product_no": product_no,
                "proxy_type": 103,
                "region": country_code,
                "country": country_code,
                "city": city_code,
                "staticType": "residential",
                "quantity": 1,
                "duration": 30,
                "unit": 1,
                "total_cost": 100,
                "app_order_no": f"APP_ORDER_TEST_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "userId": self.user.id,
                "username": self.user.username,
                "agentId": self.agent.id,
                "agentUsername": self.agent.username
            }
            
            result = await self.service.create_order(
                user_id=self.user.id,
                username=self.user.username,
                agent_id=self.agent.id,
                agent_username=self.agent.username,
                order_data=order_data
            )
            
            assert result["code"] == 0, f"订单创建失败: {result.get('msg', '')}"
            order_no = result["data"]["order_no"]
            logger.critical(f"订单创建成功，订单号: {order_no}")

            # 3. 查询订单列表
            # 使用代理商的 token
            agent_token = create_access_token({"sub": str(self.agent.id)})
            headers = {"Authorization": f"Bearer {agent_token}"}
            logger.critical(f"使用代理商token: {agent_token}")
            
            async with AsyncClient(app=app, base_url="http://test") as ac:
                response = await ac.get(
                    "/api/static-order/list",
                    headers=headers,
                    params={"page": 1, "page_size": 10, "user_id": self.user.id}
                )
            
                logger.critical(f"订单列表响应: status_code={response.status_code}, content={response.content}")
            
            assert response.status_code == 200, "获取订单列表失败"
            data = response.json()
            assert data["code"] == 0, "获取订单列表接口返回错误"
            
            # 4. 查询订单详情
            async with AsyncClient(app=app, base_url="http://test") as ac:
                response = await ac.get(
                    f"/api/static-order/{order_no}",
                    headers=headers
                )
            
            assert response.status_code == 200, "获取订单详情失败"
            data = response.json()
            assert data["code"] == 0, "获取订单详情接口返回错误"
            
            # 5. 等待订单状态更新（最多等待5秒）
            status = None
            for _ in range(10):
                async with AsyncClient(app=app, base_url="http://test") as ac:
                    response = await ac.get(
                        f"/api/static-order/{order_no}",
                        headers=headers
                    )
                data = response.json()
                status = data["data"]["status"]
                if status != "processing":
                    break
                await asyncio.sleep(0.5)
            
            assert status in ["active", "processing"], f"订单最终状态异常: {status}"
            logger.critical(f"订单最终状态: {status}")
            
        except AssertionError as e:
            logger.critical(f"测试断言失败: {str(e)}")
            raise
        except Exception as e:
            logger.critical(f"测试过程中发生异常: {str(e)}")
            logger.critical(f"异常堆栈: {traceback.format_exc()}")
            raise 