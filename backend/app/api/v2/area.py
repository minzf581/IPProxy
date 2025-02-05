"""
区域API路由模块
=============

此模块处理所有与地理区域相关的API请求，包括：
1. 区域列表获取
2. 城市列表获取
3. IP范围查询

使用说明：
--------
所有API都支持加密参数，使用AES加密方式。
参数格式：
{
    "params": "加密后的参数字符串",
    "appKey": "应用密钥"
}

注意事项：
--------
1. 所有请求都需要进行参数验证
2. 加密参数需要正确解密
3. 记录详细的日志信息
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Body
from app.services import AreaService
from app.core.deps import get_area_service
import logging
import time

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/open/app/area/v2")
async def get_area_list(
    params: Dict[str, Any] = Body(...),
    area_service: AreaService = Depends(get_area_service)
) -> Dict[str, Any]:
    """获取地区列表"""
    try:
        logger.info(f"获取地区列表，参数：{params}")
        
        # 获取区域列表
        result = await area_service.get_area_list(params)
        
        # 构建标准响应格式
        response = {
            "code": 0,
            "msg": "success",
            "data": result if result else []
        }
        
        logger.info(f"API响应: {response}")
        return response
        
    except Exception as e:
        logger.error(f"获取区域列表失败: {str(e)}")
        logger.exception(e)
        return {
            "code": 500,
            "msg": "获取区域列表失败",
            "data": []
        }

@router.post("/open/app/city/list/v2")
async def get_city_list(
    params: Dict[str, Any] = Body(...),
    area_service: AreaService = Depends(get_area_service)
) -> List[Dict[str, Any]]:
    """获取城市列表"""
    try:
        logger.info(f"获取城市列表，参数：{params}")
        
        # 检查是否是加密参数
        if "params" in params:
            try:
                encrypted_params = params.get("params")
                logger.info(f"收到加密参数: {encrypted_params}")
                decrypted_params = area_service._decrypt_response(encrypted_params)
                logger.info(f"解密后参数: {decrypted_params}")
                if not isinstance(decrypted_params, dict):
                    logger.error(f"解密后参数格式错误: {type(decrypted_params)}")
                    return []
                country_code = decrypted_params.get("countryCode")
            except Exception as e:
                logger.error(f"解密参数失败: {str(e)}")
                logger.exception(e)
                return []
        else:
            country_code = params.get("countryCode")
            
        if not country_code:
            logger.warning("未提供国家代码")
            return []
            
        logger.info(f"使用国家代码: {country_code}")
            
        # 获取城市列表
        cities = await area_service.get_city_list(country_code)
        logger.info(f"获取到城市列表，数量: {len(cities) if cities else 0}")
        return cities
        
    except Exception as e:
        logger.error(f"获取城市列表失败: {str(e)}")
        logger.exception(e)
        return []

@router.post("/open/app/area/ip-ranges/v2")
async def get_ip_ranges(
    params: Dict[str, Any] = Body(...),
    area_service: AreaService = Depends(get_area_service)
) -> List[Dict[str, Any]]:
    """获取IP段列表"""
    try:
        logger.info(f"获取IP段列表，参数：{params}")
        
        # 检查是否是加密参数
        if "params" in params:
            try:
                encrypted_params = params.get("params")
                logger.info(f"收到加密参数: {encrypted_params}")
                decrypted_params = area_service._decrypt_response(encrypted_params)
                logger.info(f"解密后参数: {decrypted_params}")
                if not isinstance(decrypted_params, dict):
                    logger.error(f"解密后参数格式错误: {type(decrypted_params)}")
                    return []
                params = decrypted_params
            except Exception as e:
                logger.error(f"解密参数失败: {str(e)}")
                logger.exception(e)
                return []
        
        # 验证 proxyType 参数
        proxy_type = params.get("proxyType")
        if not proxy_type:
            logger.error("缺少必要参数: proxyType")
            return []
            
        # 验证是否为有效的静态代理类型
        valid_proxy_types = [101, 102, 103]  # 静态代理类型
        if proxy_type not in valid_proxy_types:
            logger.error(f"无效的代理类型: {proxy_type}，必须是静态代理类型 (101, 102, 103)")
            return []
                
        logger.info(f"使用参数: {params}")
            
        # 获取IP段列表
        ip_ranges = await area_service.get_ip_ranges(params)
        logger.info(f"获取到IP段列表，数量: {len(ip_ranges) if ip_ranges else 0}")
        return ip_ranges
        
    except Exception as e:
        logger.error(f"获取IP段列表失败: {str(e)}")
        logger.exception(e)
        return [] 