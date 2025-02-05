from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Body
from app.services.ipproxy_service import IPProxyService
from app.core.deps import get_ipproxy_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/open/app/area/v2")
async def get_area_list(
    params: Dict[str, Any] = Body(...),
    ipproxy_service: IPProxyService = Depends(get_ipproxy_service)
) -> List[Dict[str, Any]]:
    """获取地区列表"""
    logger.info(f"获取地区列表，参数：{params}")
    return await ipproxy_service.get_area_list()

@router.post("/open/app/city/list/v2")
async def get_city_list(
    params: Dict[str, Any] = Body(...),
    ipproxy_service: IPProxyService = Depends(get_ipproxy_service)
) -> List[Dict[str, Any]]:
    """获取城市列表"""
    try:
        logger.info(f"[API] get_city_list - 接收到请求参数: {params}")
        
        # 检查是否是标准的 IPIPV API 请求格式
        if "params" in params:
            try:
                encrypted_params = params.get("params")
                logger.info(f"[API] get_city_list - 收到加密参数: {encrypted_params}")
                decrypted_params = ipproxy_service._decrypt_response(encrypted_params)
                logger.info(f"[API] get_city_list - 解密后参数: {decrypted_params}")
                if not isinstance(decrypted_params, dict):
                    logger.error(f"[API] get_city_list - 解密后参数格式错误: {type(decrypted_params)}")
                    return []
                country_code = decrypted_params.get("countryCode")
            except Exception as e:
                logger.error(f"[API] get_city_list - 解密参数失败: {str(e)}")
                logger.exception(e)
                return []
        else:
            # 直接从参数中获取国家代码
            country_code = params.get("countryCode")
            
        if not country_code:
            logger.warning("[API] get_city_list - 未提供国家代码")
            return []
            
        logger.info(f"[API] get_city_list - 使用国家代码: {country_code}")
            
        # 调用服务获取城市列表
        cities = await ipproxy_service.get_city_list(country_code)
        logger.info(f"[API] get_city_list - 获取到城市列表，数量: {len(cities)}")
        if cities:
            logger.info(f"[API] get_city_list - 城市列表示例: {cities[0]}")
            logger.info(f"[API] get_city_list - 完整城市列表: {cities}")
        else:
            logger.warning(f"[API] get_city_list - 未找到城市列表，国家代码: {country_code}")
        
        return cities
        
    except Exception as e:
        logger.error(f"[API] get_city_list - 获取城市列表失败: {str(e)}")
        logger.exception(e)
        return []

@router.post("/open/app/area/ip-ranges/v2")
async def get_ip_ranges(
    params: Dict[str, Any] = Body(...),
    ipproxy_service: IPProxyService = Depends(get_ipproxy_service)
) -> List[Dict[str, Any]]:
    """获取IP段列表"""
    try:
        logger.info(f"[API] get_ip_ranges - 接收到请求参数: {params}")
        
        # 检查是否是标准的 IPIPV API 请求格式
        if "params" in params:
            try:
                encrypted_params = params.get("params")
                logger.info(f"[API] get_ip_ranges - 收到加密参数: {encrypted_params}")
                decrypted_params = ipproxy_service._decrypt_response(encrypted_params)
                logger.info(f"[API] get_ip_ranges - 解密后参数: {decrypted_params}")
                if not isinstance(decrypted_params, dict):
                    logger.error(f"[API] get_ip_ranges - 解密后参数格式错误: {type(decrypted_params)}")
                    return []
                params = decrypted_params
            except Exception as e:
                logger.error(f"[API] get_ip_ranges - 解密参数失败: {str(e)}")
                logger.exception(e)
                return []
        
        # 验证 proxyType 参数
        proxy_type = params.get("proxyType")
        if not proxy_type:
            logger.error("[API] get_ip_ranges - 缺少必要参数: proxyType")
            return []
            
        # 验证是否为有效的静态代理类型
        valid_proxy_types = [101, 102, 103]  # 静态代理类型
        if proxy_type not in valid_proxy_types:
            logger.error(f"[API] get_ip_ranges - 无效的代理类型: {proxy_type}，必须是静态代理类型 (101, 102, 103)")
            return []
                
        logger.info(f"[API] get_ip_ranges - 使用参数: {params}")
            
        # 调用服务获取IP段列表
        ip_ranges = await ipproxy_service.get_ip_ranges(params)
        logger.info(f"[API] get_ip_ranges - 获取到IP段列表，数量: {len(ip_ranges) if ip_ranges else 0}")
        if ip_ranges:
            logger.info(f"[API] get_ip_ranges - IP段列表示例: {ip_ranges[0]}")
            logger.info(f"[API] get_ip_ranges - 完整IP段列表: {ip_ranges}")
        else:
            logger.warning(f"[API] get_ip_ranges - 未找到IP段列表，参数: {params}")
        
        return ip_ranges
        
    except Exception as e:
        logger.error(f"[API] get_ip_ranges - 获取IP段列表失败: {str(e)}")
        logger.exception(e)
        return [] 