"""
IP代理服务基础类
==============

警告：
-----
此文件包含核心的基础功能，修改需要特别谨慎。
包含：
1. 加密解密
2. HTTP请求
3. 错误处理
4. 日志记录

这些功能已经过严格测试和生产环境验证。
"""

import json
import time
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import httpx
import logging
import traceback
from typing import Dict, Any
from datetime import datetime
from app.config import settings
from app.utils.logging_utils import truncate_response

logger = logging.getLogger(__name__)

def truncate_str(s: str, max_length: int = 20) -> str:
    """截断字符串"""
    if isinstance(s, (list, dict)):
        return f"{type(s).__name__}[{len(s)} items]"
    s = str(s)
    return s if len(s) <= max_length else f"{s[:max_length]}..."

class BaseIPProxyService:
    """IP代理服务基础类"""
    
    def __init__(self):
        """
        初始化基础服务
        
        警告：
        ----
        这些是核心配置，修改需要同步更新前端配置
        """
        logger.info("[BaseIPProxyService] Initializing service")
        self.base_url = settings.IPPROXY_API_URL.rstrip('/')
        self.app_key = settings.IPPROXY_APP_KEY
        self.app_secret = settings.IPPROXY_APP_SECRET
        self._mock_api = None
        
        if settings.TESTING:
            from app.tests.mocks.ipproxy_api import MockIPIPVAPI
            self._mock_api = MockIPIPVAPI()
            logger.info("[BaseIPProxyService] Using mock API for testing")
            
    def set_mock_api(self, mock_api):
        """设置mock API"""
        self._mock_api = mock_api
        
    async def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Any:
        """
        发送API请求的核心方法
        
        警告：此方法已经过严格测试，修改需要特别谨慎
        """
        request_id = f"req_{datetime.now().strftime('%Y%m%d%H%M%S')}_{id(self)}"
        try:
            logger.info(f"[{request_id}] 开始请求 {endpoint}")
            logger.debug(f"[{request_id}] 原始参数: {params}")
            
            if self._mock_api:
                return await self._mock_api._make_request(endpoint, params)
            
            # 构建基础请求参数
            request_params = {
                "version": "v2",
                "encrypt": "AES",
                "timestamp": str(int(time.time())),
                "reqId": request_id,
                "appKey": self.app_key  # 确保appKey在加密参数中
            }
            
            # 合并用户参数
            if params:
                user_params = params.copy()
                # 移除可能存在的系统参数，避免冲突
                for key in ['version', 'encrypt', 'timestamp', 'reqId']:
                    user_params.pop(key, None)
                request_params.update(user_params)
            
            # 加密参数
            encrypted_params = self._encrypt_params(request_params)
            
            # 构建最终请求数据
            post_data = {
                "params": encrypted_params,
                "appKey": self.app_key  # 外层也需要appKey
            }
            
            # 发送请求
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/{endpoint}",
                    data=post_data,
                    headers={
                        "Content-Type": "application/x-www-form-urlencoded",
                        "X-App-Key": self.app_key
                    }
                )
            
            response_text = response.text
            logger.debug(f"[{request_id}] 响应内容: {truncate_str(response_text)}")
            
            try:
                response_data = response.json()
                if response_data.get("code") != 0:
                    logger.error(f"[{request_id}] API错误: {response_data.get('msg')}")
                    return None
                
                encrypted_response = response_data.get("data")
                if not encrypted_response:
                    return None
                
                return self._decrypt_response(encrypted_response)
                
            except json.JSONDecodeError as e:
                logger.error(f"[{request_id}] JSON解析失败: {str(e)}")
                return None
                
        except Exception as e:
            logger.error(f"[{request_id}] 请求失败: {str(e)}")
            logger.exception(e)
            return None
            
    def _encrypt_params(self, params: Dict[str, Any] = None) -> str:
        """
        加密请求参数
        
        警告：此方法包含核心加密逻辑，修改需要特别谨慎
        """
        if params is None:
            params = {}
            
        try:
            # 确保appKey在加密参数中
            params_to_encrypt = params.copy()
            if 'appKey' not in params_to_encrypt:
                params_to_encrypt['appKey'] = self.app_key
                
            # 移除不需要加密的系统参数
            for key in ['version', 'encrypt', 'reqId', 'timestamp', 'sign']:
                params_to_encrypt.pop(key, None)
                
            # 按照API要求，将参数转换为JSON字符串
            json_params = json.dumps(params_to_encrypt, separators=(',', ':'), ensure_ascii=True)
            
            # 使用AES-CBC模式加密
            key = self.app_secret.encode('utf-8')[:32]
            iv = self.app_secret.encode('utf-8')[:16]
            
            cipher = AES.new(key, AES.MODE_CBC, iv)
            padded_data = pad(json_params.encode('utf-8'), AES.block_size, style='pkcs7')
            encrypted = cipher.encrypt(padded_data)
            
            # 返回Base64编码的加密结果
            return base64.b64encode(encrypted).decode('ascii')
            
        except Exception as e:
            logger.error(f"[IPIPV] 加密失败: {str(e)}")
            logger.error(f"[IPIPV] 错误堆栈: {traceback.format_exc()}")
            raise
            
    def _decrypt_response(self, encrypted_text: str) -> Dict[str, Any]:
        """
        解密API响应
        
        警告：此方法包含核心解密逻辑，修改需要特别谨慎
        """
        try:
            if not encrypted_text:
                return None
            
            # 清理输入字符串
            cleaned_text = ''.join(c for c in encrypted_text 
                                 if c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=')
            encrypted = base64.b64decode(cleaned_text)
            
            key = self.app_secret.encode('utf-8')[:32]
            iv = self.app_secret.encode('utf-8')[:16]
            
            cipher = AES.new(key, AES.MODE_CBC, iv)
            decrypted = unpad(cipher.decrypt(encrypted), AES.block_size, style='pkcs7')
            
            # 尝试不同编码方式
            for encoding in ['utf-8', 'latin1', 'ascii']:
                try:
                    decrypted_text = decrypted.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                return None
            
            result = json.loads(decrypted_text)
            return result if isinstance(result, (dict, list)) else None
            
        except Exception as e:
            logger.error(f"[IPIPV] 解密失败: {str(e)}")
            logger.error(f"[IPIPV] 错误堆栈: {traceback.format_exc()}")
            return None 