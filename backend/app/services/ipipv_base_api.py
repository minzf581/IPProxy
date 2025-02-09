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
        logger.info("[IPIPVBaseAPI] 初始化服务")
        self.base_url = settings.IPIPV_API_BASE_URL
        self.app_key = settings.IPIPV_APP_KEY
        self.app_secret = settings.IPIPV_APP_SECRET
        self.api_version = settings.IPPROXY_API_VERSION
        self.api_encrypt = settings.IPPROXY_API_ENCRYPT
        self.app_username = settings.IPPROXY_APP_USERNAME
        self.mock_api = None
        
        # 测试模式配置
        if settings.TESTING:
            from app.tests.mocks.ipproxy_api import MockIPIPVAPI
            self.mock_api = MockIPIPVAPI()
            logger.info("[IPIPVBaseAPI] 使用测试模式")
            
        logger.info(f"[IPIPVBaseAPI] 配置信息:")
        logger.info(f"  - API URL: {self.base_url}")
        logger.info(f"  - APP Key: {self.app_key}")
        logger.info(f"  - API Version: {self.api_version}")
        logger.info(f"  - API Encrypt: {self.api_encrypt}")
        logger.info(f"  - APP Username: {self.app_username}")
        logger.info(f"  - Testing Mode: {settings.TESTING}")
    
    def set_mock_api(self, mock_api):
        """
        设置模拟API（仅用于测试）
        
        Args:
            mock_api: 模拟API实例
        """
        self.mock_api = mock_api
    
    def _generate_sign(self, params: Dict[str, Any], timestamp: str) -> str:
        """生成签名"""
        # 按字典序排序参数
        sorted_params = dict(sorted(params.items()))
        # 拼接字符串
        sign_str = f"appKey={self.app_key}&params={json.dumps(sorted_params)}&timestamp={timestamp}&key={self.app_secret}"
        logger.debug(f"[IPIPVBaseAPI] 签名字符串: {sign_str}")
        # MD5加密
        return hashlib.md5(sign_str.encode()).hexdigest().upper()
        
    def _encrypt_params(self, params: Dict[str, Any]) -> str:
        """AES加密参数"""
        try:
            # 使用app_secret的前32位作为密钥
            key = self.app_secret[:32].encode()
            # 使用app_secret的前16位作为IV
            iv = self.app_secret[:16].encode()
            
            # 将参数转换为JSON字符串
            params_str = json.dumps(params, ensure_ascii=False)
            logger.debug(f"[IPIPVBaseAPI] 加密前参数: {params_str}")
            
            # 补全到16的倍数
            pad_length = 16 - (len(params_str.encode()) % 16)
            params_str = params_str + (chr(pad_length) * pad_length)
            
            # AES加密
            cipher = AES.new(key, AES.MODE_CBC, iv)
            encrypted = cipher.encrypt(params_str.encode())
            
            # Base64编码
            encoded = base64.b64encode(encrypted).decode()
            logger.debug(f"[IPIPVBaseAPI] 加密后数据: {encoded}")
            return encoded
            
        except Exception as e:
            logger.error(f"[IPIPVBaseAPI] 参数加密失败: {str(e)}")
            raise
            
    async def _make_request(self, path: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """发送请求到IPIPV API"""
        try:
            # 生成时间戳
            timestamp = str(int(time.time()))
            
            # 确保params中包含必要的参数
            if not isinstance(params, dict):
                params = {}
            
            # 添加基础参数
            base_params = {
                "appKey": self.app_key,
                "version": self.api_version,
                "encrypt": self.api_encrypt,
                "appUsername": self.app_username
            }
            
            # 合并参数，确保用户参数优先级更高
            merged_params = {**base_params, **params}
            
            # 加密参数
            encrypted_params = self._encrypt_params(merged_params)
            
            # 生成签名
            sign = self._generate_sign(merged_params, timestamp)
            
            # 构造请求数据
            request_data = {
                "version": self.api_version,
                "encrypt": self.api_encrypt,
                "appKey": self.app_key,
                "reqId": hashlib.md5(f"{timestamp}{path}".encode()).hexdigest(),
                "timestamp": timestamp,
                "params": encrypted_params,
                "sign": sign
            }
            
            logger.info(f"[IPIPVBaseAPI] 发送请求: {path}")
            logger.debug(f"[IPIPVBaseAPI] 请求数据: {json.dumps(request_data, ensure_ascii=False)}")
            
            # 发送请求
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/{path}", json=request_data) as response:
                    response_data = await response.json()
                    logger.debug(f"[IPIPVBaseAPI] 响应数据: {json.dumps(response_data, ensure_ascii=False)}")
                    
                    if response.status != 200:
                        logger.error(f"[IPIPVBaseAPI] 请求失败: HTTP {response.status}")
                        logger.error(f"[IPIPVBaseAPI] 错误响应: {json.dumps(response_data, ensure_ascii=False)}")
                        raise Exception(f"API请求失败: {response_data.get('msg', '未知错误')}")
                    
                    # 检查业务响应码
                    if response_data.get("code") not in [0, 200]:
                        error_msg = response_data.get("msg", "未知错误")
                        logger.error(f"[IPIPVBaseAPI] 业务处理失败: {error_msg}")
                        raise Exception(f"业务处理失败: {error_msg}")
                    
                    # 如果响应数据是加密的，尝试解密
                    encrypted_data = response_data.get("data")
                    if isinstance(encrypted_data, str):
                        try:
                            decrypted_data = self._decrypt_response(encrypted_data)
                            if decrypted_data:
                                response_data["data"] = decrypted_data
                        except Exception as e:
                            logger.error(f"[IPIPVBaseAPI] 解密响应数据失败: {str(e)}")
                            logger.error("[IPIPVBaseAPI] 错误堆栈:", exc_info=True)
                    
                    return response_data.get("data", [])
                    
        except Exception as e:
            logger.error(f"[IPIPVBaseAPI] 请求失败: {str(e)}")
            logger.error("[IPIPVBaseAPI] 错误堆栈:", exc_info=True)
            raise
    
    def _decrypt_response(self, encrypted_text: str) -> Optional[Dict[str, Any]]:
        """解密API响应"""
        try:
            if not encrypted_text:
                logger.error("[IPIPVBaseAPI] 解密输入为空")
                return None
            
            logger.debug(f"[IPIPVBaseAPI] 解密前数据: {encrypted_text}")
            
            # Base64解码
            encrypted = base64.b64decode(encrypted_text)
            
            # 准备解密密钥和IV
            key = self.app_secret[:32].encode()
            iv = self.app_secret[:16].encode()
            
            # AES解密
            cipher = AES.new(key, AES.MODE_CBC, iv)
            decrypted = cipher.decrypt(encrypted)
            
            # 移除填充
            pad_length = decrypted[-1]
            decrypted = decrypted[:-pad_length]
            
            # 解析JSON
            try:
                result = json.loads(decrypted.decode())
                logger.debug(f"[IPIPVBaseAPI] 解密后数据: {json.dumps(result, ensure_ascii=False)}")
                return result
            except json.JSONDecodeError as e:
                logger.error(f"[IPIPVBaseAPI] JSON解析失败: {str(e)}")
                return None
            
        except Exception as e:
            logger.error(f"[IPIPVBaseAPI] 解密失败: {str(e)}")
            logger.error("[IPIPVBaseAPI] 错误堆栈:", exc_info=True)
            return None 