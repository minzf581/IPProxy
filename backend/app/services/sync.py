from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.region import Region, Country, City
import logging
import json
import traceback
from app.services import AreaService
import asyncio

logger = logging.getLogger(__name__)
area_service = AreaService()

async def sync_regions(db: Session, max_retries: int = 3) -> List[Dict[str, Any]]:
    """同步区域数据"""
    try:
        # 使用预定义的区域列表
        predefined_regions = [
            {"code": "AS", "name": "亚洲"},
            {"code": "EU", "name": "欧洲"},
            {"code": "NA", "name": "北美"},
            {"code": "SA", "name": "南美"},
            {"code": "AF", "name": "非洲"},
            {"code": "OC", "name": "大洋洲"}
        ]
        
        # 更新数据库
        for region in predefined_regions:
            db_region = Region(
                code=region["code"],
                name=region["name"],
                status=1
            )
            db.merge(db_region)
        
        try:
            db.commit()
            logger.info(f"[Sync] 同步区域数据成功: {len(predefined_regions)} 个区域")
        except Exception as e:
            logger.error(f"[Sync] 提交数据库事务失败: {str(e)}")
            db.rollback()
            
        return predefined_regions
        
    except Exception as e:
        logger.error(f"[Sync] 同步区域数据失败: {str(e)}")
        logger.error(f"[Sync] 错误堆栈: {traceback.format_exc()}")
        db.rollback()
        return []

async def sync_countries(db: Session, region_code: str, max_retries: int = 3) -> List[Dict[str, Any]]:
    """同步指定区域的国家数据"""
    retry_count = 0
    last_error = None
    
    try:
        # 统一区域代码格式
        region_code_map = {
            "1": "AS", "2": "EU", "3": "AF", "4": "OC", "6": "NA", "7": "SA",
            "AS": "AS", "EU": "EU", "AF": "AF", "OC": "OC", "NA": "NA", "SA": "SA"
        }
        
        normalized_region_code = region_code_map.get(region_code)
        if not normalized_region_code:
            logger.error(f"[Sync] 无效的区域代码: {region_code}")
            return []
            
        # 数据库没有，从API获取
        while retry_count < max_retries:
            try:
                # 调用区域服务获取区域数据
                response = await area_service.get_area_list()
                
                if not response:
                    retry_count += 1
                    continue
                
                # 处理API响应数据
                countries = []
                if isinstance(response, list):
                    # 遍历响应数据，查找匹配的区域
                    for area in response:
                        if not isinstance(area, dict):
                            continue
                            
                        area_code = area.get('areaCode')
                        if area_code != normalized_region_code:
                            continue
                            
                        country_list = area.get('countryList', [])
                        if not country_list:
                            continue
                            
                        # 处理国家列表
                        for country in country_list:
                            if not isinstance(country, dict):
                                continue
                                
                            country_code = country.get('countryCode')
                            country_name = country.get('countryName')
                            
                            if not country_code or not country_name:
                                continue
                                
                            # 保存到数据库
                            country_obj = Country(
                                code=country_code,
                                name=country_name,
                                region_code=normalized_region_code,
                                status=1
                            )
                            db.merge(country_obj)
                            
                            # 添加到返回列表
                            countries.append({
                                "code": country_code,
                                "name": country_name
                            })
                        
                        # 找到匹配的区域后退出循环
                        if countries:
                            break
                
                # 如果成功获取到国家列表
                if countries:
                    try:
                        db.commit()
                        logger.info(f"[Sync] 同步国家数据成功: {len(countries)} 个国家")
                        return countries
                    except Exception as e:
                        logger.error(f"[Sync] 提交数据库事务失败: {str(e)}")
                        db.rollback()
                
                retry_count += 1
                await asyncio.sleep(1)
                
            except Exception as e:
                last_error = e
                retry_count += 1
                logger.error(f"[Sync] 同步国家数据失败(第{retry_count}次): {str(e)}")
                if retry_count >= max_retries:
                    break
                await asyncio.sleep(1)
        
        if last_error:
            raise last_error
            
        return []
        
    except Exception as e:
        logger.error(f"[Sync] 同步国家数据失败: {str(e)}")
        logger.error(f"[Sync] 错误堆栈: {traceback.format_exc()}")
        db.rollback()
        return []

