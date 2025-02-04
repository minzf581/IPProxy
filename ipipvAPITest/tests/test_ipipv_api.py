import pytest
import httpx
import json
import time
import hashlib
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
import base64
import os
from typing import Dict, Any

# API配置
API_CONFIG = {
    'base_url': 'https://sandbox.ipipv.com',  # 沙箱环境URL
    'app_key': 'AK20241120145620',
    'app_secret': 'bf3ffghlt0hpc4omnvc2583jt0fag6a4',
    'version': 'v2',
    'encrypt': 'AES'
}

def generate_req_id() -> str:
    """生成请求ID"""
    return hashlib.md5(str(time.time()).encode()).hexdigest()

def aes_encrypt(data: str) -> str:
    """AES加密"""
    key = API_CONFIG['app_secret'][:32].encode()
    iv = API_CONFIG['app_secret'][:16].encode()
    
    cipher = AES.new(key, AES.MODE_CBC, iv)
    padded_data = pad(data.encode(), AES.block_size)
    encrypted = cipher.encrypt(padded_data)
    return base64.b64encode(encrypted).decode()

def generate_sign(params: Dict[str, Any], timestamp: int) -> str:
    """生成签名"""
    # 按键排序
    sorted_params = dict(sorted(params.items()))
    
    # 构造签名字符串
    sign_str = '&'.join([f"{k}={v}" for k, v in sorted_params.items()])
    sign_str += f"&timestamp={timestamp}&appSecret={API_CONFIG['app_secret']}"
    
    # MD5加密
    return hashlib.md5(sign_str.encode()).hexdigest()

@pytest.fixture
def client():
    """创建测试客户端"""
    return httpx.Client(
        base_url=API_CONFIG['base_url'],
        verify=False  # 禁用SSL验证，仅用于测试环境
    )

def prepare_request_params(params: Dict[str, Any] = None) -> Dict[str, str]:
    """准备请求参数"""
    timestamp = int(time.time())
    req_id = generate_req_id()
    
    # 基础参数
    base_params = {
        'version': API_CONFIG['version'],
        'encrypt': API_CONFIG['encrypt'],
        'appKey': API_CONFIG['app_key'],
        'reqId': req_id,
        'timestamp': str(timestamp)  # 转换为字符串
    }
    
    if params:
        # 加密业务参数
        params_str = json.dumps(params, ensure_ascii=False)
        encrypted_params = aes_encrypt(params_str)
        base_params['params'] = encrypted_params
    
    # 生成签名
    sign = generate_sign(base_params, timestamp)
    base_params['sign'] = sign
    
    return base_params

def test_get_regions(client):
    """测试获取区域列表"""
    # 准备参数
    params = {
        'proxyType': [104]  # 动态国外
    }
    
    # 获取完整请求参数
    request_params = prepare_request_params(params)
    
    # 发送请求
    response = client.post('/api/open/app/area/v2', json=request_params)
    
    # 打印请求和响应信息
    print("\n=== Request Info ===")
    print(f"URL: {API_CONFIG['base_url']}/api/open/app/area/v2")
    print("Parameters:", json.dumps(request_params, indent=2))
    print("\n=== Response Info ===")
    print(f"Status: {response.status_code}")
    print(f"Content: {response.text}")
    
    # 验证响应
    assert response.status_code == 200
    data = response.json()
    assert data.get('code') == 200
    assert 'data' in data

def test_get_countries(client):
    """测试获取国家列表"""
    # 准备参数
    params = {
        'proxyType': 104,  # 动态国外
        'areaCode': 'AS'  # 亚洲
    }
    
    # 获取完整请求参数
    request_params = prepare_request_params(params)
    
    # 发送请求
    response = client.post('/api/open/app/product/area/v2', json=request_params)
    
    # 打印请求和响应信息
    print("\n=== Request Info ===")
    print(f"URL: {API_CONFIG['base_url']}/api/open/app/product/area/v2")
    print("Parameters:", json.dumps(request_params, indent=2))
    print("\n=== Response Info ===")
    print(f"Status: {response.status_code}")
    print(f"Content: {response.text}")
    
    # 验证响应
    assert response.status_code == 200
    data = response.json()
    assert data.get('code') == 200
    assert 'data' in data

