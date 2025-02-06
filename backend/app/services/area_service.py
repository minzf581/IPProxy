"""
区域服务模块
==========

此模块处理所有与地理区域相关的功能，包括：
1. 区域列表获取
2. 城市列表获取
3. 地理位置查询
4. IP段列表获取

此模块继承自IPIPVBaseAPI，使用其提供的基础通信功能。

使用示例：
--------
```python
area_service = AreaService()
areas = await area_service.get_area_list()
```

注意事项：
--------
1. 所有方法都应该使用异步调用
2. 确保正确处理错误情况
3. 添加必要的日志记录
"""

import logging
from typing import Dict, Any, List, Optional
from .ipipv_base_api import IPIPVBaseAPI
import time
import json

logger = logging.getLogger(__name__)

class AreaService(IPIPVBaseAPI):
    """区域服务类，处理所有地理区域相关的操作"""
    
    async def get_area_list(self, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        获取区域列表
        
        Args:
            params: 可选的请求参数
                - codes: 获取地域代码对应列表，为null获取全部
            
        Returns:
            list: 区域列表，包含区域代码和名称
                - code: 地域代码
                - name: 地域名称
                - cname: 地域中文名
                - children: 下级地域
        """
        try:
            logger.info("[区域服务] 开始获取区域列表")
            
            # 构建请求参数
            request_params = {
                "codes": params.get("codes", []) if params else []  # 获取地域代码列表，默认为空数组获取全部
            }
            
            # 记录请求信息
            logger.info(f"[区域服务] 请求参数: {json.dumps(request_params, ensure_ascii=False)}")
            logger.info(f"[区域服务] 请求URL: {self.base_url}/api/open/app/area/v2")
            
            # 调用基础请求方法
            result = await self._make_request("api/open/app/area/v2", request_params)
            
            logger.info(f"[区域服务] API响应原始数据: {json.dumps(result, ensure_ascii=False) if result else None}")
            
            if result is None:
                logger.error("[区域服务] API请求返回空结果")
                return []
                
            if isinstance(result, list):
                logger.info(f"[区域服务] 成功获取区域列表，数量: {len(result)}")
                # 验证返回数据格式
                validated_result = []
                for area in result:
                    if isinstance(area, dict) and "code" in area:
                        validated_area = {
                            "code": area.get("code", ""),
                            "name": area.get("name", ""),
                            "cname": area.get("cname", ""),
                            "children": []
                        }
                        # 处理子区域
                        if "children" in area and isinstance(area["children"], list):
                            validated_area["children"] = [
                                {
                                    "code": child.get("code", ""),
                                    "name": child.get("name", ""),
                                    "cname": child.get("cname", "")
                                }
                                for child in area["children"]
                                if isinstance(child, dict) and "code" in child
                            ]
                        validated_result.append(validated_area)
                return validated_result
            elif isinstance(result, dict):
                logger.info("[区域服务] 获取到单个区域信息")
                if "code" in result:
                    return [{
                        "code": result.get("code", ""),
                        "name": result.get("name", ""),
                        "cname": result.get("cname", ""),
                        "children": []
                    }]
                return []
            else:
                logger.warning(f"[区域服务] 未知的响应格式: {type(result)}")
                return []
                
        except Exception as e:
            logger.error(f"[区域服务] 获取区域列表失败: {str(e)}", exc_info=True)
            return []
    
    async def get_city_list(self, country_code: str) -> List[Dict[str, Any]]:
        """
        获取城市列表
        
        Args:
            country_code: 国家代码
            
        Returns:
            list: 城市列表，包含以下字段：
                - cityCode: 城市代码
                - cityName: 城市中文名称
                - stateCode: 省、州代码
                - stateName: 省、州中文名称
                - countryCode: 国家代码
                - countryName: 国家中文名称
                - areaCode: 洲代码
                - areaName: 洲中文名称
                - status: 状态 1=正常
        """
        try:
            if not country_code:
                logger.error("[城市服务] 国家代码为空")
                return []
            
            logger.info(f"[城市服务] 开始获取城市列表: country_code={country_code}")
            
            # 构建请求参数
            request_params = {
                "countryCode": country_code,  # 使用countryCode作为参数名
                "appUsername": "test_user"  # 添加appUsername参数
            }
            
            logger.info(f"[城市服务] 请求参数: {json.dumps(request_params, ensure_ascii=False)}")
            logger.info(f"[城市服务] 请求URL: {self.base_url}/api/open/app/city/list/v2")
            
            # 调用基础请求方法
            result = await self._make_request("api/open/app/city/list/v2", request_params)
            
            logger.info(f"[城市服务] API响应原始数据: {json.dumps(result, ensure_ascii=False) if result else None}")
            
            if result is None:
                logger.error("[城市服务] API请求返回空结果")
                return []
                
            if isinstance(result, list):
                logger.info(f"[城市服务] 成功获取城市列表，数量: {len(result)}")
                # 验证返回数据格式并过滤城市
                validated_result = []
                for city in result:
                    if not isinstance(city, dict):
                        logger.warning(f"[城市服务] 跳过非字典类型的城市数据：{type(city)}")
                        continue
                        
                    # 检查城市代码
                    city_code = city.get("cityCode", "")
                    if not city_code:
                        logger.warning(f"[城市服务] 城市代码为空：{city}")
                        continue
                        
                    # 检查城市代码是否属于指定国家
                    if not city_code.startswith(country_code):
                        logger.debug(f"[城市服务] 跳过不属于 {country_code} 的城市：{city_code}")
                        continue
                    
                    validated_city = {
                        "cityCode": city_code,
                        "cityName": city.get("cityName", ""),
                        "stateCode": city.get("stateCode", ""),
                        "stateName": city.get("stateName", ""),
                        "countryCode": city.get("countryCode", country_code),
                        "countryName": city.get("countryName", ""),
                        "areaCode": city.get("areaCode", ""),
                        "areaName": city.get("areaName", ""),
                        "status": city.get("status", 1)
                    }
                    validated_result.append(validated_city)
                    logger.info(f"[城市服务] 添加城市: {json.dumps(validated_city, ensure_ascii=False)}")
                    
                logger.info(f"[城市服务] 过滤后的城市列表数量: {len(validated_result)}")
                return validated_result
                
            elif isinstance(result, dict) and "cityCode" in result:
                logger.info("[城市服务] 获取到单个城市信息")
                city_code = result.get("cityCode", "")
                
                # 检查单个城市是否属于指定国家
                if not city_code.startswith(country_code):
                    logger.debug(f"[城市服务] 跳过不属于 {country_code} 的城市：{city_code}")
                    return []
                    
                return [{
                    "cityCode": city_code,
                    "cityName": result.get("cityName", ""),
                    "stateCode": result.get("stateCode", ""),
                    "stateName": result.get("stateName", ""),
                    "countryCode": result.get("countryCode", country_code),
                    "countryName": result.get("countryName", ""),
                    "areaCode": result.get("areaCode", ""),
                    "areaName": result.get("areaName", ""),
                    "status": result.get("status", 1)
                }]
            else:
                logger.warning(f"[城市服务] 未知的响应格式: {type(result)}")
                return []
                
        except Exception as e:
            logger.error(f"[城市服务] 获取城市列表失败: {str(e)}", exc_info=True)
            return []
    
    async def get_area_by_code(self, area_code: str) -> Optional[Dict[str, Any]]:
        """
        根据区域代码获取区域信息
        
        Args:
            area_code: 区域代码
            
        Returns:
            dict: 区域详细信息
            None: 获取失败
        """
        try:
            logger.info(f"获取区域信息: area_code={area_code}")
            params = {
                "code": area_code,
                "appKey": self.app_key,
                "version": "v2",
                "encrypt": "AES"
            }
            result = await self._make_request("api/open/app/area/v2", params)
            if isinstance(result, list) and len(result) > 0:
                return result[0]
            return None
        except Exception as e:
            logger.error(f"获取区域信息失败: {str(e)}")
            return None
    
    async def get_city_info(self, city_code: str) -> Optional[Dict[str, Any]]:
        """
        获取城市详细信息
        
        Args:
            city_code: 城市代码
            
        Returns:
            dict: 城市详细信息
            None: 获取失败
        """
        try:
            logger.info(f"获取城市信息: city_code={city_code}")
            country_code = city_code[:2]  # 假设城市代码前两位是国家代码
            cities = await self.get_city_list(country_code)
            
            for city in cities:
                if city.get("cityCode") == city_code:
                    return city
            return None
        except Exception as e:
            logger.error(f"获取城市信息失败: {str(e)}")
            return None
    
    async def get_ip_ranges(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        获取IP段列表
        
        Args:
            params: 请求参数
                - proxyType: 代理类型 (101=静态云平台, 102=静态国内家庭, 103=静态国外家庭)
                - regionCode: 区域代码
                - countryCode: 国家代码
                - cityCode: 城市代码
                - staticType: 静态代理类型
                - version: API版本
            
        Returns:
            list: IP段列表，包含以下字段：
                - ipStart: 起始IP
                - ipEnd: 结束IP
                - ipCount: IP数量
                - stock: 库存数量
                - staticType: 静态代理类型
        """
        try:
            logger.info("[IP段服务] 开始获取IP段列表")
            logger.info(f"[IP段服务] 原始请求参数: {json.dumps(params, ensure_ascii=False)}")
            
            # 验证和规范化参数
            if 'proxyType' not in params:
                logger.error("[IP段服务] 缺少必要参数: proxyType")
                return []
            
            # 规范化参数
            normalized_params = {
                "proxyType": params["proxyType"],
                "version": params.get("version", "v2")
            }
            
            # 处理国家代码 (转换为两字母代码)
            if "countryCode" in params:
                country_code = params["countryCode"]
                if len(country_code) > 2:
                    country_code = country_code[:2]  # 取前两位
                normalized_params["countryCode"] = country_code.upper()
            
            # 处理城市代码
            if "cityCode" in params:
                city_code = params["cityCode"]
                if len(city_code) > 9:  # 假设城市代码最长9位
                    city_code = city_code[:9]
                normalized_params["cityCode"] = city_code.upper()
            
            # 处理区域代码
            if "regionCode" in params:
                normalized_params["regionCode"] = str(params["regionCode"])
            
            # 处理静态类型
            if "staticType" in params:
                normalized_params["staticType"] = str(params["staticType"])
            
            logger.info(f"[IP段服务] 规范化后的参数: {json.dumps(normalized_params, ensure_ascii=False)}")
            
            # 调用基础请求方法
            result = await self._make_request("api/open/app/product/query/v2", normalized_params)
            
            logger.info(f"[IP段服务] API响应原始数据: {json.dumps(result, ensure_ascii=False) if result else None}")
            
            if result is None:
                logger.error("[IP段服务] API请求返回空结果")
                return []
                
            if isinstance(result, list):
                logger.info(f"[IP段服务] 成功获取IP段列表，数量: {len(result)}")
                # 验证返回数据格式
                validated_result = []
                for ip_range in result:
                    if isinstance(ip_range, dict):
                        validated_ip_range = {
                            "ipStart": ip_range.get("ipStart", ""),
                            "ipEnd": ip_range.get("ipEnd", ""),
                            "ipCount": ip_range.get("ipCount", 0),
                            "stock": ip_range.get("stock", 0),
                            "staticType": ip_range.get("staticType", "")
                        }
                        validated_result.append(validated_ip_range)
                return validated_result
            else:
                logger.warning(f"[IP段服务] 未知的响应格式: {type(result)}")
                return []
                
        except Exception as e:
            logger.error(f"[IP段服务] 获取IP段列表失败: {str(e)}", exc_info=True)
            return []