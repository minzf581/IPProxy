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
from typing import Dict, Any, Optional, Union
from datetime import datetime
from app.config import settings
from app.utils.logging_utils import truncate_response
import hashlib

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
        _mock_api: 测试模式下的模拟API
    """
    
    def __init__(self):
        """初始化基础服务"""
        logger.info("[IPIPVBaseAPI] 初始化服务")
        self.base_url = settings.IPPROXY_API_URL.rstrip('/')
        self.app_key = settings.IPPROXY_APP_KEY
        self.app_secret = settings.IPPROXY_APP_SECRET
        self._mock_api = None
        
        # 测试模式配置
        if settings.TESTING:
            from app.tests.mocks.ipproxy_api import MockIPIPVAPI
            self._mock_api = MockIPIPVAPI()
            logger.info("[IPIPVBaseAPI] 使用测试模式")
    
    def set_mock_api(self, mock_api):
        """
        设置模拟API（仅用于测试）
        
        Args:
            mock_api: 模拟API实例
        """
        self._mock_api = mock_api
    
    async def _make_request(
        self, 
        endpoint: str, 
        params: Optional[Dict[str, Any]] = None
    ) -> Union[Dict[str, Any], None]:
        """
        发送API请求的核心方法
        
        Args:
            endpoint (str): API端点
            params (dict, optional): 请求参数
            
        Returns:
            dict: 解密后的响应数据
            None: 请求失败
            
        Raises:
            Exception: 请求过程中的任何异常
        """
        try:
            # 确保 endpoint 格式正确
            endpoint = endpoint.lstrip('/')  # 移除开头的斜杠
            
            # 确保 params 不为 None
            if params is None:
                params = {}
                
            logger.info(f"[IPIPV] 开始处理请求，endpoint: {endpoint}")
            logger.info(f"[IPIPV] 原始参数: {json.dumps(params, ensure_ascii=False)}")
            logger.info(f"[IPIPV] 使用的 base_url: {self.base_url}")
            logger.info(f"[IPIPV] 使用的 app_key: {self.app_key}")
            
            # 加密业务参数
            encrypted_params = self._encrypt_params(params)
            req_id = hashlib.md5(f"{time.time()}".encode()).hexdigest()
            timestamp = str(int(time.time()))  # 使用当前时间戳
            
            # 构建请求参数
            request_params = {
                'version': params.get('version', 'v2'),
                'encrypt': params.get('encrypt', 'AES'),
                'appKey': self.app_key,
                'reqId': req_id,
                'timestamp': timestamp,
                'params': encrypted_params
            }
            
            # 生成签名
            sign_str = f"appKey={self.app_key}&params={encrypted_params}&timestamp={timestamp}&key={self.app_secret}"
            request_params['sign'] = hashlib.md5(sign_str.encode()).hexdigest().upper()
            
            url = f"{self.base_url}/{endpoint}"
            logger.info(f"[IPIPV] 完整请求 URL: {url}")
            logger.info(f"[IPIPV] 完整请求参数: {json.dumps(request_params, ensure_ascii=False)}")
            logger.info(f"[IPIPV] 签名字符串: {sign_str}")
            logger.info(f"[IPIPV] 计算的签名: {request_params['sign']}")
            
            # 发送请求
            async with httpx.AsyncClient(verify=False) as client:
                response = await client.post(
                    url,
                    json=request_params,
                    headers={
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                )
                
                logger.info(f"[IPIPV] 响应状态码: {response.status_code}")
                logger.info(f"[IPIPV] 响应头: {dict(response.headers)}")
                logger.info(f"[IPIPV] 完整响应内容: {response.text}")
                
                if not response.is_success:
                    logger.error(f"[IPIPV] HTTP请求失败: {response.status_code}")
                    logger.error(f"[IPIPV] 响应内容: {response.text}")
                    return None
                
                try:
                    data = response.json()
                    logger.info(f"[IPIPV] 解析后的响应: {json.dumps(data, ensure_ascii=False)}")
                    
                    if data.get('code') != 0 and data.get('msg') != "OK":
                        logger.error(f"[IPIPV] API错误: {data.get('msg')}")
                        return None
                        
                    encrypted_data = data.get('data')
                    if not encrypted_data:
                        logger.error("[IPIPV] 响应中没有加密数据")
                        return None
                        
                    try:
                        decrypted_data = self._decrypt_response(encrypted_data)
                        if decrypted_data is None:
                            logger.error("[IPIPV] 解密数据为空")
                            return None
                            
                        logger.info(f"[IPIPV] 解密后数据类型: {type(decrypted_data)}")
                        logger.info(f"[IPIPV] 完整解密后数据: {json.dumps(decrypted_data, ensure_ascii=False)}")
                        return decrypted_data
                        
                    except Exception as e:
                        logger.error(f"[IPIPV] 解密失败: {str(e)}")
                        logger.error(f"[IPIPV] 错误堆栈: {traceback.format_exc()}")
                        return None
                        
                except json.JSONDecodeError as e:
                    logger.error(f"[IPIPV] JSON解析错误: {str(e)}")
                    logger.error(f"[IPIPV] 响应内容: {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"[IPIPV] 请求失败: {str(e)}")
            logger.error(f"[IPIPV] 错误堆栈: {traceback.format_exc()}")
            return None
    
    def _encrypt_params(self, params: Dict[str, Any] = None) -> str:
        """
        加密请求参数
        
        Args:
            params (dict, optional): 要加密的参数
            
        Returns:
            str: Base64编码的加密字符串
            
        Raises:
            Exception: 加密过程中的任何异常
        """
        try:
            # 确保有参数字典
            if params is None:
                params = {}
            
            # 移除不需要加密的参数
            params_to_encrypt = params.copy()
            for key in ['version', 'encrypt', 'appKey', 'reqId', 'timestamp', 'sign']:
                params_to_encrypt.pop(key, None)
            
            logger.info(f"[加密] 待加密参数: {json.dumps(params_to_encrypt, ensure_ascii=False)}")
            
            # 转换为JSON字符串
            json_params = json.dumps(
                params_to_encrypt, 
                separators=(',', ':'), 
                ensure_ascii=False
            )
            
            logger.info(f"[加密] JSON字符串: {json_params}")
            logger.info(f"[加密] 参数字节长度: {len(json_params.encode('utf-8'))}")
            
            # 准备加密密钥和IV
            key = self.app_secret.encode('utf-8')[:32]
            iv = self.app_secret.encode('utf-8')[:16]
            
            logger.info(f"[加密] 密钥长度: {len(key)}, IV长度: {len(iv)}")
            
            # 执行加密
            cipher = AES.new(key, AES.MODE_CBC, iv)
            padded_data = pad(
                json_params.encode('utf-8'), 
                AES.block_size, 
                style='pkcs7'
            )
            
            logger.info(f"[加密] 填充后数据长度: {len(padded_data)}")
            
            encrypted = cipher.encrypt(padded_data)
            logger.info(f"[加密] 加密后数据长度: {len(encrypted)}")
            
            # Base64编码
            encoded = base64.b64encode(encrypted).decode('ascii')
            logger.info(f"[加密] Base64编码后长度: {len(encoded)}")
            logger.info(f"[加密] Base64编码结果前100字符: {encoded[:100]}...")
            
            return encoded
            
        except Exception as e:
            logger.error(f"[加密] 参数加密失败: {str(e)}")
            logger.error(f"[加密] 错误堆栈: {traceback.format_exc()}")
            raise
    
    def _decrypt_response(self, encrypted_text: str) -> Optional[Dict[str, Any]]:
        """
        解密API响应
        
        Args:
            encrypted_text (str): Base64编码的加密响应
            
        Returns:
            dict: 解密后的响应数据
            None: 解密失败
            
        Raises:
            Exception: 解密过程中的任何异常
        """
        try:
            if not encrypted_text:
                return None
            
            # 清理输入字符串
            cleaned_text = ''.join(
                c for c in encrypted_text 
                if c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
            )
            
            # Base64解码
            encrypted = base64.b64decode(cleaned_text)
            
            # 准备解密密钥和IV
            key = self.app_secret.encode('utf-8')[:32]
            iv = self.app_secret.encode('utf-8')[:16]
            
            # 执行解密
            cipher = AES.new(key, AES.MODE_CBC, iv)
            decrypted = unpad(
                cipher.decrypt(encrypted), 
                AES.block_size, 
                style='pkcs7'
            )
            
            # 尝试不同编码方式
            for encoding in ['utf-8', 'latin1', 'ascii']:
                try:
                    decrypted_text = decrypted.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                return None
            
            # 解析JSON
            result = json.loads(decrypted_text)
            return result if isinstance(result, (dict, list)) else None
            
        except Exception as e:
            logger.error(f"[IPIPV] 解密失败: {str(e)}")
            logger.error(f"[IPIPV] 错误堆栈: {traceback.format_exc()}")
            return None 