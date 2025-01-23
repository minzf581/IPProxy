import json
import time
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import requests
import os
from typing import Dict, Any, List

class IPProxyService:
    def __init__(self):
        self.app_id = os.getenv('APP_ID', "AK20241120145620")
        self.app_key = os.getenv('APP_KEY', "bf3ffghlt0hpc4omnvc2583jt0fag6a4")
        self.base_url = "https://sandbox.ipipv.com"
        
    def _generate_sign(self, timestamp: str) -> str:
        """生成签名"""
        # 构造待签名字符串
        data = {
            'app_id': self.app_id,
            'timestamp': timestamp
        }
        
        # 按键排序
        sorted_data = dict(sorted(data.items()))
        
        # 拼接字符串
        sign_str = '&'.join([f"{k}={v}" for k, v in sorted_data.items()])
        
        # AES-256-CBC加密
        key = self.app_key.encode('utf-8')
        iv = key[:16]
        cipher = AES.new(key, AES.MODE_CBC, iv)
        
        # 填充
        padded_data = pad(sign_str.encode(), AES.block_size)
        
        # 加密
        encrypted = cipher.encrypt(padded_data)
        
        # Base64编码
        return base64.b64encode(encrypted).decode()
        
    def _encrypt_params(self, params: Dict[str, Any] = None) -> str:
        """使用AES-CBC加密参数"""
        if params is None:
            params = {}
            
        # 添加时间戳
        timestamp = str(int(time.time()))
        params['timestamp'] = timestamp
            
        # 将参数转换为JSON字符串
        json_params = json.dumps(params, separators=(',', ':'))
        
        # AES-256-CBC加密
        key = self.app_key.encode('utf-8')
        iv = key[:16]
        cipher = AES.new(key, AES.MODE_CBC, iv)
        
        # 填充
        padded_data = pad(json_params.encode(), AES.block_size)
        
        # 加密
        encrypted = cipher.encrypt(padded_data)
        
        # Base64编码
        return base64.b64encode(encrypted).decode()
        
    def _decrypt_response(self, encrypted_data: str) -> Dict[str, Any]:
        """解密API响应数据"""
        if not encrypted_data:
            return None
            
        try:
            # Base64解码
            encrypted_bytes = base64.b64decode(encrypted_data)
            
            # 准备解密
            key = self.app_key.encode('utf-8')
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
            
    def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """发送请求到IPIPV API"""
        # 添加时间戳
        timestamp = str(int(time.time()))
        
        # 生成签名
        sign = self._generate_sign(timestamp)
        
        # 加密参数
        encrypted_params = self._encrypt_params(params)
        
        # 构造请求数据
        request_data = {
            'appId': self.app_id,
            'appKey': self.app_id,
            'timestamp': timestamp,
            'sign': sign,
            'version': 'v2',
            'encrypt': 'AES',
            'params': encrypted_params
        }
        
        # 发送请求
        url = f"{self.base_url}{endpoint}"
        try:
            print(f"发送请求到: {url}")
            print(f"请求参数: {json.dumps(params, indent=2)}")
            print(f"加密后的请求数据: {json.dumps(request_data, indent=2)}")
            
            response = requests.post(url, json=request_data)
            
            print(f"响应状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            
            if response.status_code != 200:
                raise Exception(f"API请求失败: {response.status_code}")
                
            # 解析响应
            result = response.json()
            print(f"解析后的响应: {json.dumps(result, indent=2)}")
            
            if result.get('code') != 0:
                error_msg = result.get('msg') or result.get('message') or "未知错误"
                raise Exception(f"API返回错误: {error_msg}")
                
            # 解密响应数据
            if result.get('data'):
                decrypted_data = self._decrypt_response(result.get('data'))
                print(f"解密后的数据: {json.dumps(decrypted_data, indent=2) if decrypted_data else None}")
                if decrypted_data:
                    return decrypted_data
            return result
        except Exception as e:
            print(f"请求失败: {str(e)}")
            print(f"请求URL: {url}")
            print(f"请求数据: {json.dumps(request_data, indent=2)}")
            raise e

    def create_proxy_user(self, params: dict) -> dict:
        """创建代理用户"""
        return self._make_request('/api/open/app/proxy/user/v2', params)

    def update_proxy_user(self, params: dict) -> dict:
        """更新代理用户
        Args:
            params: {
                appUsername: str,       # 子账号用户名
                appMainUsername: str,   # 主账号用户名
                mainUsername: str,      # 主账号平台账号
                status: int,           # 状态：1=启用，2=禁用
                limitFlow: int,        # 流量限制(GB)
                remark: str,           # 备注
                balance: float         # 余额
            }
        """
        print(f"[IPProxyService] 更新代理用户，参数：{json.dumps(params, indent=2, ensure_ascii=False)}")
        try:
            response = self._make_request('/api/open/app/proxy/user/v2', params)
            print(f"[IPProxyService] API响应：{json.dumps(response, indent=2, ensure_ascii=False)}")
            return response
        except Exception as e:
            print(f"[IPProxyService] 更新代理用户失败：{str(e)}")
            raise e

    def get_app_info(self) -> Dict[str, Any]:
        """获取应用信息（余额、总充值、总消费）"""
        return self._make_request('/api/open/app/proxy/info/v2')

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
        key = self.app_key[:32].encode('utf-8')  # 使用32字节密钥
        iv = self.app_key[:16].encode('utf-8')   # 使用16字节IV
        
        # 将参数转换为JSON字符串
        data = json.dumps(params).encode('utf-8')
        
        # 使用AES-256-CBC模式加密
        cipher = AES.new(key, AES.MODE_CBC, iv)
        encrypted = cipher.encrypt(pad(data, AES.block_size))
        
        # 返回Base64编码的密文
        return base64.b64encode(encrypted).decode('utf-8')

    def create_main_user(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """创建主账户
        Args:
            params: {
                'phone': str,      # 必填：主账号手机号
                'email': str,      # 必填：主账号邮箱
                'authType': int,   # 必填：认证类型 1=未实名 2=个人实名 3=企业实名
                'authName': str,   # 选填：主账号实名认证的真实名字或者企业名
                'no': str,         # 必填：主账号实名认证的实名证件号码或者企业营业执照号码
                'status': int,     # 必填：状态 1=正常 2=禁用
                'appUsername': str,# 选填：渠道商主账号(不传随机生成)
                'password': str,   # 选填：主账号密码(不传随机生成)
                'vsp': int,        # 选填：vsp
            }
        Returns:
            Dict[str, Any]: {
                'appUsername': str,  # 渠道商子账号
                'username': str,     # 平台子账号
                'password': str,     # 子账号密码
                'status': int,       # 用户状态 1=正常 2=禁用
                'authStatus': int,   # 认证状态 1=未实名 2=个人实名 3=企业实名
            }
        """
        return self._make_request('/api/open/app/user/v2', params)

    async def get_instances(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """获取实例列表
        Args:
            params: {
                'instanceNo': str,  # 必填：实例编号（主账号的 app_username）
                'page': int,        # 必填：页码
                'pageSize': int,    # 必填：每页数量
            }
        Returns:
            Dict[str, Any]: {
                'list': List[Dict[str, Any]],  # 实例列表
                'total': int,                  # 总数
                'page': int,                   # 当前页码
                'pageSize': int,               # 每页数量
            }
        """
        return self._make_request('/api/open/app/instance/v2', params)
