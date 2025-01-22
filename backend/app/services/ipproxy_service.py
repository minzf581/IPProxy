import json
import time
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import requests
import os
from typing import Dict, Any

class IPProxyService:
    def __init__(self):
        self.app_key = os.getenv('APP_KEY', "AK20241120145620")
        self.app_secret = os.getenv('APP_SECRET', "bf3ffghlt0hpc4omnvc2583jt0fag6a4")
        self.base_url = "https://sandbox.ipipv.com"
        
    def _encrypt_params(self, params):
        """使用AES-CBC加密参数"""
        if params is None:
            return None
            
        # 将参数转换为JSON字符串
        json_params = json.dumps(params, separators=(',', ':'))
        
        # 准备加密
        key = self.app_secret.encode('utf-8')
        iv = key[:16]  # 使用密钥的前16位作为IV
        
        # 创建AES加密器
        cipher = AES.new(key, AES.MODE_CBC, iv)
        
        # 对数据进行填充并加密
        padded_data = pad(json_params.encode(), AES.block_size)
        encrypted_data = cipher.encrypt(padded_data)
        
        # Base64编码
        return base64.b64encode(encrypted_data).decode()
        
    def _decrypt_response(self, encrypted_data):
        """解密API响应数据"""
        if not encrypted_data:
            return None
            
        try:
            # Base64解码
            encrypted_bytes = base64.b64decode(encrypted_data)
            
            # 准备解密
            key = self.app_secret.encode('utf-8')
            iv = key[:16]
            
            # 创建AES解密器
            cipher = AES.new(key, AES.MODE_CBC, iv)
            
            # 解密并去除填充
            decrypted_padded = cipher.decrypt(encrypted_bytes)
            decrypted_data = unpad(decrypted_padded, AES.block_size)
            
            # 解析JSON
            return json.loads(decrypted_data.decode())
        except Exception as e:
            print(f"解密失败: {str(e)}")
            return None
            
    def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """发送请求到IPIPV API"""
        # 添加时间戳
        params['timestamp'] = str(int(time.time()))
        
        # 加密参数
        encrypted_params = self._encrypt_params(params)
        
        # 构造请求数据
        request_data = {
            'version': 'v2',
            'encrypt': 'AES',
            'appKey': self.app_key,
            'params': encrypted_params
        }
        
        # 发送请求
        url = f"{self.base_url}{endpoint}"
        response = requests.post(url, json=request_data)
        
        if response.status_code != 200:
            raise Exception(f"API请求失败: {response.status_code}")
            
        # 解析响应
        result = response.json()
        if result.get('code') != '200':
            raise Exception(f"API返回错误: {result.get('msg')}")
            
        # 解密响应数据
        decrypted_data = self._decrypt_response(result.get('data'))
        return decrypted_data

    def get_app_info(self) -> Dict[str, Any]:
        """获取应用信息（余额、总充值、总消费）"""
        try:
            data = self._make_request('/api/open/app/proxy/info/v2', {})
            return {
                'balance': data.get('balance', 0),
                'totalRecharge': data.get('totalRecharge', 0),
                'totalConsumption': data.get('totalConsumption', 0)
            }
        except Exception as e:
            print(f"获取应用信息失败: {str(e)}")
            return {
                'balance': 0,
                'totalRecharge': 0,
                'totalConsumption': 0
            }

    def get_statistics(self) -> Dict[str, Any]:
        """获取流量使用统计"""
        try:
            data = self._make_request('/api/open/app/proxy/flow/use/log/v2', {})
            return {
                'monthlyUsage': data.get('monthlyUsage', 0),
                'dailyUsage': data.get('dailyUsage', 0),
                'lastMonthUsage': data.get('lastMonthUsage', 0)
            }
        except Exception as e:
            print(f"获取流量统计失败: {str(e)}")
            return {
                'monthlyUsage': 0,
                'dailyUsage': 0,
                'lastMonthUsage': 0
            }

    def encrypt_params(self, params: dict) -> str:
        """AES-256-CBC加密参数"""
        key = self.app_secret[:32].encode('utf-8')  # 使用32字节密钥
        iv = self.app_secret[:16].encode('utf-8')   # 使用16字节IV
        
        # 将参数转换为JSON字符串
        data = json.dumps(params).encode('utf-8')
        
        # 使用AES-256-CBC模式加密
        cipher = AES.new(key, AES.MODE_CBC, iv)
        encrypted = cipher.encrypt(pad(data, AES.block_size))
        
        # 返回Base64编码的密文
        return base64.b64encode(encrypted).decode('utf-8')
