"""
区域服务模块
==========

此模块提供所有与区域相关的功能，包括：
1. 区域列表获取
2. 城市列表获取
3. IP段列表获取
4. 地域数据同步

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
from datetime import datetime
from .ipipv_base_api import IPIPVBaseAPI
import traceback
from sqlalchemy.orm import Session
from app.models.area import Area, Country, State, City
from sqlalchemy import and_
import json

logger = logging.getLogger(__name__)

class AreaService(IPIPVBaseAPI):
    """区域服务类，处理所有区域相关的操作"""
    
    # 区域映射
    AREA_MAPPING = {
        '1': {'code': 'NA', 'name': '北美洲'},
        '2': {'code': 'EU', 'name': '欧洲'},
        '3': {'code': 'AS', 'name': '亚洲'},
        '4': {'code': 'SA', 'name': '南美洲'},
        '5': {'code': 'OC', 'name': '大洋洲'},
        '6': {'code': 'AF', 'name': '非洲'},
        '7': {'code': 'OTHER', 'name': '其他地区'}
    }

    # 州/省映射
    STATE_MAPPING = {
        'NA': [
            {'code': 'US-CA', 'name': '加利福尼亚州'},
            {'code': 'US-NY', 'name': '纽约州'},
            {'code': 'US-TX', 'name': '德克萨斯州'},
            {'code': 'CA-ON', 'name': '安大略省'},
            {'code': 'CA-BC', 'name': '不列颠哥伦比亚省'}
        ],
        'AS': [
            {'code': 'CN-GD', 'name': '广东省'},
            {'code': 'CN-JS', 'name': '江苏省'},
            {'code': 'JP-13', 'name': '东京都'},
            {'code': 'KR-11', 'name': '首尔特别市'}
        ]
    }

    # 国家映射
    COUNTRY_MAPPING = {
        'NA': [
            {'code': 'US', 'name': '美国', 'states': ['US-CA', 'US-NY', 'US-TX'], 'cities': [
                {'code': 'NYC', 'name': '纽约'},
                {'code': 'LAX', 'name': '洛杉矶'},
                {'code': 'CHI', 'name': '芝加哥'},
                {'code': 'HOU', 'name': '休斯顿'}
            ]},
            {'code': 'CA', 'name': '加拿大', 'states': ['CA-ON', 'CA-BC'], 'cities': [
                {'code': 'TOR', 'name': '多伦多'},
                {'code': 'VAN', 'name': '温哥华'},
                {'code': 'MTL', 'name': '蒙特利尔'}
            ]}
        ],
        'EU': [
            {'code': 'GB', 'name': '英国', 'cities': [
                {'code': 'LON', 'name': '伦敦'},
                {'code': 'MAN', 'name': '曼彻斯特'}
            ]},
            {'code': 'DE', 'name': '德国', 'cities': [
                {'code': 'BER', 'name': '柏林'},
                {'code': 'MUC', 'name': '慕尼黑'}
            ]},
            {'code': 'FR', 'name': '法国', 'cities': [
                {'code': 'PAR', 'name': '巴黎'},
                {'code': 'MRS', 'name': '马赛'}
            ]}
        ],
        'AS': [
            {'code': 'CN', 'name': '中国', 'states': ['CN-GD', 'CN-JS'], 'cities': [
                {'code': 'SHA', 'name': '上海'},
                {'code': 'BEI', 'name': '北京'},
                {'code': 'GUA', 'name': '广州'},
                {'code': 'SHE', 'name': '深圳'}
            ]},
            {'code': 'JP', 'name': '日本', 'states': ['JP-13'], 'cities': [
                {'code': 'TYO', 'name': '东京'},
                {'code': 'OSA', 'name': '大阪'}
            ]},
            {'code': 'KR', 'name': '韩国', 'states': ['KR-11'], 'cities': [
                {'code': 'SEL', 'name': '首尔'},
                {'code': 'PUS', 'name': '釜山'}
            ]}
        ]
    }

    # 代理配置
    proxy_configs = [
        {"proxyType": 104, "productNo": "out_dynamic_1"}  # 动态代理，这个产品有库存
    ]

    async def sync_area_data(self, db: Session) -> Dict[str, Any]:
        """同步地域数据到本地数据库"""
        try:
            logger.info("[AreaService] 开始同步地域数据")
            
            all_area_data = []
            processed_area_codes = set()  # 用于去重
            processed_country_codes = set()  # 用于去重
            processed_city_codes = set()  # 用于去重
            
            # 遍历每个代理类型获取区域数据
            for config in self.proxy_configs:
                logger.info(f"[AreaService] 开始同步代理类型 {config['proxyType']} 的区域数据")
                
                # 从IPIPV API获取最新数据
                params = {
                    "productNo": config["productNo"],
                    "proxyType": config["proxyType"]
                }
                logger.info(f"[AreaService] 请求IPIPV API，参数: {json.dumps(params, ensure_ascii=False)}")
                
                try:
                    api_response = await self._make_request(
                        "api/open/app/product/area/v2",
                        params
                    )
                    logger.info(f"[AreaService] IPIPV API响应: {json.dumps(api_response, ensure_ascii=False)}")
                    
                    if not api_response:
                        logger.warning(f"[AreaService] 代理类型 {config['proxyType']} 返回空数据")
                        continue
                        
                    if isinstance(api_response, dict) and api_response.get("code") != 200:
                        logger.error(f"[AreaService] API返回错误: {api_response.get('msg', '未知错误')}")
                        continue
                    
                    # 获取实际的区域数据
                    area_data = []
                    if isinstance(api_response, dict) and "data" in api_response:
                        area_data = api_response["data"]
                    
                    # 将扁平的数据结构转换为层级结构
                    area_map = {}  # 用于按区域分组
                    for item in area_data:
                        if not isinstance(item, dict):
                            continue
                            
                        area_code = item.get("areaCode")
                        country_code = item.get("countryCode")
                        if not area_code or not country_code:
                            continue
                            
                        # 初始化区域
                        if area_code not in area_map:
                            area_map[area_code] = {
                                "areaCode": area_code,
                                "areaName": f"Area {area_code}",  # 使用区域代码作为名称
                                "countries": {}
                            }
                            
                        # 初始化国家
                        if country_code not in area_map[area_code]["countries"]:
                            area_map[area_code]["countries"][country_code] = {
                                "countryCode": country_code,
                                "countryName": item.get("region", "").upper(),  # 使用region作为国家名称
                                "states": {},
                                "cities": []
                            }
                            
                        country = area_map[area_code]["countries"][country_code]
                        
                        # 添加州/省
                        state_code = item.get("stateCode")
                        if state_code and state_code not in country["states"]:
                            country["states"][state_code] = {
                                "stateCode": state_code,
                                "stateName": state_code  # 使用代码作为名称
                            }
                            
                        # 添加城市
                        city_code = item.get("cityCode")
                        if city_code:
                            city = {
                                "cityCode": city_code,
                                "cityName": city_code  # 使用代码作为名称
                            }
                            if city not in country["cities"]:
                                country["cities"].append(city)
                    
                    # 转换为列表格式
                    normalized_areas = []
                    for area in area_map.values():
                        area["countries"] = list(area["countries"].values())
                        for country in area["countries"]:
                            country["states"] = list(country["states"].values())
                        normalized_areas.append(area)
                    
                    all_area_data.extend(normalized_areas)
                    
                except Exception as e:
                    logger.error(f"[AreaService] 处理区域数据失败: {str(e)}")
                    logger.error(traceback.format_exc())
                    continue
            
            logger.info(f"[AreaService] 总共获取到 {len(all_area_data)} 个有效区域数据")
            
            # 开始同步数据到数据库
            try:
                # 获取现有记录
                existing_areas = {area.area_code: area for area in db.query(Area).all()}
                existing_countries = {country.country_code: country for country in db.query(Country).all()}
                existing_states = {f"{state.country_id}_{state.state_code}": state for state in db.query(State).all()}
                existing_cities = {f"{city.country_id}_{city.city_code}": city for city in db.query(City).all()}
                
                # 批量处理区域数据
                for area_info in all_area_data:
                    # 处理区域
                    area = existing_areas.get(area_info["areaCode"])
                    if not area:
                        area = Area(
                            area_code=area_info["areaCode"],
                            area_name=area_info["areaName"],
                            enable=True
                        )
                        db.add(area)
                        logger.info(f"[AreaService] 创建新区域: {area_info['areaName']}")
                    else:
                        area.area_name = area_info["areaName"]
                        area.updated_at = datetime.now()
                        logger.info(f"[AreaService] 更新区域: {area_info['areaName']}")
                    
                    db.flush()
                    
                    # 批量处理国家数据
                    for country_info in area_info["countries"]:
                        country = existing_countries.get(country_info["countryCode"])
                        if not country:
                            country = Country(
                                country_code=country_info["countryCode"],
                                country_name=country_info["countryName"],
                                area_id=area.id,
                                enable=True
                            )
                            db.add(country)
                            logger.info(f"[AreaService] 创建新国家: {country_info['countryName']}")
                        else:
                            country.country_name = country_info["countryName"]
                            country.area_id = area.id
                            country.updated_at = datetime.now()
                            logger.info(f"[AreaService] 更新国家: {country_info['countryName']}")
                        
                        db.flush()
                        
                        # 批量处理州/省数据
                        for state_info in country_info["states"]:
                            state_key = f"{country.id}_{state_info['stateCode']}"
                            state = existing_states.get(state_key)
                            if not state:
                                state = State(
                                    state_code=state_info["stateCode"],
                                    state_name=state_info["stateName"],
                                    country_id=country.id,
                                    enable=True
                                )
                                db.add(state)
                                logger.info(f"[AreaService] 创建新州/省: {state_info['stateName']}")
                            else:
                                state.state_name = state_info["stateName"]
                                state.updated_at = datetime.now()
                                logger.info(f"[AreaService] 更新州/省: {state_info['stateName']}")
                        
                        # 批量处理城市数据
                        for city_info in country_info["cities"]:
                            city_key = f"{country.id}_{city_info['cityCode']}"
                            city = existing_cities.get(city_key)
                            if not city:
                                city = City(
                                    city_code=city_info["cityCode"],
                                    city_name=city_info["cityName"],
                                    country_id=country.id,
                                    enable=True
                                )
                                db.add(city)
                                logger.info(f"[AreaService] 创建新城市: {city_info['cityName']}")
                            else:
                                city.city_name = city_info["cityName"]
                                city.updated_at = datetime.now()
                                logger.info(f"[AreaService] 更新城市: {city_info['cityName']}")
                
                db.commit()
                logger.info("[AreaService] 地域数据同步完成")
                
                return {
                    "code": 0,
                    "msg": "success",
                    "data": "地域数据同步完成"
                }
                
            except Exception as e:
                db.rollback()
                error_msg = f"同步数据到数据库失败: {str(e)}"
                logger.error(f"[AreaService] {error_msg}")
                logger.error(traceback.format_exc())
                return {
                    "code": 500,
                    "msg": error_msg,
                    "data": None
                }
            
        except Exception as e:
            error_msg = f"同步地域数据失败: {str(e)}"
            logger.error(f"[AreaService] {error_msg}")
            logger.error(traceback.format_exc())
            return {
                "code": 500,
                "msg": error_msg,
                "data": None
            }

    async def get_area_list(self, proxyType: int, productNo: str) -> Dict[str, Any]:
        """从IPIPV API获取区域列表"""
        try:
            logger.info(f"[AreaService] 开始获取区域列表: proxyType={proxyType}, productNo={productNo}")
            
            # 构建请求参数，按照API要求的顺序，proxyType 使用数组格式
            params = {
                "productNo": productNo,  # 平台产品编号
                "proxyType": [proxyType]   # 代理类型，使用数组格式
            }
            
            # 调用API
            result = await self._make_request("api/open/app/product/area/v2", params)
            logger.info(f"[AreaService] API响应: {json.dumps(result, ensure_ascii=False)}")
            
            if not result:
                logger.error("[AreaService] API返回空数据")
                return {
                    "code": 500,
                    "msg": "获取区域列表失败: API返回空数据",
                    "data": None
                }
                
            # 检查响应格式
            if isinstance(result, dict):
                if result.get("code") not in [0, 200]:
                    error_msg = result.get("msg", "未知错误")
                    logger.error(f"[AreaService] API返回错误: {error_msg}")
                    return {
                        "code": result.get("code", 500),
                        "msg": error_msg,
                        "data": None
                    }
                    
                # 获取数据部分
                data = result.get("data")
                if data is None:
                    logger.warning("[AreaService] API返回空区域数据")
                    return {
                        "code": 0,
                        "msg": "success",
                        "data": []
                    }
                    
                logger.info(f"[AreaService] 成功获取区域数据: {json.dumps(data, ensure_ascii=False)}")
                return {
                    "code": 0,
                    "msg": "success",
                    "data": data
                }
            
            logger.error(f"[AreaService] 意外的响应格式: {result}")
            return {
                "code": 500,
                "msg": "获取区域列表失败: 响应格式错误",
                "data": None
            }
            
        except Exception as e:
            logger.error(f"[AreaService] 获取区域列表失败: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                "code": 500,
                "msg": f"获取区域列表失败: {str(e)}",
                "data": None
            }
            
    async def get_city_list(self, country_code: str, db: Session) -> List[Dict[str, Any]]:
        """从本地数据库获取城市列表"""
        try:
            logger.info(f"[AreaService] 开始获取城市列表: country_code={country_code}")
            
            country = db.query(Country).filter(
                Country.country_code == country_code,
                Country.enable == True
            ).first()
            
            if not country:
                return []
            
            return [
                {
                    "cityCode": city.city_code,
                    "cityName": city.city_name
                }
                for city in country.cities
                if city.enable
            ]
            
        except Exception as e:
            logger.error(f"[AreaService] 获取城市列表失败: {str(e)}")
            return []
            
    async def get_ip_ranges(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        获取IP段列表
        
        Args:
            params: 查询参数，必须包含：
                - proxyType: 代理类型
                - countryCode: 国家代码
                - cityCode: 城市代码
                
        Returns:
            List[Dict[str, Any]]: IP段列表
        """
        try:
            logger.info(f"[AreaService] 开始获取IP段列表: params={params}")
            
            # 验证必要参数
            required_params = ["proxyType"]
            for param in required_params:
                if param not in params:
                    logger.error(f"[AreaService] 缺少必要参数: {param}")
                    return []
                    
            # 添加默认参数
            request_params = {
                "appUsername": "test_user",
                "version": "v2"
            }
            request_params.update(params)
            
            result = await self._make_request("api/open/app/product/query/v2", request_params)
            return result if isinstance(result, list) else []
            
        except Exception as e:
            logger.error(f"[AreaService] 获取IP段列表失败: {str(e)}")
            return []

def get_area_service() -> AreaService:
    """
    工厂函数，用于创建 AreaService 实例
    
    Returns:
        AreaService: 区域服务实例
    """
    return AreaService() 