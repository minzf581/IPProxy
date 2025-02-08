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
from app.database import get_db
from fastapi import Request
from app.services.auth import get_current_user, oauth2_scheme, verify_token
from app.core.config import settings

# 配置日志
logging.basicConfig(
    level=logging.CRITICAL,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s'
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
    
    @pytest.fixture
    async def test_app(self, app, db: Session):
        """初始化测试数据"""
        # 设置测试环境的SECRET_KEY
        settings.SECRET_KEY = "test-secret-key-for-testing-only"
        
        # 创建测试用户
        test_user = User(
            username=f"test_user_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            password="test123",
            email=f"test_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
            status=1,
            balance=1000.0
        )
        db.add(test_user)

        # 创建代理商用户
        agent_user = User(
            username=f"agent_user_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            password="agent123",
            email=f"agent_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
            status=1,
            is_agent=True,
            balance=1000.0
        )
        db.add(agent_user)
        db.commit()
        
        # 检查用户状态
        db.refresh(test_user)
        db.refresh(agent_user)
        logger.critical(f"用户状态: test_user.is_agent={test_user.is_agent}, agent_user.is_agent={agent_user.is_agent}")
        assert not test_user.is_agent, "普通用户不应该有代理商权限"
        assert agent_user.is_agent, "代理商权限设置错误"
        
        # 创建测试客户端
        agent_token = create_access_token({"sub": str(agent_user.id)})
        
        # 设置依赖覆盖
        async def get_db_override():
            yield db
            
        async def get_current_user_override():
            return agent_user
            
        async def oauth2_scheme_override():
            return agent_token
            
        app.dependency_overrides = {
            get_db: get_db_override,
            get_current_user: get_current_user_override,
            oauth2_scheme: oauth2_scheme_override,
            verify_token: lambda x: {"sub": str(agent_user.id)}
        }
        
        return {
            "app": app,
            "db": db,
            "test_user": test_user,
            "agent_user": agent_user,
            "agent_token": agent_token
        }
    
    async def test_static_order(self, test_app):
        """测试完整的静态订单流程"""
        app = await test_app
        async with AsyncClient(app=app["app"], base_url="http://test") as ac:
            # 查询订单列表
            response = await ac.post(
                "/api/open/app/order/v2",  # 使用正确的API路径
                headers={"Authorization": f"Bearer {app['agent_token']}"},
                params={"page": 1, "size": 10}  # 使用正确的参数名称
            )
            
            logger.critical(f"订单列表响应: status_code={response.status_code}, content={response.content}")
            
            assert response.status_code == 200, "获取订单列表失败"

            # ... rest of the test logic ... 