import time
import json
import base64
import requests
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding

def test_api():
    # API配置
    app_id = 'AK20241120145620'
    app_key = 'bf3ffghlt0hpc4omnvc2583jt0fag6a4'
    api_url = 'https://sandbox.ipipv.com/api/open/app/product/query/v2'
    
    # 构造请求参数
    params = {
        "timestamp": str(int(time.time())),
        "proxyType": [103]  # 从golang测试用例中看到的参数
    }
    
    # 转换为JSON字符串
    json_params = json.dumps(params, separators=(',', ':'))  # 使用紧凑的JSON格式
    
    # 准备加密
    key = app_key.encode('utf-8')
    iv = key[:16]
    
    # 填充
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(json_params.encode()) + padder.finalize()
    
    # AES-256-CBC加密
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(padded_data) + encryptor.finalize()
    
    # Base64编码
    params_base64 = base64.b64encode(encrypted).decode()
    
    # 构造最终请求
    request_data = {
        'version': 'v2',
        'encrypt': 'AES',
        'appKey': app_id,
        'params': params_base64,
        'reqId': f'reqId_{int(time.time() * 1000000)}'
    }
    
    # 打印curl命令
    print("Generated curl command:")
    print(f"curl -X POST '{api_url}' \\")
    print("-H 'Content-Type: application/json' \\")
    print(f"-d '{json.dumps(request_data)}'")
    
    # 发送请求
    print("\nSending request...")
    headers = {'Content-Type': 'application/json'}
    response = requests.post(api_url, json=request_data, headers=headers)
    
    print("\nResponse:")
    print(json.dumps(response.json(), indent=2))
    
    # 如果响应成功，解密响应数据
    if response.status_code == 200:
        resp_json = response.json()
        if resp_json['code'] == 200 and resp_json['data']:
            try:
                # Base64解码
                encrypted_data = base64.b64decode(resp_json['data'])
                
                # AES解密
                cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
                decryptor = cipher.decryptor()
                decrypted_padded = decryptor.update(encrypted_data) + decryptor.finalize()
                
                # 去除填充
                unpadder = padding.PKCS7(128).unpadder()
                decrypted = unpadder.update(decrypted_padded) + unpadder.finalize()
                
                print("\nDecrypted Response Data:")
                print(json.dumps(json.loads(decrypted.decode()), indent=2))
            except Exception as e:
                print(f"Error decrypting response: {e}")

if __name__ == '__main__':
    test_api()
