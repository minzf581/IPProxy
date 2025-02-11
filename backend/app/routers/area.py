"""
区域路由模块
==========

此模块处理所有与地理区域相关的路由请求，包括：
- 区域列表获取
- 城市列表获取
- IP段列表获取

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

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Body, HTTPException
from app.services import IPIPVBaseAPI
from app.core.deps import get_ipipv_api
import logging
import traceback

# 设置日志记录器
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/open/app/area/v2")
async def get_area_list(
    ipipv_api: IPIPVBaseAPI = Depends(get_ipipv_api)
) -> Dict[str, Any]:
    """获取区域列表"""
    try:
        logger.info("[区域服务] 开始获取区域列表")
        result = await ipipv_api._make_request("api/open/app/area/v2", {
            "appUsername": "test_user"
        })
        return {
            "code": 0,
            "msg": "success",
            "data": result
        }
    except Exception as e:
        logger.error(f"[区域服务] 获取区域列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/open/app/city/list/v2")
async def get_city_list(
    countryCode: str,
    ipipv_api: IPIPVBaseAPI = Depends(get_ipipv_api)
) -> Dict[str, Any]:
    """获取城市列表"""
    try:
        logger.info(f"[城市服务] 开始获取城市列表: countryCode={countryCode}")
        result = await ipipv_api._make_request("api/open/app/city/list/v2", {
            "countryCode": countryCode,
            "appUsername": "test_user"
        })
        return {
            "code": 0,
            "msg": "success",
            "data": result
        }
    except Exception as e:
        logger.error(f"[城市服务] 获取城市列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/open/app/area/v2")
async def get_area_list_post(
    params: Dict[str, Any] = Body(...),
    ipipv_api: IPIPVBaseAPI = Depends(get_ipipv_api)
) -> Dict[str, Any]:
    """获取区域列表"""
    try:
        logger.info(f"获取区域列表，参数：{params}")
        
        # 获取区域列表
        result = await ipipv_api._make_request("api/open/app/area/v2", params)
        
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
async def get_city_list_post(
    params: Dict[str, Any] = Body(...),
    ipipv_api: IPIPVBaseAPI = Depends(get_ipipv_api)
) -> Dict[str, Any]:
    """获取城市列表"""
    try:
        logger.info(f"获取城市列表，参数：{params}")
        
        # 检查是否是加密参数
        if "params" in params:
            try:
                encrypted_params = params.get("params")
                logger.info(f"收到加密参数: {encrypted_params}")
                decrypted_params = ipipv_api._decrypt_response(encrypted_params)
                logger.info(f"解密后参数: {decrypted_params}")
                if not isinstance(decrypted_params, dict):
                    logger.error(f"解密后参数格式错误: {type(decrypted_params)}")
                    return {
                        "code": 400,
                        "msg": "参数格式错误",
                        "data": []
                    }
                country_code = decrypted_params.get("countryCode")
            except Exception as e:
                logger.error(f"解密参数失败: {str(e)}")
                logger.exception(e)
                return {
                    "code": 400,
                    "msg": "参数解密失败",
                    "data": []
                }
        else:
            country_code = params.get("countryCode")
            
        if not country_code:
            logger.warning("未提供国家代码")
            return {
                "code": 400,
                "msg": "未提供国家代码",
                "data": []
            }
            
        logger.info(f"使用国家代码: {country_code}")
            
        # 获取城市列表
        cities = await ipipv_api._make_request("api/open/app/city/list/v2", {
            "countryCode": country_code,
            "appUsername": "test_user"
        })
        
        if not cities or not isinstance(cities, dict):
            logger.warning(f"未找到城市数据或格式错误: country_code={country_code}, response={cities}")
            return {
                "code": 0,
                "msg": "success",
                "data": []
            }
            
        # 获取实际的城市列表数据
        city_list = cities.get('data', [])
        if not isinstance(city_list, list):
            logger.warning(f"城市列表格式错误: {city_list}")
            return {
                "code": 0,
                "msg": "success",
                "data": []
            }
            
        logger.debug(f"原始城市数据: {city_list}")
            
        # 过滤和转换城市数据
        filtered_cities = []
        for city in city_list:
            if not isinstance(city, dict):
                continue
                
            city_code = city.get("cityCode") or city.get("code")
            city_name = city.get("cityName") or city.get("name")
            
            if city_code and city_name:
                filtered_cities.append({
                    "cityCode": city_code,
                    "cityName": city_name,
                    "countryCode": country_code.upper()
                })
        
        logger.info(f"获取到城市列表，过滤前数量: {len(city_list)}, 过滤后数量: {len(filtered_cities)}")
        logger.debug(f"过滤后的城市数据: {filtered_cities}")
        
        return {
            "code": 0,
            "msg": "success",
            "data": filtered_cities
        }
        
    except Exception as e:
        logger.error(f"获取城市列表失败: {str(e)}")
        logger.exception(e)
        return {
            "code": 500,
            "msg": "获取城市列表失败",
            "data": []
        }

@router.get("/open/app/location/options/v2")
async def get_area_list():
    """获取地区列表"""
    try:
        logger.info("[Area] 开始获取地区列表")
        api = IPIPVBaseAPI()
        result = await api._make_request(
            "open/app/location/options/v2",
            {}
        )
        
        if not result:
            return {
                "code": 0,
                "msg": "success",
                "data": []
            }
            
        return {
            "code": 0,
            "msg": "success",
            "data": result.get("data", [])
        }
        
    except Exception as e:
        logger.error(f"[Area] 获取地区列表失败: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "code": 500,
            "msg": "获取地区列表失败",
            "data": []
        } 