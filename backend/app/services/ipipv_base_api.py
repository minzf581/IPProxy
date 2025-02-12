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
        self.logger.debug(f"[IPIPVBaseAPI] 签名字符串: {sign_str}")
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
            self.logger.debug(f"[IPIPVBaseAPI] 加密前参数: {params_str}")
            
            # 补全到16的倍数
            pad_length = 16 - (len(params_str.encode()) % 16)
            params_str = params_str + (chr(pad_length) * pad_length)
            
            # AES加密
            cipher = AES.new(key, AES.MODE_CBC, iv)
            encrypted = cipher.encrypt(params_str.encode())
            
            # Base64编码
            encoded = base64.b64encode(encrypted).decode()
            self.logger.debug(f"[IPIPVBaseAPI] 加密后数据: {encoded}")
            return encoded
            
        except Exception as e:
            self.logger.error(f"[IPIPVBaseAPI] 参数加密失败: {str(e)}")
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
            
            self.logger.info(f"[IPIPVBaseAPI] 发送请求: {path}")
            self.logger.debug(f"[IPIPVBaseAPI] 请求数据: {json.dumps(request_data, ensure_ascii=False)}")
            
            # 修正 URL 拼接
            url = f"{self.base_url.rstrip('/')}/{path.lstrip('/')}"
            
            # 发送请求
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    json=request_data,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                ) as response:
                    response_text = await response.text()
                    self.logger.debug(f"[IPIPVBaseAPI] 响应状态码: {response.status}")
                    self.logger.debug(f"[IPIPVBaseAPI] 响应内容: {truncate_response(response_text)}")
                    
                    if response.status != 200:
                        self.logger.error(f"[IPIPVBaseAPI] 请求失败: HTTP {response.status}")
                        return {
                            "code": response.status,
                            "msg": "API请求失败",
                            "data": None
                        }
                    
                    try:
                        result = json.loads(response_text)
                        
                        # 检查响应格式
                        if not isinstance(result, dict):
                            self.logger.error("[IPIPVBaseAPI] 响应格式错误: 不是有效的JSON对象")
                            return {
                                "code": 500,
                                "msg": "响应格式错误",
                                "data": None
                            }
                            
                        # 如果响应中包含加密数据，进行解密
                        if result.get('code') == 200 and isinstance(result.get('data'), str):
                            try:
                                decrypted_data = self._decrypt_response(result['data'])
                                if decrypted_data is not None:
                                    result['data'] = decrypted_data
                                else:
                                    self.logger.error("[IPIPVBaseAPI] 响应数据解密失败")
                                    return {
                                        "code": 500,
                                        "msg": "响应数据解密失败",
                                        "data": None
                                    }
                            except Exception as e:
                                self.logger.error(f"[IPIPVBaseAPI] 解密过程出错: {str(e)}")
                                return {
                                    "code": 500,
                                    "msg": f"解密失败: {str(e)}",
                                    "data": None
                                }
                        
                        return result
                        
                    except json.JSONDecodeError:
                        self.logger.error("[IPIPVBaseAPI] 响应解析失败: 非JSON格式")
                        return {
                            "code": 500,
                            "msg": "响应格式错误",
                            "data": None
                        }
                        
        except Exception as e:
            self.logger.error(f"[IPIPVBaseAPI] 请求失败: {str(e)}")
            self.logger.error(traceback.format_exc())
            return {
                "code": 500,
                "msg": str(e),
                "data": None
            }
    
    def _decrypt_response(self, encrypted_text: str) -> Optional[Dict[str, Any]]:
        """解密API响应"""
        try:
            if not encrypted_text:
                self.logger.error("[IPIPVBaseAPI] 解密输入为空")
                return None
            
            self.logger.debug(f"[IPIPVBaseAPI] 开始解密数据，长度: {len(encrypted_text)}")
            
            # Base64解码
            try:
                encrypted = base64.b64decode(encrypted_text)
                self.logger.debug(f"[IPIPVBaseAPI] Base64解码成功，数据长度: {len(encrypted)}")
            except Exception as e:
                self.logger.error(f"[IPIPVBaseAPI] Base64解码失败: {str(e)}, 原始数据: {encrypted_text[:100]}")
                return None
            
            # 准备解密密钥和IV
            key = self.app_secret[:32].encode()
            iv = self.app_secret[:16].encode()
            
            # 检查密钥和IV长度
            # AES解密
            try:
                cipher = AES.new(key, AES.MODE_CBC, iv)
                decrypted = cipher.decrypt(encrypted)
                self.logger.debug(f"[IPIPVBaseAPI] AES解密成功，长度: {len(decrypted)}")
            except Exception as e:
                self.logger.error(f"[IPIPVBaseAPI] AES解密失败: {str(e)}")
                return None
            
            # 移除填充
            try:
                pad_length = decrypted[-1]
                if not (0 < pad_length <= 16):
                    self.logger.error(f"[IPIPVBaseAPI] 无效的填充长度: {pad_length}")
                    return None
                decrypted = decrypted[:-pad_length]
                self.logger.debug(f"[IPIPVBaseAPI] 移除填充成功，最终长度: {len(decrypted)}")
            except Exception as e:
                self.logger.error(f"[IPIPVBaseAPI] 移除填充失败: {str(e)}")
                return None
            
            # 解析JSON
            try:
                result = json.loads(decrypted.decode())
                self.logger.debug(f"[IPIPVBaseAPI] 解密后数据: {json.dumps(result, ensure_ascii=False)}")
                return result
            except json.JSONDecodeError as e:
                self.logger.error(f"[IPIPVBaseAPI] JSON解析失败: {str(e)}")
                self.logger.error(f"[IPIPVBaseAPI] 解密后原始数据: {decrypted.decode(errors='ignore')}")
                return None
            
        except Exception as e:
            self.logger.error(f"[IPIPVBaseAPI] 解密失败: {str(e)}")
            self.logger.error("[IPIPVBaseAPI] 错误堆栈:", exc_info=True)
            return None 