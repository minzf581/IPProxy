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
from app.config import settings

logger = logging.getLogger(__name__)

def truncate_str(s: str, max_length: int = 20) -> str:
    """截断字符串"""
    if isinstance(s, (list, dict)):
        return f"{type(s).__name__}[{len(s)} items]"
    s = str(s)
    return s if len(s) <= max_length else f"{s[:max_length]}..."

class IPProxyService:
    def __init__(self):
        # 从配置中获取设置
        self.base_url = settings.IPPROXY_API_URL.rstrip('/')  # 移除末尾的斜杠
        self.app_key = settings.IPPROXY_APP_KEY
        self.app_secret = settings.IPPROXY_APP_SECRET
        self._mock_api = None
        
    def set_mock_api(self, mock_api):
        """设置Mock API，用于测试"""
        self._mock_api = mock_api
        
    async def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Any:
        """发送请求到IPIPV API"""
        if self._mock_api:
            return await self._mock_api._make_request(endpoint, params)
            
        try:
            # 确保 endpoint 格式正确
            endpoint = endpoint.lstrip('/')  # 移除开头的斜杠
                
            logger.info(f"[IPIPV] 开始处理请求，endpoint: {endpoint}")
            logger.info(f"[IPIPV] 原始参数: {json.dumps(params, ensure_ascii=False)}")
            
            encrypted_params = self._encrypt_params(params)
            req_id = hashlib.md5(f"{time.time()}".encode()).hexdigest()
            timestamp = str(int(time.time()))  # 使用当前时间戳
            
            request_params = {
                'version': params.get('version', 'v2'),
                'encrypt': params.get('encrypt', 'AES'),
                'appKey': self.app_key,
                'reqId': req_id,
                'timestamp': timestamp,
                'params': encrypted_params
            }
            
            sign_str = f"appKey={self.app_key}&params={encrypted_params}&timestamp={timestamp}&key={self.app_secret}"
            request_params['sign'] = hashlib.md5(sign_str.encode()).hexdigest().upper()
            
            url = f"{self.base_url}/{endpoint}"
            logger.info(f"[IPIPV] 发送请求: {url}")
            logger.info(f"[IPIPV] 请求参数: {json.dumps(request_params, ensure_ascii=False)}")
            logger.info(f"[IPIPV] 加密后参数: {encrypted_params}")
            
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
                
                if not response.is_success:
                    logger.error(f"[IPIPV] HTTP请求失败: {response.status_code}")
                    logger.error(f"[IPIPV] 响应内容: {response.text}")
                    return None
                
                try:
                    data = response.json()
                    logger.info(f"[IPIPV] 原始响应: {json.dumps(data, ensure_ascii=False)}")
                    
                    if data.get('code') != 200:
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
                        logger.info(f"[IPIPV] 解密后数据: {json.dumps(decrypted_data, ensure_ascii=False)}")
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
        """使用AES-256-CBC加密参数"""
        if params is None:
            params = {}
            
        try:
            json_params = json.dumps(params, separators=(',', ':'), ensure_ascii=False)
            key = self.app_secret.encode('utf-8')[:32]
            iv = self.app_secret.encode('utf-8')[:16]
            
            cipher = AES.new(key, AES.MODE_CBC, iv)
            padded_data = pad(json_params.encode('utf-8'), AES.block_size, style='pkcs7')
            encrypted = cipher.encrypt(padded_data)
            encrypted_params = base64.b64encode(encrypted).decode('utf-8')
            
            return encrypted_params
        except Exception as e:
            logger.error(f"加密失败: {str(e)}")
            raise
        
    def _decrypt_response(self, encrypted_text: str) -> Dict[str, Any]:
        """解密API响应数据"""
        try:
            if not encrypted_text:
                logger.warning("空加密数据")
                return None
            
            encrypted = base64.b64decode(encrypted_text)
            key = self.app_secret.encode('utf-8')[:32]
            iv = self.app_secret.encode('utf-8')[:16]
            
            cipher = AES.new(key, AES.MODE_CBC, iv)
            decrypted = unpad(cipher.decrypt(encrypted), AES.block_size, style='pkcs7')
            result = json.loads(decrypted.decode('utf-8'))
            
            return result
                
        except Exception as e:
            logger.error(f"解密失败: {str(e)}")
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
                "version": "v2",
                "encrypt": "AES"
            }
            
            # 如果指定了区域代码，添加到参数中
            if "codes" in params and params["codes"]:
                area_params["codes"] = params["codes"]
            
            logger.info(f"[IPIPV] area/v2 请求参数: {json.dumps(area_params, ensure_ascii=False)}")
            
            # 发送请求到 IPIPV API
            response = await self._make_request("app/area/v2", area_params)
            
            if response is None:
                logger.error("[IPIPV] API请求失败或返回空数据")
                return []
                
            logger.info(f"[IPIPV] 收到响应数据类型: {type(response).__name__}")
            logger.debug(f"[IPIPV] 响应数据: {json.dumps(response, ensure_ascii=False)}")
            
            # 确保响应是列表类型
            if not isinstance(response, list):
                logger.error(f"[IPIPV] 响应数据不是列表类型: {type(response)}")
                if isinstance(response, dict):
                    # 尝试从字典中获取列表
                    response = response.get('list', [])
                else:
                    return []
                
            # 转换字段名称
            result = []
            for item in response:
                if not isinstance(item, dict):
                    logger.error(f"[IPIPV] 响应项不是字典类型: {type(item)}")
                    continue
                
                result_item = {
                    "code": item.get("code"),
                    "name": item.get("name"),
                    "cname": item.get("cname", item.get("name")),
                    "children": []
                }
                
                # 如果有子项（国家列表），也转换字段名称
                children = item.get("children", [])
                if children and isinstance(children, list):
                    result_item["children"] = [
                        {
                            "code": child.get("code"),
                            "name": child.get("name"),
                            "cname": child.get("cname", child.get("name"))
                        }
                        for child in children
                        if isinstance(child, dict)
                    ]
                
                result.append(result_item)
            
            logger.info(f"[IPIPV] 处理完成，返回 {len(result)} 个区域")
            return result
            
        except Exception as e:
            logger.error(f"[IPIPV] 获取区域列表失败: {str(e)}")
            logger.error(f"[IPIPV] 错误堆栈: {traceback.format_exc()}")
            return []

    async def get_area_list(self) -> Dict[str, Any]:
        """获取地区列表"""
        try:
            return await self._make_request('open/app/area/v2', {})
        except Exception as e:
            logger.error(f"[IPProxyService] 获取地区列表失败：{str(e)}")
            raise e

    async def get_city_list(self, country_code: str) -> List[Dict[str, Any]]:
        """获取城市列表
        Args:
            country_code: 国家代码
        Returns:
            List[Dict[str, Any]]: 城市列表
        """
        try:
            if not country_code:
                logger.error("[IPProxyService] 国家代码为空")
                return []
            
            # 构造请求参数
            params = {
                "version": "v2",
                "encrypt": "AES",
                "proxyType": [104],  # 动态国外
                "countryCode": country_code,
                "appUsername": "test_user"
            }
            logger.info(f"[IPProxyService] 获取城市列表，请求参数：{params}")
            
            # 发送请求获取城市列表
            response = await self._make_request("open/app/city/list/v2", params)
            logger.info(f"[IPProxyService] 收到原始响应类型：{type(response)}")
            logger.info(f"[IPProxyService] 收到原始响应内容：{response}")
            
            if response is None:
                logger.warning(f"[IPProxyService] 获取城市列表为空，国家代码：{country_code}")
                return []
            
            # 如果响应是字典，尝试从 data 字段获取城市列表
            if isinstance(response, dict):
                response = response.get('data', [])
                if not isinstance(response, list):
                    logger.error(f"[IPProxyService] 城市列表响应格式错误：{type(response)}")
                    return []
            
            # 转换响应格式
            cities = []
            for idx, city in enumerate(response):
                if not isinstance(city, dict):
                    logger.warning(f"[IPProxyService] 跳过非字典类型的城市数据：{type(city)}")
                    continue
                
                # 记录原始城市数据
                logger.info(f"[IPProxyService] 原始城市数据 #{idx}: {city}")
                
                # 检查城市代码
                city_code = city.get("cityCode") or city.get("code", "")
                if not city_code:
                    logger.warning(f"[IPProxyService] 城市代码为空：{city}")
                    continue
                    
                # 检查城市代码是否属于指定国家
                if not city_code.startswith(country_code):
                    logger.debug(f"[IPProxyService] 跳过不属于 {country_code} 的城市：{city_code}")
                    continue
                
                # 添加城市数据
                city_data = {
                    "code": city_code,
                    "name": city.get("cityName", ""),  # 使用 cityName 字段
                    "cname": city.get("cityName", ""),  # 由于API只返回 cityName，暂时用它作为中文名
                    "cityCode": city_code,
                    "cityName": city.get("cityName", "")
                }
                cities.append(city_data)
                
                # 记录处理后的城市数据
                logger.info(f"[IPProxyService] 处理后的城市数据：{city_data}")
                    
            logger.info(f"[IPProxyService] 城市列表（{country_code}）：共 {len(cities)} 个城市")
            if cities:
                logger.info(f"[IPProxyService] 示例城市：{cities[0]}")
            
            return cities
            
        except Exception as e:
            logger.error(f"[IPProxyService] 获取城市列表失败：{str(e)}")
            logger.exception(e)
            return []

    async def get_ip_ranges(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """获取IP段列表
        Args:
            params: {
                "proxyType": int,       # 必填：代理类型 (101=静态住宅, 102=静态数据中心, 103=静态手机)
                "regionCode": str,      # 可选：区域代码
                "countryCode": str,     # 可选：国家代码
                "cityCode": str,        # 可选：城市代码
                "staticType": str,      # 可选：静态代理类型
                "appUsername": str,     # 可选：用户名
            }
        Returns:
            List[Dict[str, Any]]: IP段列表，每个IP段包含：
                - ipRange: str        # IP段
                - ipCount: int        # IP数量
                - price: float        # 价格
                - duration: int       # 时长(天)
        """
        try:
            # 验证 proxyType 参数
            proxy_type = params.get("proxyType")
            if not proxy_type:
                logger.error(f"[IPProxyService] 缺少必要参数 proxyType: {params}")
                return []
                
            # 验证是否为有效的静态代理类型
            valid_proxy_types = [101, 102, 103]  # 静态代理类型
            if proxy_type not in valid_proxy_types:
                logger.error(f"[IPProxyService] 无效的代理类型: {proxy_type}，必须是静态代理类型 (101, 102, 103)")
                return []
                
            # 构造请求参数
            request_params = {
                "version": "v2",
                "encrypt": "AES",
                "proxyType": proxy_type
            }
            
            # 添加可选参数
            optional_fields = ["regionCode", "countryCode", "cityCode", "staticType", "appUsername"]
            for field in optional_fields:
                if field in params and params[field]:  # 只添加非空的可选参数
                    request_params[field] = params[field]
                    
            logger.info(f"[IPProxyService] 获取IP段列表，请求参数：{json.dumps(request_params, ensure_ascii=False)}")
            
            # 发送请求获取IP段列表
            response = await self._make_request("open/app/area/ip-ranges/v2", request_params)
            logger.info(f"[IPProxyService] 收到原始响应类型：{type(response)}")
            logger.info(f"[IPProxyService] 收到原始响应内容：{response}")
            
            if response is None:
                logger.warning(f"[IPProxyService] 获取IP段列表为空，参数：{params}")
                return []
                
            # 如果响应是字典，尝试从 data 字段获取IP段列表
            if isinstance(response, dict):
                response = response.get('data', [])
                if not isinstance(response, list):
                    logger.error(f"[IPProxyService] IP段列表响应格式错误：{type(response)}")
                    return []
                    
            # 转换响应格式
            ip_ranges = []
            for idx, ip_range in enumerate(response):
                if not isinstance(ip_range, dict):
                    logger.warning(f"[IPProxyService] 跳过非字典类型的IP段数据：{type(ip_range)}")
                    continue
                    
                # 记录原始IP段数据
                logger.info(f"[IPProxyService] 原始IP段数据 #{idx}: {ip_range}")
                
                # 添加IP段数据
                ip_range_data = {
                    "ipRange": ip_range.get("ipRange", ""),
                    "ipCount": int(ip_range.get("ipCount", 0)),
                    "price": float(ip_range.get("price", 0)),
                    "duration": int(ip_range.get("duration", 0))
                }
                ip_ranges.append(ip_range_data)
                
                # 记录处理后的IP段数据
                logger.info(f"[IPProxyService] 处理后的IP段数据：{ip_range_data}")
                
            logger.info(f"[IPProxyService] IP段列表：共 {len(ip_ranges)} 个IP段")
            if ip_ranges:
                logger.info(f"[IPProxyService] 示例IP段：{ip_ranges[0]}")
                
            return ip_ranges
            
        except Exception as e:
            logger.error(f"[IPProxyService] 获取IP段列表失败：{str(e)}")
            logger.exception(e)
            return []
