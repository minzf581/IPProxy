import pytest
import os
import logging
import time
import hashlib
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.region import Region, Country, City
from app.services import IPIPVBaseAPI, ProxyService, UserService

# 设置日志级别和格式
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@pytest.fixture
def db():
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def ipipv_api():
    return IPIPVBaseAPI()

@pytest.mark.asyncio
class TestIPRanges:
    @pytest.fixture(scope="class")
    def area_service(self):
        """创建区域服务实例"""
        service = AreaService()
        service.base_url = os.getenv('IPPROXY_API_URL', 'https://sandbox.ipipv.com')
        service.app_key = os.getenv('IPPROXY_APP_KEY', 'AK20241120145620')
        service.app_secret = os.getenv('IPPROXY_APP_SECRET', 'bf3ffghlt0hpc4omnvc2583jt0fag6a4')
        logger.info(f"区域服务初始化完成, base_url: {service.base_url}")
        return service
        
    @pytest.fixture(scope="class")
    def user_service(self):
        """创建用户服务实例"""
        service = UserService()
        service.base_url = os.getenv('IPPROXY_API_URL', 'https://sandbox.ipipv.com')
        service.app_key = os.getenv('IPPROXY_APP_KEY', 'AK20241120145620')
        service.app_secret = os.getenv('IPPROXY_APP_SECRET', 'bf3ffghlt0hpc4omnvc2583jt0fag6a4')
        logger.info(f"用户服务初始化完成, base_url: {service.base_url}")
        return service

    @pytest.fixture(scope="class")
    async def test_user(self, user_service):
        """创建测试用户"""
        username = f"test_user_{int(time.time())}"
        user_params = {
            "username": username,
            "password": "Test123456",
            "email": f"{username}@example.com",
            "phone": "13800138000",
            "authType": 1,
            "status": 1
        }
        
        response = await user_service.create_user(user_params)
        logger.info(f"用户创建: {response}")
        return username

    async def test_1_get_static_cloud_ip_ranges(self, area_service, test_user):
        """测试获取静态云平台代理IP段"""
        username = await test_user
        params = {
            "proxyType": 101,  # 静态云平台
            "countryCode": "CN",  # 中国
            "cityCode": "CN000SHA",  # 上海
            "version": "v2",
            "appUsername": "test_user"
        }
        response = await area_service.get_ip_ranges(params)
        logger.info(f"静态云平台代理IP段响应: {response}")
        
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for item in response:
                logger.info(f"IP段信息: {item}")
                if isinstance(item, dict):
                    assert "ipStart" in item, "响应中应包含 ipStart"
                    assert "ipEnd" in item, "响应中应包含 ipEnd"
        elif isinstance(response, dict):
            logger.info(f"IP段详细信息: {response}")
            assert "ipStart" in response, "响应中应包含 ipStart"
            assert "ipEnd" in response, "响应中应包含 ipEnd"

    async def test_2_get_static_domestic_residential_ip_ranges(self, area_service, test_user):
        """测试获取静态国内家庭代理IP段"""
        username = await test_user
        params = {
            "proxyType": 102,  # 静态国内家庭
            "countryCode": "CN", # 中国
            "cityCode": "CN000SHA",  # 上海
            "version": "v2",
            "appUsername": "test_user"
        }
        response = await area_service.get_ip_ranges(params)
        logger.info(f"静态国内家庭代理IP段响应: {response}")
        
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for item in response:
                logger.info(f"IP段信息: {item}")
                if isinstance(item, dict):
                    assert "ipStart" in item, "响应中应包含 ipStart"
                    assert "ipEnd" in item, "响应中应包含 ipEnd"
        elif isinstance(response, dict):
            logger.info(f"IP段详细信息: {response}")
            assert "ipStart" in response, "响应中应包含 ipStart"
            assert "ipEnd" in response, "响应中应包含 ipEnd"

    async def test_3_get_static_foreign_residential_ip_ranges(self, area_service, test_user):
        """测试获取静态国外家庭代理IP段"""
        username = await test_user
        params = {
            "proxyType": 103,  # 静态国外家庭
            "countryCode": "JP", # 日本
            "cityCode": "JP000TYO",  # 东京
            "version": "v2",
            "appUsername": "test_user"
        }
        response = await area_service.get_ip_ranges(params)
        logger.info(f"静态国外家庭代理IP段响应: {response}")
        
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for item in response:
                logger.info(f"IP段信息: {item}")
                if isinstance(item, dict):
                    assert "ipStart" in item, "响应中应包含 ipStart"
                    assert "ipEnd" in item, "响应中应包含 ipEnd"
        elif isinstance(response, dict):
            logger.info(f"IP段详细信息: {response}")
            assert "ipStart" in response, "响应中应包含 ipStart"
            assert "ipEnd" in response, "响应中应包含 ipEnd"

    async def test_4_get_all_proxy_types(self, area_service, test_user):
        """测试获取所有类型代理IP段"""
        username = await test_user
        proxy_types = [
            {"type": 101, "name": "静态云平台"},
            {"type": 102, "name": "静态国内家庭"},
            {"type": 103, "name": "静态国外家庭"}
        ]
        
        for proxy_type in proxy_types:
            params = {
                "proxyType": proxy_type["type"],
                "version": "v2",
                "appUsername": "test_user"
            }
            
            # 根据代理类型设置不同的国家和城市
            if proxy_type["type"] in [101, 102]:  # 国内代理
                params["countryCode"] = "CN"
                params["cityCode"] = "CN000SHA"
            else:  # 国外代理
                params["countryCode"] = "JP"
                params["cityCode"] = "JP000TYO"
            
            response = await area_service.get_ip_ranges(params)
            logger.info(f"{proxy_type['name']}代理IP段响应: {response}")
            
            assert response is not None, f"{proxy_type['name']}响应不应为空"
            if isinstance(response, list):
                for item in response:
                    logger.info(f"IP段信息: {item}")
                    if isinstance(item, dict):
                        assert "ipStart" in item, f"{proxy_type['name']}响应中应包含 ipStart"
                        assert "ipEnd" in item, f"{proxy_type['name']}响应中应包含 ipEnd"
            elif isinstance(response, dict):
                logger.info(f"IP段详细信息: {response}")
                assert "ipStart" in response, f"{proxy_type['name']}响应中应包含 ipStart"
                assert "ipEnd" in response, f"{proxy_type['name']}响应中应包含 ipEnd"

@pytest.mark.asyncio
async def test_get_ip_ranges(db: Session, ipipv_api: IPIPVBaseAPI):
    """测试获取IP范围"""
    # 准备测试数据
    params = {
        "countryCode": "US",
        "cityCode": "NYC",
        "proxyType": 103  # 静态国外家庭
    }
    
    # 调用API
    result = await ipipv_api._make_request("api/open/app/product/query/v2", params)
    
    # 验证结果
    assert result is not None
    assert isinstance(result, list) 