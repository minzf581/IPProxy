from unittest.mock import patch
import json

# 模拟API响应
mock_dynamic_proxy_response = {
    "code": 0,
    "message": "success",
    "data": {
        "proxyHost": "proxy.test.com",
        "proxyPort": 8080,
        "username": "test_user",
        "password": "test_pass"
    }
}

mock_static_proxy_response = {
    "code": 0,
    "message": "success",
    "data": {
        "proxyHost": "static.test.com",
        "proxyPort": 8080,
        "username": "test_user",
        "password": "test_pass",
        "ipList": ["1.1.1.1", "2.2.2.2"]
    }
}

def mock_aiohttp_response(status=200, data=None):
    """创建模拟的aiohttp响应"""
    class MockResponse:
        def __init__(self, status, data):
            self.status = status
            self._data = data

        async def text(self):
            return json.dumps(self._data)

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

    return MockResponse(status, data or {})

def mock_aiohttp_session():
    """创建模拟的aiohttp会话"""
    class MockSession:
        async def post(self, url, json=None):
            if "dynamic" in url:
                return mock_aiohttp_response(200, mock_dynamic_proxy_response)
            elif "static" in url:
                return mock_aiohttp_response(200, mock_static_proxy_response)
            else:
                return mock_aiohttp_response(404, {"code": -1, "message": "Not found"})

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

    return MockSession()

def mock_ipproxy_api():
    """创建IPIPV API的mock装饰器"""
    return patch("aiohttp.ClientSession", return_value=mock_aiohttp_session()) 