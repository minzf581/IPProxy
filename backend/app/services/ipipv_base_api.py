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
        """
        加密请求参数
        
        Args:
            data: 要加密的数据
            
        Returns:
            str: 加密后的数据
        """
        try:
            self.logger.debug("[IPIPVBaseAPI] 开始加密请求参数")
            self.logger.debug(f"[IPIPVBaseAPI] 原始参数: {data}")
            
            # 使用app_secret的前32位作为密钥
            key = self.app_secret[:32].encode('utf-8')
            # 使用app_secret的前16位作为IV
            iv = self.app_secret[:16].encode('utf-8')
            
            # 创建AES加密器
            cipher = AES.new(key, AES.MODE_CBC, iv)
            
            # 对数据进行填充和加密
            padded_data = pad(data.encode('utf-8'), AES.block_size)
            encrypted_data = cipher.encrypt(padded_data)
            
            # 将加密后的数据转换为Base64
            base64_data = base64.b64encode(encrypted_data).decode('utf-8')
            
            self.logger.debug(f"[IPIPVBaseAPI] 加密后的参数: {base64_data}")
            return base64_data
            
        except Exception as e:
            self.logger.error(f"[IPIPVBaseAPI] 加密参数失败: {str(e)}")
            raise
    
    def _decrypt_response(self, encrypted_data: str) -> str:
        """
        解密响应数据
        
        Args:
            encrypted_data: 加密的响应数据
            
        Returns:
            str: 解密后的数据
        """
        try:
            # Base64解码
            encrypted_bytes = base64.b64decode(encrypted_data)
            self.logger.debug("[IPIPVBaseAPI] Base64解码成功")
            
            # 使用app_secret的前32位作为密钥
            key = self.app_secret[:32].encode('utf-8')
            # 使用app_secret的前16位作为IV
            iv = self.app_secret[:16].encode('utf-8')
            
            # 创建AES解密器
            cipher = AES.new(key, AES.MODE_CBC, iv)
            
            # 解密数据
            decrypted_data = unpad(cipher.decrypt(encrypted_bytes), AES.block_size)
            decrypted_str = decrypted_data.decode('utf-8')
            
            self.logger.debug(f"[IPIPVBaseAPI] 解密后的原始数据: {decrypted_str}")
            
            # 尝试解析JSON
            try:
                json_data = json.loads(decrypted_str)
                self.logger.debug(f"[IPIPVBaseAPI] 解析后的JSON数据: {json.dumps(json_data, ensure_ascii=False)}")
                return json_data
            except json.JSONDecodeError:
                self.logger.warning("[IPIPVBaseAPI] 解密后的数据不是有效的JSON格式")
                return decrypted_str
                
        except Exception as e:
            self.logger.error(f"[IPIPVBaseAPI] 解密响应失败: {str(e)}")
            raise
    
    def _generate_sign(self, params: Dict[str, Any], timestamp: int) -> str:
        """
        生成请求签名
        
        Args:
            params: 请求参数
            timestamp: 时间戳
            
        Returns:
            str: 签名字符串
        """
        try:
            # 按字母顺序排序参数
            sorted_params = dict(sorted(params.items()))
            
            # 构建签名字符串
            sign_str = '&'.join([f"{k}={v}" for k, v in sorted_params.items()])
            
            # 添加时间戳和密钥
            sign_str = f"{sign_str}&timestamp={timestamp}&appSecret={self.app_secret}"
            
            # 计算MD5并转换为大写
            sign = hashlib.md5(sign_str.encode()).hexdigest().upper()
            
            self.logger.debug(f"[IPIPVBaseAPI] 签名字符串: {sign_str}")
            self.logger.debug(f"[IPIPVBaseAPI] 签名结果: {sign}")
            
            return sign
            
        except Exception as e:
            self.logger.error(f"[IPIPVBaseAPI] 生成签名失败: {str(e)}")
            raise
    
    async def _make_request(self, path: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """发送请求到IPIPV API"""
        try:
            # 测试模式下使用模拟API
            if self.mock_api:
                return await self.mock_api.make_request(path, params)
            
            self.logger.info(f"[IPIPVBaseAPI] 开始发送请求: {path}")
            self.logger.info(f"[IPIPVBaseAPI] 原始请求参数: {json.dumps(params, ensure_ascii=False)}")
            self.logger.info(f"[IPIPVBaseAPI] API配置: base_url={self.base_url}, app_key={self.app_key[:8]}***")
            
            # 处理业务参数
            business_params = params.copy()
            if "version" not in business_params:
                business_params["version"] = self.api_version
            
            self.logger.info(f"[IPIPVBaseAPI] 处理后的业务参数: {json.dumps(business_params, ensure_ascii=False)}")
            
            # 加密业务参数
            params_str = json.dumps(business_params, ensure_ascii=False)
            self.logger.info(f"[IPIPVBaseAPI] 待加密的参数字符串: {params_str}")
            encrypted_params = self._encrypt_params(params_str)
            
            # 构建基础请求参数
            timestamp = str(int(time.time()))
            base_params = {
                "version": self.api_version,
                "encrypt": self.api_encrypt,
                "appKey": self.app_key,
                "reqId": self._generate_req_id(),
                "timestamp": timestamp,
                "params": encrypted_params
            }
            
            # 生成签名
            base_params["sign"] = self._generate_sign(business_params, int(timestamp))
            
            # 构建完整URL
            url = f"{self.base_url}/{path}"
            self.logger.info(f"[IPIPVBaseAPI] 请求URL: {url}")
            self.logger.info(f"[IPIPVBaseAPI] 最终请求参数: {json.dumps(base_params, ensure_ascii=False)}")
            
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
                    self.logger.info(f"[IPIPVBaseAPI] 响应状态码: {response.status}")
                    
                    # 读取响应内容
                    content = await response.text()
                    self.logger.info(f"[IPIPVBaseAPI] 原始响应内容: {content}")
                    
                    # 处理非200状态码
                    if response.status != 200:
                        error_msg = f"API请求失败: HTTP {response.status}"
                        if content:
                            error_msg += f" - {content}"
                        self.logger.error(f"[IPIPVBaseAPI] {error_msg}")
                        return {
                            "code": response.status,
                            "msg": error_msg,
                            "data": None
                        }
                    
                    # 解析响应内容
                    try:
                        # 尝试去除 BOM 标记和前导空格
                        content = content.strip().lstrip('\ufeff')
                        
                        # 解析JSON
                        response_data = json.loads(content)
                        self.logger.info(f"[IPIPVBaseAPI] 解析后的响应内容: {json.dumps(response_data, ensure_ascii=False)}")
                        
                        # 检查响应格式
                        if not isinstance(response_data, dict):
                            self.logger.error(f"[IPIPVBaseAPI] 意外的响应格式: {response_data}")
                            return {
                                "code": -1,
                                "msg": "响应格式错误",
                                "data": None
                            }
                        
                        # 处理加密响应
                        if response_data.get("data"):
                            data = response_data.get("data")
                            if isinstance(data, str):
                                try:
                                    # 清理输入字符串，只保留有效的Base64字符
                                    cleaned_data = ''.join(c for c in data 
                                                         if c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=')
                                    # 尝试Base64解码
                                    base64.b64decode(cleaned_data)
                                    # 如果能成功解码，说明是加密数据
                                    self.logger.info("[IPIPVBaseAPI] 检测到加密响应，开始解密")
                                    decrypted_data = self._decrypt_response(cleaned_data)
                                    response_data["data"] = decrypted_data
                                except Exception as e:
                                    self.logger.info(f"[IPIPVBaseAPI] 响应未加密或解密失败: {str(e)}")
                        
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

    async def _handle_response(self, response: aiohttp.ClientResponse, raw_content: str) -> Dict[str, Any]:
        """处理API响应"""
        try:
            logger.debug(f"[IPIPVBaseAPI] 响应状态码: {response.status}")
            logger.debug(f"[IPIPVBaseAPI] 原始响应内容: {raw_content}")
            
            # 处理非200状态码
            if response.status != 200:
                error_msg = f"API请求失败: HTTP {response.status}"
                if raw_content:
                    error_msg += f" - {raw_content}"
                logger.error(f"[IPIPVBaseAPI] {error_msg}")
                return {
                    "code": response.status,
                    "msg": error_msg,
                    "data": None
                }
                
            # 尝试解析JSON响应
            try:
                result = json.loads(raw_content)
            except json.JSONDecodeError as e:
                logger.error(f"[IPIPVBaseAPI] 解析响应内容失败: {str(e)}")
                logger.error(f"[IPIPVBaseAPI] 无效的响应内容: {raw_content}")
                return {
                    "code": -1,
                    "msg": f"无效的响应格式: {str(e)}",
                    "data": None
                }
                
            # 检查响应格式
            if not isinstance(result, dict):
                logger.error(f"[IPIPVBaseAPI] 意外的响应格式: {result}")
                return {
                    "code": -1,
                    "msg": "响应格式错误",
                    "data": None
                }
                
            # 处理业务错误
            if result.get("code", -1) != 0:
                error_msg = result.get("msg", "未知错误")
                logger.error(f"[IPIPVBaseAPI] 业务错误: {error_msg}")
                return result
                
            return result
            
        except Exception as e:
            logger.error(f"[IPIPVBaseAPI] 处理响应失败: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                "code": -1,
                "msg": f"处理响应异常: {str(e)}",
                "data": None
            }