async def sync_cities(db: Session, country_code: str) -> List[Dict[str, Any]]:
    """同步指定国家的城市数据"""
    try:
        logger.info(f"[Sync] 开始同步国家 {country_code} 的城市数据")
        
        # 验证国家代码是否存在
        country = db.query(Country).filter(Country.code == country_code).first()
        if not country:
            logger.error(f"[Sync] 国家代码 {country_code} 不存在")
            return []
        
        # 从区域服务获取城市数据
        data = await area_service.get_city_list(country_code)
        
        # 处理空响应
        if data is None:
            logger.warning(f"[Sync] 国家 {country_code} 没有城市数据")
            return []

        # 确保data是列表
        if not isinstance(data, list):
            data = [data] if data else []

        # 更新数据库
        cities = []
        for item in data:
            if not item or not isinstance(item, dict):
                logger.warning(f"[Sync] 跳过无效的城市数据: {item}")
                continue
                
            city_code = item.get('cityCode')
            city_name = item.get('cityName')
            
            if not city_code or not city_name:
                logger.warning(f"[Sync] 跳过无效的城市数据: {item}")
                continue
                
            try:
                city = City(
                    code=city_code,
                    name=city_name,
                    country_code=country_code,
                    status=1
                )
                db.merge(city)
                cities.append({
                    "cityCode": city_code,
                    "cityName": city_name
                })
            except Exception as e:
                logger.error(f"[Sync] 保存城市数据失败: {str(e)}")
                continue
        
        try:
            db.commit()
            logger.info(f"[Sync] 同步城市数据成功: {len(cities)} 个城市")
        except Exception as e:
            logger.error(f"[Sync] 提交数据库事务失败: {str(e)}")
            db.rollback()
            return []
        
        return cities
    except Exception as e:
        logger.error(f"[Sync] 同步城市数据失败: {str(e)}")
        logger.error(f"[Sync] 错误堆栈: {traceback.format_exc()}")
        db.rollback()
        return []

async def sync_ip_ranges(db: Session, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """同步IP段数据"""
    try:
        logger.info(f"[Sync] 开始同步IP段数据，参数: {params}")
        
        # 验证必要参数
        country_code = params.get('countryCode')
        city_code = params.get('cityCode')
        if not country_code or not city_code:
            logger.error("[Sync] 缺少必要参数: countryCode 或 cityCode")
            return []

        # 从区域服务获取IP段数据
        try:
            data = await area_service.get_ip_ranges({
                "proxyType": [103],  # 静态国外家庭
                "countryCode": country_code,
                "cityCode": city_code
            })
            logger.info(f"[Sync] 区域服务响应数据: {data}")
            return data if isinstance(data, list) else []
        except Exception as e:
            logger.error(f"[Sync] 调用区域服务失败: {str(e)}")
            return []
            
    except Exception as e:
        logger.error(f"[Sync] 同步IP段数据失败: {str(e)}")
        logger.error(f"[Sync] 错误堆栈: {traceback.format_exc()}")
        return []

async def sync_ip_counts(db: Session, params: Dict[str, Any]) -> Dict[str, Any]:
    """同步IP数量数据"""
    try:
        logger.info(f"[Sync] 开始同步IP数量数据，参数: {params}")
        
        # 验证必要参数
        country_code = params.get('countryCode')
        city_code = params.get('cityCode')
        if not country_code or not city_code:
            logger.error("[Sync] 缺少必要参数: countryCode 或 cityCode")
            return {}

        # 从IPIPV API获取IP数量数据
        try:
            data = await area_service._make_request("/product/count/v2", {
                "proxyType": [103],  # 静态国外家庭
                "countryCode": country_code,
                "cityCode": city_code
            })
            logger.info(f"[Sync] IPIPV API响应数据: {data}")
        except Exception as e:
            logger.error(f"[Sync] 调用IPIPV API失败: {str(e)}")
            return {}

        # 检查响应数据格式
        if not data or not isinstance(data, dict):
            logger.error(f"[Sync] 无效的IP数量数据响应: {data}")
            return {}

        # 处理响应数据
        try:
            processed_data = {
                "total": data.get('total', 0),
                "used": data.get('used', 0),
                "available": data.get('available', 0),
                "countryCode": country_code,
                "cityCode": city_code
            }
            logger.info(f"[Sync] 同步IP数量数据成功: {processed_data}")
            return processed_data

        except Exception as e:
            logger.error(f"[Sync] 处理IP数量数据失败: {str(e)}")
            return {}

    except Exception as e:
        logger.error(f"[Sync] 同步IP数量数据失败: {str(e)}")
        logger.error(f"[Sync] 错误堆栈: {traceback.format_exc()}")
        return {} 