def test_get_cities(client):
    """测试获取城市列表"""
    # 准备参数
    params = {
        'proxyType': [104],  # 动态国外
        'countryCode': 'CN'  # 中国
    }
    
    # 获取完整请求参数
    request_params = prepare_request_params(params)
    
    # 发送请求
    response = client.post('/api/open/app/city/list/v2', json=request_params)
    
    # 打印请求和响应信息
    print("\n=== Request Info ===")
    print(f"URL: {API_CONFIG['base_url']}/api/open/app/city/list/v2")
    print("Parameters:", json.dumps(request_params, indent=2))
    print("\n=== Response Info ===")
    print(f"Status: {response.status_code}")
    print(f"Content: {response.text}")
    
    # 验证响应
    assert response.status_code == 200
    data = response.json()
    assert data.get('code') == 200
    assert 'data' in data

def test_get_product_stock(client):
    """测试获取产品库存"""
    # 准备参数
    params = {
        'proxyType': [104]  # 动态国外
    }
    
    # 获取完整请求参数
    request_params = prepare_request_params(params)
    
    # 发送请求
    response = client.post('/api/open/app/product/query/v2', json=request_params)
    
    # 打印请求和响应信息
    print("\n=== Request Info ===")
    print(f"URL: {API_CONFIG['base_url']}/api/open/app/product/query/v2")
    print("Parameters:", json.dumps(request_params, indent=2))
    print("\n=== Response Info ===")
    print(f"Status: {response.status_code}")
    print(f"Content: {response.text}")
    
    # 验证响应
    assert response.status_code == 200
    data = response.json()
    assert data.get('code') == 200
    assert 'data' in data

def test_get_app_info(client):
    """测试获取应用信息"""
    # 获取完整请求参数（不需要业务参数）
    request_params = prepare_request_params()
    
    # 发送请求
    response = client.post('/api/open/app/info/v2', json=request_params)
    
    # 打印请求和响应信息
    print("\n=== Request Info ===")
    print(f"URL: {API_CONFIG['base_url']}/api/open/app/info/v2")
    print("Parameters:", json.dumps(request_params, indent=2))
    print("\n=== Response Info ===")
    print(f"Status: {response.status_code}")
    print(f"Content: {response.text}")
    
    # 验证响应
    assert response.status_code == 200
    data = response.json()
    assert data.get('code') == 200
    assert 'data' in data

def test_get_assign_ip_info(client):
    """测试获取IP信息"""
    # 准备参数
    params = {
        'ip': '1.1.1.1',  # 测试IP
        'proxyType': 104  # 动态国外
    }
    
    # 获取完整请求参数
    request_params = prepare_request_params(params)
    
    # 发送请求
    response = client.post('/api/open/app/assign/ip/info/v2', json=request_params)
    
    # 打印请求和响应信息
    print("\n=== Request Info ===")
    print(f"URL: {API_CONFIG['base_url']}/api/open/app/assign/ip/info/v2")
    print("Parameters:", json.dumps(request_params, indent=2))
    print("\n=== Response Info ===")
    print(f"Status: {response.status_code}")
    print(f"Content: {response.text}")
    
    # 验证响应
    assert response.status_code == 200
    data = response.json()
    assert data.get('code') == 200
    assert 'data' in data

def test_get_ip_ranges(client):
    """测试获取IP段列表"""
    # 准备参数
    params = {
        'proxyType': [103],  # 静态国外家庭
        'countryCode': 'JP',  # 日本
        'cityCode': 'OSA'     # 大阪
    }
    
    # 获取完整请求参数
    request_params = prepare_request_params(params)
    
    # 发送请求
    response = client.post('/api/open/app/product/query/v2', json=request_params)
    
    # 打印请求和响应信息
    print("\n=== Request Info ===")
    print(f"URL: {API_CONFIG['base_url']}/api/open/app/product/query/v2")
    print("Parameters:", json.dumps(request_params, indent=2))
    print("\n=== Response Info ===")
    print(f"Status: {response.status_code}")
    print(f"Content: {response.text}")
    
    # 验证响应
    assert response.status_code == 200
    data = response.json()
    assert data.get('code') == 200
    assert 'data' in data

if __name__ == '__main__':
    pytest.main(['-v', 'test_ipipv_api.py']) 