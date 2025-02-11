import pytest
from fastapi import HTTPException
from app.core.security import create_access_token
from app.services.ipipv_service import IPIPVService
from app.models.dynamic_order import DynamicOrder
from app.models.user import User
from app.models.transaction import Transaction
from datetime import datetime
from sqlalchemy.orm import Session
from httpx import AsyncClient
from app.main import app
from app.database import get_db
import logging
from app.config import settings
import os
import json
import asyncio
from fastapi.testclient import TestClient
from app.services.proxy_service import ProxyService

# 设置日志级别为 DEBUG
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

@pytest.fixture(autouse=True)
def setup_test_env():
    """设置测试环境"""
    # 保存原始设置
    original_secret_key = settings.SECRET_KEY
    original_algorithm = settings.ALGORITHM
    original_testing = settings.TESTING
    
    # 设置测试密钥和算法
    settings.SECRET_KEY = "test_secret_key_for_testing_only_do_not_use_in_production"
    settings.ALGORITHM = "HS256"
    settings.TESTING = True  # 确保测试模式开启
    
    yield
    
    # 恢复原始设置
    settings.SECRET_KEY = original_secret_key
    settings.ALGORITHM = original_algorithm
    settings.TESTING = original_testing

@pytest.fixture
def db():
    """获取测试数据库会话"""
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def ipipv_service(db):
    return IPIPVService(db=db)

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def test_user(db):
    """创建测试用户"""
    user = User(
        username="test_user_dynamic",
        password="test_password",
        email="test_dynamic@example.com",
        is_admin=False,
        is_agent=False,
        status=1,
        balance=1000.0
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_agent(db):
    """创建测试代理商"""
    agent = User(
        username="test_agent_dynamic",
        password="test_password",
        email="agent_dynamic@example.com",
        is_admin=False,
        is_agent=True,
        status=1,
        balance=5000.0
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent

@pytest.mark.asyncio
class TestDynamicProxy:
    """动态代理相关测试"""

    @pytest.fixture(autouse=True)
    def setup_method(self, db: Session):
        """每个测试方法前清理数据库"""
        try:
            # 按照正确的顺序清理数据库（考虑外键约束）
            db.query(DynamicOrder).delete()
            db.query(Transaction).delete()
            db.query(User).where(User.username.like("test_%")).delete()  # 只删除测试用户
            db.commit()
            logger.info("[Test] 清理数据库成功")
            yield db
        except Exception as e:
            logger.error(f"[Test] 清理数据库失败: {str(e)}")
            db.rollback()
            raise

    @pytest.mark.asyncio
    async def test_activate_dynamic_proxy_success(self, db: Session):
        """测试成功激活动态代理"""
        try:
            ipipv_service = IPIPVService(db)
            
            # 记录开始创建订单
            logger.info("[Test] 开始创建动态代理订单")
            
            result = await ipipv_service.activate_dynamic_proxy(
                order_id="test_order_1",
                pool_id="out_dynamic_1",
                traffic_amount=100,
                duration=30,
                unit=3
            )
            
            # 记录创建结果
            logger.info(f"[Test] 订单创建结果: {result}")
            
            assert result is not None
            assert isinstance(result, dict)
            assert "order_no" in result
            assert "app_order_no" in result
            assert "status" in result
            assert result["status"] == "pending"
            
            # 验证订单是否正确创建
            order = db.query(DynamicOrder).filter(DynamicOrder.id == "test_order_1").first()
            assert order is not None
            
            # 记录订单详细信息
            logger.info("[Test] 创建的订单详细信息:")
            logger.info(f"  - 订单ID: {order.id}")
            logger.info(f"  - 订单号: {order.order_no}")
            logger.info(f"  - 应用订单号: {order.app_order_no}")
            logger.info(f"  - 代理池类型: {order.pool_type}")
            logger.info(f"  - 流量大小: {order.traffic}MB")
            logger.info(f"  - 单价: {order.unit_price}")
            logger.info(f"  - 总金额: {order.total_amount}")
            logger.info(f"  - 代理类型: {order.proxy_type}")
            logger.info(f"  - 订单状态: {order.status}")
            logger.info(f"  - 创建时间: {order.created_at}")
            
            # 等待回调处理（最多等待5秒）
            for _ in range(10):
                # 刷新订单状态
                db.refresh(order)
                if order.status == "active":
                    logger.info("[Test] 订单已激活")
                    break
                await asyncio.sleep(0.5)
                logger.info(f"[Test] 等待订单激活，当前状态: {order.status}")
            
            # 验证最终状态
            db.refresh(order)  # 再次刷新确保获取最新状态
            assert order.status == "active", f"订单未能成功激活，当前状态: {order.status}"
            assert order.proxy_info is not None, "代理信息为空"
            
            # 验证代理信息
            assert "username" in order.proxy_info
            assert "password" in order.proxy_info
            assert "server" in order.proxy_info
            assert "port" in order.proxy_info
            
        except Exception as e:
            logger.error(f"[Test] 测试失败: {str(e)}")
            db.rollback()
            raise

    @pytest.mark.asyncio
    async def test_activate_dynamic_proxy_failure(self, db: Session):
        """测试激活动态代理失败的情况"""
        ipipv_service = IPIPVService(db)
        with pytest.raises(Exception):
            await ipipv_service.activate_dynamic_proxy(
                order_id="",
                pool_id="out_dynamic_1",
                traffic_amount=100,
                duration=30,
                unit=3
            )

    @pytest.mark.asyncio
    async def test_full_order_flow(self, db: Session, client: AsyncClient):
        """测试完整的订单流程，包括激活和回调"""
        try:
            # 准备测试数据
            test_order_data = {
                "order_id": "test_order_2",
                "pool_id": "out_dynamic_1",
                "traffic_amount": 100,
                "duration": 30,
                "unit": 3
            }
            
            # 激活动态代理
            ipipv_service = IPIPVService(db)
            result = await ipipv_service.activate_dynamic_proxy(
                order_id=test_order_data["order_id"],
                pool_id=test_order_data["pool_id"],
                traffic_amount=test_order_data["traffic_amount"],
                duration=test_order_data["duration"],
                unit=test_order_data["unit"]
            )
            
            # 验证激活结果
            assert result is not None
            assert isinstance(result, dict)
            assert "order_no" in result
            assert "app_order_no" in result
            assert "status" in result
            assert result["status"] == "pending"
            assert "message" in result
            
            # 验证订单是否正确创建
            order = db.query(DynamicOrder).filter(DynamicOrder.id == test_order_data["order_id"]).first()
            assert order is not None
            assert order.status == "pending"
            
            # 提交事务确保数据已保存
            db.commit()
            db.refresh(order)
            
            # 模拟回调请求
            callback_data = {
                "status": "success",
                "proxyInfo": {
                    "username": "test_user",
                    "password": "test_pass",
                    "server": "proxy.example.com",
                    "port": 8080
                }
            }
            
            # 重写依赖以使用相同的数据库会话
            async def override_get_db():
                yield db
                
            app.dependency_overrides[get_db] = override_get_db
            
            # 使用测试客户端发送回调请求
            async with AsyncClient(app=app, base_url="http://test") as ac:
                response = await ac.post(
                    f"/api/order/callback/{test_order_data['order_id']}",
                    json=callback_data
                )
                
            # 清除依赖重写
            app.dependency_overrides.clear()
                
            assert response.status_code == 200
            
            # 验证订单状态是否更新
            updated_order = db.query(DynamicOrder).filter(
                DynamicOrder.id == test_order_data["order_id"]
            ).first()
            assert updated_order is not None
            assert updated_order.status == "active"
            
        except Exception as e:
            logger.error(f"[Test] 测试失败: {str(e)}")
            db.rollback()
            raise

    @pytest.mark.asyncio
    async def test_list_dynamic_orders(self, db: Session, client: AsyncClient, test_user: User, test_agent: User):
        """测试动态订单列表显示"""
        try:
            # 创建测试订单数据
            orders = [
                DynamicOrder(
                    id=f"test_order_{i}",
                    order_no=f"ORD202402{str(i).zfill(2)}",
                    app_order_no=f"APP202402{str(i).zfill(2)}",
                    user_id=test_user.id,
                    agent_id=test_agent.id,
                    pool_type="out_dynamic_1",
                    traffic=100,
                    unit_price=0.1,
                    total_amount=10.0,
                    proxy_type="dynamic",
                    status="active" if i % 2 == 0 else "pending",
                    proxy_info={
                        "username": f"proxy_user_{i}",
                        "password": "test_pass",
                        "server": "proxy.example.com",
                        "port": 8080
                    } if i % 2 == 0 else None,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                ) for i in range(1, 6)  # 创建5个测试订单
            ]
            
            for order in orders:
                db.add(order)
            db.commit()
            
            # 重写依赖以使用相同的数据库会话
            async def override_get_db():
                yield db
                
            app.dependency_overrides[get_db] = override_get_db
            
            # 1. 测试普通用户查看自己的订单
            user_token = create_access_token({"sub": str(test_user.id)})
            headers = {"Authorization": f"Bearer {user_token}"}
            
            async with AsyncClient(app=app, base_url="http://test") as ac:
                response = await ac.get(
                    "/api/dynamic",
                    headers=headers,
                    params={"page": 1, "page_size": 10}
                )
            
            assert response.status_code == 200
            data = response.json()
            assert data["code"] == 0
            assert "data" in data
            assert "list" in data["data"]
            assert "total" in data["data"]
            assert data["data"]["total"] == 5  # 验证总数
            assert len(data["data"]["list"]) == 5  # 验证返回数量
            
            # 验证返回的订单数据格式
            order_data = data["data"]["list"][0]
            assert "id" in order_data
            assert "order_no" in order_data
            assert "app_order_no" in order_data
            assert "user_id" in order_data
            assert "agent_id" in order_data
            assert "pool_type" in order_data
            assert "traffic" in order_data
            assert "status" in order_data
            assert "proxy_info" in order_data
            assert "created_at" in order_data
            
            # 2. 测试代理商查看自己的订单
            agent_token = create_access_token({"sub": str(test_agent.id)})
            headers = {"Authorization": f"Bearer {agent_token}"}
            
            async with AsyncClient(app=app, base_url="http://test") as ac:
                response = await ac.get(
                    "/api/dynamic",
                    headers=headers,
                    params={"page": 1, "page_size": 10}
                )
            
            assert response.status_code == 200
            data = response.json()
            assert data["code"] == 0
            assert data["data"]["total"] == 5  # 代理商应该能看到所有订单
            
            # 3. 测试分页
            async with AsyncClient(app=app, base_url="http://test") as ac:
                response = await ac.get(
                    "/api/dynamic",
                    headers=headers,
                    params={"page": 1, "page_size": 2}
                )
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["data"]["list"]) == 2  # 验证分页大小
            
            # 4. 测试未授权访问
            async with AsyncClient(app=app, base_url="http://test") as ac:
                response = await ac.get("/api/dynamic")
            
            assert response.status_code == 401  # 未授权
            
            # 清除依赖重写
            app.dependency_overrides.clear()
            
        except Exception as e:
            logger.error(f"[Test] 测试失败: {str(e)}")
            db.rollback()
            raise 