import pytest
import os
import logging
import time
import hashlib
from app.services.ipproxy_service import IPProxyService

# 设置日志级别和格式
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@pytest.mark.asyncio
class TestIPRanges:
    @pytest.fixture(scope="class")
    def ipproxy_service(self):
        """创建IPIPV服务实例"""
        service = IPProxyService()
        service.base_url = os.getenv('IPPROXY_API_URL', 'https://sandbox.ipipv.com')
        service.app_key = os.getenv('IPPROXY_APP_KEY', 'AK20241120145620')
        service.app_secret = os.getenv('IPPROXY_APP_SECRET', 'bf3ffghlt0hpc4omnvc2583jt0fag6a4')
        logger.info(f"API服务初始化完成, base_url: {service.base_url}")
        return service

    @pytest.fixture(scope="class")
    async def test_user(self, ipproxy_service):
        """创建测试用户"""
        username = f"test_user_{int(time.time())}"
        user_params = {
            "version": "v2",
            "encrypt": "AES",
            "phone": "13800138000",
            "email": f"{username}@example.com",
            "authType": 1,
            "status": 1,
            "appUsername": username
        }
        
        response = await ipproxy_service._make_request("api/open/app/user/create/v2", user_params)
        logger.info(f"用户创建: {response}")
        return username

    async def test_1_get_static_cloud_ip_ranges(self, ipproxy_service, test_user):
        """测试获取静态云平台代理IP段"""
        username = await test_user
        params = {
            "version": "v2",
            "encrypt": "AES",
            "proxyType": [101],  # 静态云平台
            "countryCode": "CN",  # 中国
            "cityCode": "CN000SHA",  # 上海
            "appUsername": username,
            "timestamp": str(int(time.time())),
            "reqId": hashlib.md5(f"{time.time()}".encode()).hexdigest()
        }
        response = await ipproxy_service._make_request("api/open/app/product/query/v2", params)
        logger.info(f"静态云平台代理IP段响应: {response}")
        
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for item in response:
                logger.info(f"IP段信息: {item}")
                if isinstance(item, dict):
                    assert "productNo" in item, "响应中应包含 productNo"
        elif isinstance(response, dict):
            logger.info(f"IP段详细信息: {response}")
            assert "productNo" in response, "响应中应包含 productNo"

    async def test_2_get_static_domestic_residential_ip_ranges(self, ipproxy_service, test_user):
        """测试获取静态国内家庭代理IP段"""
        username = await test_user
        params = {
            "version": "v2",
            "encrypt": "AES",
            "proxyType": [102],  # 静态国内家庭
            "countryCode": "CN", # 中国
            "cityCode": "CN000SHA",  # 上海
            "appUsername": username,
            "timestamp": str(int(time.time())),
            "reqId": hashlib.md5(f"{time.time()}".encode()).hexdigest()
        }
        response = await ipproxy_service._make_request("api/open/app/product/query/v2", params)
        logger.info(f"静态国内家庭代理IP段响应: {response}")
        
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for item in response:
                logger.info(f"IP段信息: {item}")
                if isinstance(item, dict):
                    assert "productNo" in item, "响应中应包含 productNo"
        elif isinstance(response, dict):
            logger.info(f"IP段详细信息: {response}")
            assert "productNo" in response, "响应中应包含 productNo"

    async def test_3_get_static_foreign_residential_ip_ranges(self, ipproxy_service, test_user):
        """测试获取静态国外家庭代理IP段"""
        username = await test_user
        params = {
            "version": "v2",
            "encrypt": "AES",
            "proxyType": [103],  # 静态国外家庭
            "countryCode": "JP", # 日本
            "cityCode": "JP000TYO",  # 东京
            "appUsername": username,
            "timestamp": str(int(time.time())),
            "reqId": hashlib.md5(f"{time.time()}".encode()).hexdigest()
        }
        response = await ipproxy_service._make_request("api/open/app/product/query/v2", params)
        logger.info(f"静态国外家庭代理IP段响应: {response}")
        
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for item in response:
                logger.info(f"IP段信息: {item}")
                if isinstance(item, dict):
                    assert "productNo" in item, "响应中应包含 productNo"
        elif isinstance(response, dict):
            logger.info(f"IP段详细信息: {response}")
            assert "productNo" in response, "响应中应包含 productNo"

    async def test_4_get_all_proxy_types(self, ipproxy_service, test_user):
        """测试获取所有类型代理IP段"""
        username = await test_user
        proxy_types = [
            {"type": 101, "name": "静态云平台"},
            {"type": 102, "name": "静态国内家庭"},
            {"type": 103, "name": "静态国外家庭"}
        ]
        
        for proxy_type in proxy_types:
            params = {
                "version": "v2",
                "encrypt": "AES",
                "proxyType": [proxy_type["type"]],
                "appUsername": username,
                "timestamp": str(int(time.time())),
                "reqId": hashlib.md5(f"{time.time()}".encode()).hexdigest()
            }
            
            # 根据代理类型设置不同的国家和城市
            if proxy_type["type"] in [101, 102]:  # 国内代理
                params["countryCode"] = "CN"
                params["cityCode"] = "CN000SHA"
            else:  # 国外代理
                params["countryCode"] = "JP"
                params["cityCode"] = "JP000TYO"
            
            response = await ipproxy_service._make_request("api/open/app/product/query/v2", params)
            logger.info(f"{proxy_type['name']}代理IP段响应: {response}")
            
            assert response is not None, f"{proxy_type['name']}响应不应为空"
            if isinstance(response, list):
                for item in response:
                    logger.info(f"IP段信息: {item}")
                    if isinstance(item, dict):
                        assert "productNo" in item, f"{proxy_type['name']}响应中应包含 productNo"
            elif isinstance(response, dict):
                logger.info(f"IP段详细信息: {response}")
                assert "productNo" in response, f"{proxy_type['name']}响应中应包含 productNo" 