import json
import time
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import requests
import os
from typing import Dict, Any, List
import aiohttp
import hashlib
import logging
import traceback
import httpx

logger = logging.getLogger(__name__)

class IPProxyService:
    def __init__(self):
        # 从环境变量获取配置，如果没有则使用默认值
        self.base_url = os.getenv('IPPROXY_API_URL', 'https://sandbox.ipipv.com')  # 使用沙箱环境作为默认值
        self.app_key = os.getenv('IPPROXY_APP_KEY', 'AK20241120145620')
        self.app_secret = os.getenv('IPPROXY_APP_SECRET', 'bf3ffghlt0hpc4omnvc2583jt0fag6a4')  # 实际的密钥
        
    async def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Any:
        """发送请求到IPIPV API"""
        try:
            # 构造基础请求参数
            request_params = {
                "version": "v2",
                "encrypt": "AES",
                "appKey": self.app_key,
                "reqId": self._generate_req_id(),
                "timestamp": str(int(time.time())),
            }

            # 加密参数
            request_params["params"] = self._encrypt_params(params)
            
            # 计算签名
            request_params["sign"] = self._generate_sign(
                request_params["timestamp"],
                request_params["params"]
            )
            
            logger.info(f"[IPIPV] 发送请求: {endpoint}, 参数: {request_params}")
            
            async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
                response = await client.post(
                    f"{self.base_url}/{endpoint}",
                    json=request_params,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                )
                
                # 检查响应状态
                response.raise_for_status()
                
                # 解析响应数据
                data = response.json()
                logger.info(f"[IPIPV] 原始响应数据: {data}")
                
                # 处理错误响应
                if data.get("code") != 0:
                    logger.error(f"[IPIPV] API错误: {data.get('msg')}")
                    return None
                
                # 解密响应数据
                encrypted_data = data.get("data")
                if not encrypted_data:
                    logger.error("[IPIPV] 响应中没有加密数据")
                    return None
                
                response_data = self._decrypt_response(encrypted_data)
                logger.info(f"[IPIPV] 解密后的响应数据: {response_data}")
                
                return response_data
                
        except Exception as e:
            logger.error(f"[IPIPV] 请求失败: {str(e)}")
            logger.error(f"[IPIPV] 错误堆栈: {traceback.format_exc()}")
            return None
            
    def _generate_req_id(self) -> str:
        """生成请求ID"""
        return hashlib.md5(str(time.time()).encode()).hexdigest()
        
    def _calculate_sign(self, params: Dict[str, Any]) -> str:
        """计算签名"""
        # 按字母顺序排序参数
        sorted_params = dict(sorted(params.items()))
        
        # 构建签名字符串
        sign_str = "&".join([f"{k}={v}" for k, v in sorted_params.items()])
        sign_str += f"&key={self.app_secret}"
        
        # 计算MD5
        return hashlib.md5(sign_str.encode()).hexdigest().upper()

    def _generate_sign(self, timestamp: str, params: str) -> str:
        """生成签名"""
        try:
            # 构造待签名字符串
            sign_str = f"appKey={self.app_key}&params={params}&timestamp={timestamp}&key={self.app_secret}"
            
            # 使用 MD5 生成签名
            sign = hashlib.md5(sign_str.encode()).hexdigest().upper()
            
            logger.debug(f"[IPProxyService] 签名生成过程:")
            logger.debug(f"[IPProxyService] - 待签名字符串: {sign_str}")
            logger.debug(f"[IPProxyService] - 生成的签名: {sign}")
            
            return sign
        except Exception as e:
            logger.error(f"[IPProxyService] 生成签名失败: {str(e)}")
            logger.error(f"[IPProxyService] 错误堆栈: {traceback.format_exc()}")
            raise
        
    def _encrypt_params(self, params: Dict[str, Any] = None) -> str:
        """使用AES-256-CBC加密参数"""
        if params is None:
            params = {}
            
        try:
            # 将参数转换为JSON字符串，确保没有空格
            json_params = json.dumps(params, separators=(',', ':'), ensure_ascii=False)
            logger.debug(f"[IPProxyService] 加密过程开始:")
            logger.debug(f"[IPProxyService] - 原始参数: {json.dumps(params, indent=2, ensure_ascii=False)}")
            logger.debug(f"[IPProxyService] - JSON字符串: {json_params}")
            
            # 使用密钥的前32字节作为加密密钥
            key = self.app_secret.encode('utf-8')[:32]
            # 使用密钥的前16字节作为IV
            iv = self.app_secret.encode('utf-8')[:16]
            
            logger.debug(f"[IPProxyService] - 密钥信息:")
            logger.debug(f"[IPProxyService] -- 密钥长度: {len(key)}")
            logger.debug(f"[IPProxyService] -- IV长度: {len(iv)}")
            
            # 创建加密器
            cipher = AES.new(key, AES.MODE_CBC, iv)
            
            # 使用PKCS7填充
            padded_data = pad(json_params.encode('utf-8'), AES.block_size, style='pkcs7')
            logger.debug(f"[IPProxyService] - 填充后数据长度: {len(padded_data)}")
            
            # 加密
            encrypted = cipher.encrypt(padded_data)
            
            # Base64编码
            encrypted_params = base64.b64encode(encrypted).decode('utf-8')
            logger.debug(f"[IPProxyService] - 加密结果: {encrypted_params}")
            logger.debug(f"[IPProxyService] - 加密结果长度: {len(encrypted_params)}")
            
            return encrypted_params
        except Exception as e:
            logger.error(f"[IPProxyService] 加密参数失败: {str(e)}")
            logger.error(f"[IPProxyService] 错误堆栈: {traceback.format_exc()}")
            raise
        
    def _decrypt_response(self, encrypted_text: str) -> Dict[str, Any]:
        """解密API响应数据"""
        try:
            logger.debug(f"[IPProxyService] 解密过程开始:")
            logger.debug(f"[IPProxyService] - 加密数据: {encrypted_text}")
            logger.debug(f"[IPProxyService] - 加密数据长度: {len(encrypted_text)}")
            
            # 处理空响应
            if not encrypted_text:
                logger.warning("[IPProxyService] 收到空的加密数据")
                return None
            
            # Base64解码
            try:
                encrypted = base64.b64decode(encrypted_text)
            except Exception as e:
                logger.error(f"[IPProxyService] Base64解码失败: {str(e)}")
                return None
                
            logger.debug(f"[IPProxyService] - Base64解码后长度: {len(encrypted)}")
            
            # 使用密钥的前32字节作为解密密钥
            key = self.app_secret.encode('utf-8')[:32]
            # 使用密钥的前16字节作为IV
            iv = self.app_secret.encode('utf-8')[:16]
            
            logger.debug(f"[IPProxyService] - 解密密钥信息:")
            logger.debug(f"[IPProxyService] -- 密钥长度: {len(key)}")
            logger.debug(f"[IPProxyService] -- IV长度: {len(iv)}")
            
            # 创建解密器
            cipher = AES.new(key, AES.MODE_CBC, iv)
            
            try:
                # 解密并去除填充
                decrypted = unpad(cipher.decrypt(encrypted), AES.block_size, style='pkcs7')
                
                # 解析JSON
                result = json.loads(decrypted.decode('utf-8'))
                logger.debug(f"[IPProxyService] - 解密结果: {json.dumps(result, indent=2, ensure_ascii=False)}")
                return result
            except Exception as e:
                logger.error(f"[IPProxyService] 解密或JSON解析失败: {str(e)}")
                return None
                
        except Exception as e:
            logger.error(f"[IPProxyService] 解密响应失败: {str(e)}")
            logger.error(f"[IPProxyService] 错误堆栈: {traceback.format_exc()}")
            return None
            
    async def create_proxy_user(self, params: dict) -> dict:
        """创建代理用户"""
        return await self._make_request('/api/open/app/proxy/user/v2', params)

    async def update_proxy_user(self, params: dict) -> dict:
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
        logger.info(f"[IPProxyService] 更新代理用户，参数：{json.dumps(params, indent=2, ensure_ascii=False)}")
        try:
            response = await self._make_request('/api/open/app/proxy/user/v2', params)
            logger.info(f"[IPProxyService] API响应：{json.dumps(response, indent=2, ensure_ascii=False)}")
            return response
        except Exception as e:
            logger.error(f"[IPProxyService] 更新代理用户失败：{str(e)}")
            raise e

    async def get_app_info(self) -> Dict[str, Any]:
        """获取应用信息（余额、总充值、总消费）"""
        return await self._make_request('/api/open/app/proxy/info/v2')

    async def get_statistics(self) -> Dict[str, Any]:
        """获取流量使用统计"""
        try:
            data = await self._make_request('/api/open/app/proxy/flow/use/log/v2', {})
            return {
                'monthlyUsage': data.get('monthlyUsage', 0),
                'dailyUsage': data.get('dailyUsage', 0),
                'lastMonthUsage': data.get('lastMonthUsage', 0)
            }
        except Exception as e:
            logger.error(f"[IPProxyService] 获取流量统计失败: {str(e)}")
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

    async def create_dynamic_proxy(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """创建动态代理
        Args:
            params: {
                'username': str,      # 必填：用户名
                'poolType': str,      # 必填：代理池类型
                'traffic': int,       # 必填：流量大小(GB)
                'orderNo': str,       # 必填：订单号
            }
        Returns:
            Dict[str, Any]: {
                'code': int,          # 状态码
                'msg': str,           # 消息
                'data': {             # 代理信息
                    'proxyHost': str, # 代理主机
                    'proxyPort': int, # 代理端口
                    'username': str,  # 用户名
                    'password': str,  # 密码
                }
            }
        """
        endpoint = '/api/open/app/proxy/dynamic/v2'
        try:
            logger.info(f"[IPProxyService] 创建动态代理，参数：{json.dumps(params, indent=2, ensure_ascii=False)}")
            response = await self._make_request(endpoint, params)
            logger.info(f"[IPProxyService] API响应：{json.dumps(response, indent=2, ensure_ascii=False)}")
            return response
        except Exception as e:
            logger.error(f"[IPProxyService] 创建动态代理失败：{str(e)}")
            raise e

    async def create_static_proxy(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """创建静态代理
        Args:
            params: {
                'username': str,      # 必填：用户名
                'region': str,        # 必填：地区
                'country': str,       # 必填：国家
                'city': str,          # 必填：城市
                'staticType': str,    # 必填：静态代理类型
                'ipRange': str,       # 必填：IP范围
                'duration': int,      # 必填：时长(天)
                'quantity': int,      # 必填：数量
                'orderNo': str,       # 必填：订单号
            }
        Returns:
            Dict[str, Any]: {
                'code': int,          # 状态码
                'msg': str,           # 消息
                'data': {             # 代理信息
                    'proxyHost': str, # 代理主机
                    'proxyPort': int, # 代理端口
                    'username': str,  # 用户名
                    'password': str,  # 密码
                }
            }
        """
        endpoint = '/api/open/app/proxy/static/v2'
        try:
            logger.info(f"[IPProxyService] 创建静态代理，参数：{json.dumps(params, indent=2, ensure_ascii=False)}")
            response = await self._make_request(endpoint, params)
            logger.info(f"[IPProxyService] API响应：{json.dumps(response, indent=2, ensure_ascii=False)}")
            return response
        except Exception as e:
            logger.error(f"[IPProxyService] 创建静态代理失败：{str(e)}")
            raise e

    async def get_area_v2(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        获取区域列表 V2
        
        Args:
            params: 请求参数
                - codes: Optional[List[str]] 区域代码列表,为空获取全部
                
        Returns:
            List[Dict[str, Any]]: 区域列表
        """
        try:
            # 构造区域请求参数
            area_params = {
                "type": 1  # 1=获取国家列表
            }
            
            # 如果指定了区域代码，添加到参数中
            if "codes" in params and params["codes"]:
                area_params["code"] = params["codes"][0]
            elif "code" in params:
                area_params["code"] = params["code"]
            elif "areaCode" in params:
                area_params["code"] = params["areaCode"]
            
            logger.info(f"[IPIPV] area/v2 请求参数处理: 原始参数={params}, 处理后参数={area_params}")
            
            # 发送请求到 IPIPV API
            response_data = await self._make_request("api/open/app/area/v2", area_params)
            logger.info(f"[IPIPV] API响应数据: {response_data}")
            
            if not response_data:
                logger.error("[IPIPV] 没有收到响应数据")
                return []
            
            if not isinstance(response_data, list):
                logger.error(f"[IPIPV] 响应数据不是列表类型: {type(response_data)}")
                if isinstance(response_data, dict):
                    # 如果是字典，尝试获取列表数据
                    response_data = response_data.get("list", [])
                else:
                    return []
                
            # 转换字段名称
            result = []
            for item in response_data:
                if not isinstance(item, dict):
                    logger.error(f"[IPIPV] 响应项不是字典类型: {type(item)}")
                    continue
                
                logger.info(f"[IPIPV] 处理响应项: {item}")
                    
                result_item = {
                    "areaCode": item.get("code"),
                    "areaName": item.get("name"),
                    "countryList": []
                }
                
                # 如果有子项（国家列表），也转换字段名称
                children = item.get("children", [])
                logger.info(f"[IPIPV] 子项数据: {children}")
                
                if children and isinstance(children, list):
                    result_item["countryList"] = [
                        {
                            "countryCode": child.get("code"),
                            "countryName": child.get("name")
                        }
                        for child in children
                        if isinstance(child, dict)
                    ]
                    logger.info(f"[IPIPV] 转换后的国家列表: {result_item['countryList']}")
                else:
                    logger.warning(f"[IPIPV] 无效的子项数据: {children}")
                
                result.append(result_item)
            
            # 如果指定了区域代码，只返回匹配的区域
            if area_params.get("code"):
                target_code = area_params["code"]
                logger.info(f"[IPIPV] 查找目标区域: {target_code}")
                for item in result:
                    if item["areaCode"] == target_code:
                        logger.info(f"[IPIPV] 找到匹配区域: {item}")
                        return [item]
                logger.warning(f"[IPIPV] 未找到匹配区域: {target_code}")
                return []
            
            logger.info(f"[IPIPV] 返回所有区域: {result}")
            return result
            
        except Exception as e:
            logger.error(f"获取区域列表失败: {str(e)}")
            logger.error(f"[IPIPV] 错误堆栈: {traceback.format_exc()}")
            return []

    async def get_area_list(self) -> Dict[str, Any]:
        """获取地区列表"""
        try:
            return await self._make_request('open/app/area/v2', {})
        except Exception as e:
            logger.error(f"[IPProxyService] 获取地区列表失败：{str(e)}")
            raise e
