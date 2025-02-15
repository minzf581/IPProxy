"""
IPIPV API 基础服务模块
===================

此模块提供与IPIPV API通信的所有基础功能。
包含：
1. HTTP请求处理
2. 参数加密解密
3. 认证和授权
4. 错误处理
5. 日志记录

使用说明：
--------
1. 所有业务模块都应继承此基础类
2. 不要直接修改此文件中的核心方法
3. 如需扩展功能，请在子类中实现

依赖项：
-------
- httpx: HTTP客户端
- pycryptodome: 加密库
- python-jose: JWT处理
- logging: 日志处理

示例：
-----
```python
class ProxyService(IPIPVBaseAPI):
    async def get_proxy_info(self, proxy_id):
        return await self._make_request("api/proxy/info", {"id": proxy_id})
```

维护说明：
--------
1. 修改前请确保完整的测试覆盖
2. 所有更改需要记录在文档中
3. 保持向后兼容性
"""

import json
import time
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import httpx
import logging
import traceback
from typing import Dict, Any, Optional
from datetime import datetime
from app.config import settings
from app.utils.logging_utils import truncate_response
import hashlib
import os
import aiohttp

logger = logging.getLogger(__name__)

class IPIPVBaseAPI:
    """
    IPIPV API 基础服务类
    
    提供与IPIPV API通信的核心功能：
    - HTTP请求处理
    - 参数加密解密
    - 错误处理
    - 日志记录
    
    属性：
        base_url (str): API基础URL
        app_key (str): 应用密钥
        app_secret (str): 应用密钥
        mock_api: 测试模式下的模拟API
    """
    
    def __init__(self):
        """初始化基础服务"""
        self.logger = logging.getLogger(__name__)
        self.base_url = settings.IPPROXY_API_URL
        self.app_key = settings.IPPROXY_APP_KEY
        self.app_secret = settings.IPPROXY_APP_SECRET
        self.api_version = settings.IPPROXY_API_VERSION
        self.api_encrypt = settings.IPPROXY_API_ENCRYPT
        self.app_username = settings.IPPROXY_APP_USERNAME
        self.mock_api = None
        
        # 测试模式配置
        if settings.TESTING:
            from app.tests.mocks.ipproxy_api import MockIPIPVAPI
            self.mock_api = MockIPIPVAPI()
            self.logger.info("[IPIPVBaseAPI] 使用测试模式")
            
        # 只在首次初始化时打印配置信息，使用 debug 级别
        self.logger.debug(
            "API初始化: URL=%s, Key=%s",
            self.base_url,
            self.app_key[:8] + "***"  # 只显示 Key 的前8位
        )
        self.logger.debug("[IPIPVBaseAPI] API初始化完成")
    
    def set_mock_api(self, mock_api):
        """
        设置模拟API（仅用于测试）
        
        Args:
            mock_api: 模拟API实例
        """
        self.mock_api = mock_api
    
    def _generate_req_id(self) -> str:
        """生成请求ID"""
        return hashlib.md5(str(time.time()).encode()).hexdigest()
    
    def _encrypt_params(self, data: str) -> str:
        """AES加密参数"""
        try:
            self.logger.debug("[IPIPVBaseAPI] 开始加密请求参数")
            self.logger.debug(f"[IPIPVBaseAPI] 原始参数: {data}")
            
            # 使用app_secret的前32位作为密钥
            key = self.app_secret[:32].encode()
            # 使用app_secret的前16位作为IV
            iv = self.app_secret[:16].encode()
            
            cipher = AES.new(key, AES.MODE_CBC, iv)
            # 对数据进行填充
            padded_data = pad(data.encode(), AES.block_size)
            # 加密
            encrypted = cipher.encrypt(padded_data)
            # Base64编码
            encrypted_str = base64.b64encode(encrypted).decode()
            
            self.logger.debug(f"[IPIPVBaseAPI] 加密后的参数: {encrypted_str}")
            return encrypted_str
            
        except Exception as e:
            self.logger.error(f"[IPIPVBaseAPI] 加密参数失败: {str(e)}")
            self.logger.error(traceback.format_exc())
            raise
    
    def _decrypt_response(self, encrypted_data: str) -> str:
        """AES解密响应"""
        try:
            if not encrypted_data:
                self.logger.debug("[IPIPVBaseAPI] 响应数据为空")
                return []
                
            # 使用app_secret的前32位作为密钥
            key = self.app_secret[:32].encode()
            # 使用app_secret的前16位作为IV
            iv = self.app_secret[:16].encode()
            
            # Base64解码
            try:
                encrypted = base64.b64decode(encrypted_data)
                self.logger.debug("[IPIPVBaseAPI] Base64解码成功")
            except Exception as e:
                self.logger.error(f"[IPIPVBaseAPI] Base64解码失败: {str(e)}")
                return encrypted_data
            
            # 解密
            try:
                cipher = AES.new(key, AES.MODE_CBC, iv)
                decrypted = unpad(cipher.decrypt(encrypted), AES.block_size)
                decrypted_str = decrypted.decode('utf-8')
                self.logger.debug(f"[IPIPVBaseAPI] 解密后的原始数据: {decrypted_str}")
            except Exception as e:
                self.logger.error(f"[IPIPVBaseAPI] AES解密失败: {str(e)}")
                return encrypted_data
            
            # 尝试解析JSON
            try:
                decrypted_json = json.loads(decrypted_str)
                self.logger.debug(f"[IPIPVBaseAPI] 解析后的JSON数据: {json.dumps(decrypted_json, ensure_ascii=False)}")
                
                # 处理特殊情况
                if decrypted_json is None:
                    self.logger.debug("[IPIPVBaseAPI] 解密后的JSON为null")
                    return []
                if isinstance(decrypted_json, list) and len(decrypted_json) == 0:
                    self.logger.debug("[IPIPVBaseAPI] 解密后的JSON为空列表")
                    return []
                if isinstance(decrypted_json, str) and decrypted_json.lower() == "null":
                    self.logger.debug("[IPIPVBaseAPI] 解密后的JSON为'null'字符串")
                    return []
                    
                return decrypted_json
                
            except json.JSONDecodeError as e:
                self.logger.error(f"[IPIPVBaseAPI] JSON解析失败: {str(e)}")
                self.logger.debug(f"[IPIPVBaseAPI] 无法解析的数据: {decrypted_str}")
                # 如果不是有效的JSON,返回原始解密字符串
                return decrypted_str
                
        except Exception as e:
            self.logger.error(f"[IPIPVBaseAPI] 解密失败: {str(e)}")
            self.logger.error(traceback.format_exc())
            # 解密失败时返回原始数据
            return encrypted_data
    
    def _generate_sign(self, params: Dict[str, Any], timestamp: int) -> str:
        """生成签名"""
        # 按键排序
        sorted_params = dict(sorted(params.items()))
        
        # 构造签名字符串
        sign_str = '&'.join([f"{k}={v}" for k, v in sorted_params.items()])
        sign_str += f"&timestamp={timestamp}&appSecret={self.app_secret}"
        
        # MD5加密
        return hashlib.md5(sign_str.encode()).hexdigest()
    
    async def _make_request(self, path: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """发送请求到IPIPV API"""
        try:
            self.logger.debug(f"[IPIPVBaseAPI] 开始发送请求: {path}")
            self.logger.debug(f"[IPIPVBaseAPI] 原始请求参数: {json.dumps(params, ensure_ascii=False)}")
            
            # 生成时间戳和请求ID
            timestamp = int(time.time())
            req_id = self._generate_req_id()
            
            # 处理业务参数
            if params:
                # 确保proxyType是数组
                if "proxyType" in params and not isinstance(params["proxyType"], list):
                    params["proxyType"] = [params["proxyType"]]
                # 添加appUsername如果没有
                if "appUsername" not in params:
                    params["appUsername"] = self.app_username
                # 添加version如果没有
                if "version" not in params:
                    params["version"] = self.api_version
                
                self.logger.debug(f"[IPIPVBaseAPI] 处理后的业务参数: {json.dumps(params, ensure_ascii=False)}")
            
            # 添加基础参数
            base_params = {
                "version": self.api_version,
                "encrypt": self.api_encrypt,
                "appKey": self.app_key,
                "reqId": req_id,
                "timestamp": str(timestamp)  # 转换为字符串
            }
            
            # 加密业务参数
            if params:
                params_str = json.dumps(params, ensure_ascii=False)
                self.logger.debug(f"[IPIPVBaseAPI] 待加密的参数字符串: {params_str}")
                encrypted_params = self._encrypt_params(params_str)
                base_params["params"] = encrypted_params
            
            # 生成签名
            sign = self._generate_sign(base_params, timestamp)
            base_params["sign"] = sign
            
            # 构建请求URL
            url = f"{self.base_url.rstrip('/')}/{path.lstrip('/')}"
            self.logger.debug(f"[IPIPVBaseAPI] 请求URL: {url}")
            self.logger.debug(f"[IPIPVBaseAPI] 最终请求参数: {json.dumps(base_params, ensure_ascii=False)}")
            
            # 发送请求
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    json=base_params,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                ) as response:
                    self.logger.debug(f"[IPIPVBaseAPI] 响应状态码: {response.status}")
                    
                    # 读取响应内容
                    content = await response.text()
                    self.logger.debug(f"[IPIPVBaseAPI] 原始响应内容: {content[:1000]}")
                    
                    # 解析响应内容
                    try:
                        response_data = json.loads(content)
                        self.logger.debug(f"[IPIPVBaseAPI] 解析后的响应内容: {json.dumps(response_data, ensure_ascii=False)}")
                        
                        # 检查响应状态
                        if response_data.get("code") not in [0, 200]:
                            error_msg = response_data.get("msg", "未知错误")
                            self.logger.error(f"[IPIPVBaseAPI] API返回错误: {error_msg}")
                            return {
                                "code": response_data.get("code", 500),
                                "msg": error_msg,
                                "data": None
                            }
                        
                        # 处理加密响应
                        if response_data.get("data"):
                            # 检查响应数据是否为Base64编码的字符串
                            data = response_data.get("data")
                            try:
                                # 尝试Base64解码
                                base64.b64decode(data)
                                # 如果能成功解码,说明是加密数据
                                self.logger.debug("[IPIPVBaseAPI] 检测到加密响应,开始解密")
                                decrypted_data = self._decrypt_response(data)
                                response_data["data"] = decrypted_data
                            except Exception as e:
                                self.logger.debug(f"[IPIPVBaseAPI] 响应未加密或解密失败: {str(e)}")
                        
                        return response_data
                        
                    except json.JSONDecodeError as e:
                        self.logger.error(f"[IPIPVBaseAPI] 解析响应内容失败: {str(e)}")
                        self.logger.error(f"[IPIPVBaseAPI] 无效的响应内容: {content}")
                        return {
                            "code": 500,
                            "msg": f"解析响应内容失败: {str(e)}",
                            "data": None
                        }
                
        except Exception as e:
            self.logger.error(f"[IPIPVBaseAPI] 请求失败: {str(e)}")
            self.logger.error(traceback.format_exc())
            return {
                "code": 500,
                "msg": f"请求失败: {str(e)}",
                "data": None
            }
