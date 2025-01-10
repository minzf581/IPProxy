import json
import time
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import requests
import os

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
            
    def _make_request(self, endpoint, params=None):
        """发送API请求"""
        url = f"{self.base_url}{endpoint}"
        
        # 准备请求数据
        request_data = {
            "version": "v2",
            "encrypt": "AES",
            "appKey": self.app_key,
            "reqId": f"reqId_{int(time.time() * 1000000)}"
        }
        
        # 如果有参数，加密它们
        if params is not None:
            encrypted_params = self._encrypt_params(params)
            request_data["params"] = encrypted_params
            
        # 发送请求
        try:
            response = requests.post(url, json=request_data)
            response.raise_for_status()
            
            # 解析响应
            resp_data = response.json()
            if resp_data["code"] != 200:
                raise Exception(f"API错误: {resp_data['msg']}")
                
            # 如果有加密数据，解密它
            if "data" in resp_data and resp_data["data"]:
                return self._decrypt_response(resp_data["data"])
            return resp_data
            
        except Exception as e:
            print(f"请求失败: {str(e)}")
            raise
            
    def get_dashboard_data(self):
        """获取仪表盘数据"""
        try:
            # 获取应用信息
            app_info = self._make_request("/api/open/app/info/v2")
            
            # 获取统计信息
            statistics = self._make_request("/api/open/app/statistics/v2")
            
            # 合并数据
            dashboard_data = {
                "total_consumption": app_info.get("totalConsumption", 0),  # 累计消费
                "total_recharge": app_info.get("totalRecharge", 0),       # 累计充值
                "balance": app_info.get("balance", 0),                    # 剩余金额
                "month_recharge": statistics.get("monthRecharge", 0),     # 本月充值
                "month_consumption": statistics.get("monthConsumption", 0), # 本月消费
                "last_month_consumption": statistics.get("lastMonthConsumption", 0)  # 上月消费
            }
            
            return dashboard_data
            
        except Exception as e:
            print(f"获取仪表盘数据失败: {str(e)}")
            raise

    def get_app_info(self):
        """获取应用信息"""
        # 模拟数据，实际项目中应该调用真实的API
        return {
            "totalRecharge": 10000.00,
            "totalConsumption": 8000.00,
            "balance": 2000.00
        }

    def get_statistics(self):
        """获取统计信息"""
        # 模拟数据，实际项目中应该调用真实的API
        return {
            "monthRecharge": 1500.00,
            "monthConsumption": 1200.00,
            "lastMonthConsumption": 1100.00
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
