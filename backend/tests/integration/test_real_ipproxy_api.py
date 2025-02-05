import pytest
import os
import logging
import time
import hashlib
from app.services import AreaService, ProxyService
from app.utils.logging_utils import truncate_response

def truncate_response(response, max_length=20):
    """截断响应内容，使日志更简洁"""
    if response is None:
        return None
    if isinstance(response, (list, dict)):
        return f"{type(response).__name__}[{len(response)}]"
    str_response = str(response)
    if len(str_response) > max_length:
        return f"{str_response[:max_length]}..."
    return str_response

# 设置日志级别和格式
logging.basicConfig(
    level=logging.WARNING,
    format='%(levelname).1s %(message)s'
)

# 设置所有第三方库的日志级别为ERROR
for logger_name in ['httpcore', 'httpx', 'asyncio', 'urllib3', 'requests']:
    logging.getLogger(logger_name).setLevel(logging.ERROR)

logger = logging.getLogger('test_api')
logger.setLevel(logging.INFO)

@pytest.mark.asyncio
class TestAreaService:
    @pytest.fixture(scope="class")
    def area_service(self):
        """创建区域服务实例"""
        service = AreaService()
        service.base_url = os.getenv('IPPROXY_API_URL', 'https://sandbox.ipipv.com')
        service.app_key = os.getenv('IPPROXY_APP_KEY', 'AK20241120145620')
        service.app_secret = os.getenv('IPPROXY_APP_SECRET', 'bf3ffghlt0hpc4omnvc2583jt0fag6a4')
        logger.info(f"区域服务初始化完成, base_url: {service.base_url}")
        return service
    
    async def test_1_get_area_list(self, area_service):
        """测试获取区域列表"""
        response = await area_service.get_area_list()
        logger.info(f"区域列表: {truncate_response(response)}")
        if not response:
            logger.error("获取区域列表失败")
            assert False
        assert isinstance(response, list)
        area = response[0]
        assert "code" in area
        assert "children" in area
            
    async def test_2_get_city_list(self, area_service):
        """测试获取城市列表"""
        response = await area_service.get_city_list("CN")
        logger.info(f"城市列表: {truncate_response(response)}")
        if not response:
            logger.error("获取城市列表失败")
            assert False
        assert isinstance(response, list)
        city = response[0]
        assert "cityCode" in city
        assert "cityName" in city
            
    async def test_3_get_ip_ranges(self, area_service):
        """测试获取IP段列表"""
        # 测试静态数据中心代理
        response1 = await area_service.get_ip_ranges({
            "proxyType": [102],  # 静态数据中心代理
            "countryCode": "JP", # 日本
            "cityCode": "JP000TYO"  # 东京
        })
        logger.info(f"静态数据中心代理响应: {truncate_response(response1)}")
        
        # 测试静态住宅代理
        response2 = await area_service.get_ip_ranges({
            "proxyType": [101]  # 静态住宅代理
        })
        logger.info(f"静态住宅代理响应: {truncate_response(response2)}")
        
        # 测试静态手机代理
        response3 = await area_service.get_ip_ranges({
            "proxyType": [103]  # 静态手机代理
        })
        logger.info(f"静态手机代理响应: {truncate_response(response3)}")
        
        # 验证响应
        for response in [response1, response2, response3]:
            if response is not None:
                assert isinstance(response, (list, dict)), "响应应该是列表或字典类型"

@pytest.mark.asyncio
class TestProxyService:
    @pytest.fixture(scope="class")
    def proxy_service(self):
        """创建代理服务实例"""
        service = ProxyService()
        service.base_url = os.getenv('IPPROXY_API_URL', 'https://sandbox.ipipv.com')
        service.app_key = os.getenv('IPPROXY_APP_KEY', 'AK20241120145620')
        service.app_secret = os.getenv('IPPROXY_APP_SECRET', 'bf3ffghlt0hpc4omnvc2583jt0fag6a4')
        logger.info(f"代理服务初始化完成, base_url: {service.base_url}")
        return service
    
    @pytest.fixture(scope="class")
    async def test_user(self, proxy_service):
        """创建测试用户"""
        username = f"test_user_{int(time.time())}"
        user_params = {
            "username": username,
            "password": "Test123456",
            "email": f"{username}@test.com",
            "phone": "13800138000",
            "authType": 2,
            "status": 1
        }
        
        response = await proxy_service.create_user(user_params)
        logger.info(f"用户创建: {truncate_response(response)}")
        return username
    
    async def test_1_get_proxy_info(self, proxy_service, test_user):
        """测试获取代理信息"""
        username = await test_user  # 等待test_user协程完成
        
        # 获取代理信息
        response = await proxy_service.get_proxy_info(username)
        logger.info(f"代理信息: {truncate_response(response)}")
        if not response:
            logger.error("获取代理信息失败")
            assert False
        assert response is not None
        assert isinstance(response, dict)
        
    async def test_2_create_dynamic_proxy(self, proxy_service, test_user):
        """测试创建动态代理"""
        username = await test_user
        
        # 创建动态代理
        params = {
            "poolId": "pool1",
            "trafficAmount": 10,  # 10GB流量
            "username": username,
            "password": "Test123456",
            "remark": "测试动态代理"
        }
        
        response = await proxy_service.create_dynamic_proxy(params)
        logger.info(f"动态代理创建: {truncate_response(response)}")
        if not response:
            logger.error("创建动态代理失败")
            assert False
        assert response is not None
        assert isinstance(response, dict)