import pytest
import os
import logging
import time
import hashlib
from app.services.ipproxy_service import IPProxyService
from app.utils.logging_utils import truncate_response

# 设置日志级别和格式
logging.basicConfig(
    level=logging.WARNING,
    format='%(levelname).1s %(message)s'
)

# 设置所有第三方库的日志级别为ERROR
for logger_name in ['httpcore', 'httpx', 'asyncio', 'urllib3', 'requests']:
    logging.getLogger(logger_name).setLevel(logging.ERROR)

logger = logging.getLogger('test_ipipv_api')
logger.setLevel(logging.INFO)

@pytest.mark.asyncio
class TestIPIPVAPI:
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
        user_params = {
            "version": "v2",
            "encrypt": "AES",
            "phone": "13800138000",
            "email": "test@example.com",
            "authType": 2,
            "authName": "测试用户",
            "no": "110101199001011234",
            "status": 1,
            "appUsername": "test_user",
            "password": "Test123456",
        }
        
        response = await ipproxy_service._make_request("api/open/app/user/v2", user_params)
        logger.info(f"用户创建: {truncate_response(response)}")
        return "test_user"
    
    async def test_1_get_area_list(self, ipproxy_service):
        """测试获取区域列表"""
        response = await ipproxy_service._make_request("api/open/app/area/v2", {
            "version": "v2",
            "encrypt": "AES",
            "type": 1
        })
        logger.info(f"区域列表: {truncate_response(response)}")
        if not response:
            logger.error("获取区域列表失败")
            assert False
        assert isinstance(response, list)
        area = response[0]
        assert "code" in area
        assert "children" in area
            
    async def test_2_get_city_list(self, ipproxy_service):
        """测试获取城市列表"""
        response = await ipproxy_service._make_request("api/open/app/city/list/v2", {
            "version": "v2",
            "encrypt": "AES",
            "countryCode": "CN"
        })
        logger.info(f"城市列表: {truncate_response(response)}")
        if not response:
            logger.error("获取城市列表失败")
            assert False
        assert isinstance(response, list)
        city = response[0]
        assert "cityCode" in city
        assert "cityName" in city
            
    async def test_3_get_proxy_info(self, ipproxy_service, test_user):
        """测试获取代理信息"""
        username = await test_user  # 等待test_user协程完成
        
        # 获取代理信息
        response = await ipproxy_service._make_request("api/open/app/proxy/info/v2", {
            "version": "v2",
            "encrypt": "AES",
            "appUsername": username,
            "proxyType": 104,  # DYNAMIC_FOREIGN类型
            "productNo": "out_dynamic_1",  # 添加产品编号
            "timestamp": str(int(time.time())),
            "reqId": hashlib.md5(f"{time.time()}".encode()).hexdigest()
        })
        logger.info(f"代理信息: {truncate_response(response)}")
        if not response:
            logger.error("获取代理信息失败")
            assert False
        assert response is not None
        assert isinstance(response, dict)
        assert "used" in response
        assert "total" in response
        assert "balance" in response

    async def test_4_get_ip_ranges(self, ipproxy_service):
        """测试获取IP段列表"""
        # 生成随机用户名
        username = f"test_user_{int(time.time())}"
        
        # 创建用户
        user_response = await ipproxy_service._make_request("api/open/app/user/create/v2", {
            "version": "v2",
            "encrypt": "AES",
            "phone": "13800138000",
            "email": f"{username}@test.com",
            "authType": 1,
            "status": 1,
            "appUsername": username
        })
        logger.info(f"用户创建: {truncate_response(user_response)}")
        
        # 测试静态数据中心代理
        response1 = await ipproxy_service._make_request("api/open/app/product/query/v2", {
            "version": "v2",
            "encrypt": "AES",
            "proxyType": 102,  # 静态数据中心代理
            "ispType": 4,        # 数据中心类型
            "countryCode": "JP", # 日本
            "cityCode": "JP000TYO",  # 东京
            "appUsername": username,
            "timestamp": str(int(time.time())),
            "reqId": hashlib.md5(f"{time.time()}".encode()).hexdigest()
        })
        logger.info(f"静态数据中心代理响应: {truncate_response(response1)}")
        
        # 测试静态住宅代理
        response2 = await ipproxy_service._make_request("api/open/app/product/query/v2", {
            "version": "v2",
            "encrypt": "AES",
            "proxyType": 101,  # 静态住宅代理
            "appUsername": username,
            "timestamp": str(int(time.time())),
            "reqId": hashlib.md5(f"{time.time()}".encode()).hexdigest()
        })
        logger.info(f"静态住宅代理响应: {truncate_response(response2)}")
        
        # 测试静态手机代理
        response3 = await ipproxy_service._make_request("api/open/app/product/query/v2", {
            "version": "v2",
            "encrypt": "AES",
            "proxyType": 103,  # 静态手机代理
            "appUsername": username,
            "timestamp": str(int(time.time())),
            "reqId": hashlib.md5(f"{time.time()}".encode()).hexdigest()
        })
        logger.info(f"静态手机代理响应: {truncate_response(response3)}")
        
        # 验证响应
        for response in [response1, response2, response3]:
            if response is not None:
                assert isinstance(response, (list, dict)), "响应应该是列表或字典类型" 