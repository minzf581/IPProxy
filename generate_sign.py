import time
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
import base64
import json

def encrypt_params(data, app_key):
    # 将数据转换为JSON字符串
    json_data = json.dumps(data)
    
    # AES-256-CBC加密
    key = app_key.encode('utf-8')
    iv = key[:16]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    
    # 填充
    padded_data = pad(json_data.encode(), AES.block_size)
    
    # 加密
    encrypted = cipher.encrypt(padded_data)
    
    # Base64编码
    return base64.b64encode(encrypted).decode()

def generate_sign(app_id, app_key, timestamp):
    # 构造待签名字符串
    data = {
        'app_id': app_id,
        'timestamp': str(timestamp)
    }
    
    # 按键排序
    sorted_data = dict(sorted(data.items()))
    
    # 拼接字符串
    sign_str = '&'.join([f"{k}={v}" for k, v in sorted_data.items()])
    
    # AES-256-CBC加密
    key = app_key.encode('utf-8')
    iv = key[:16]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    
    # 填充
    padded_data = pad(sign_str.encode(), AES.block_size)
    
    # 加密
    encrypted = cipher.encrypt(padded_data)
    
    # Base64编码
    return base64.b64encode(encrypted).decode()

# 生成签名
app_id = "AK20241120145620"
app_key = "bf3ffghlt0hpc4omnvc2583jt0fag6a4"
timestamp = int(time.time())

sign = generate_sign(app_id, app_key, timestamp)

# API参数
params = {
    "timestamp": str(timestamp)
}

# 加密参数
encrypted_params = encrypt_params(params, app_key)

# 构造最终请求
request_data = {
    "version": "v2",
    "encrypt": "AES",
    "appKey": app_id,
    "params": encrypted_params
}

# 打印curl命令
curl_data = {
    "app_id": app_id,
    "timestamp": str(timestamp),
    "sign": sign
}

print(f"timestamp={timestamp}")
print(f"sign={sign}")
print("\nCURL command:")
print(f"curl -X POST 'https://sandbox.ipipv.com/api/v2/product/sync' \\")
print("-H 'Content-Type: application/json' \\")
print(f"-d '{json.dumps(curl_data)}'")

print("\nFinal curl command:")
print(f"curl -X POST 'https://sandbox.ipipv.com/api/open/app/product/query/v2' \\")
print("-H 'Content-Type: application/json' \\")
print(f"-d '{json.dumps(request_data)}'")
