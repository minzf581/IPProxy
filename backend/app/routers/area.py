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
        logger.info(f"获取到城市列表，数量: {len(cities) if cities else 0}")
        
        return {
            "code": 0,
            "msg": "success",
            "data": cities if cities else []
        }
        
    except Exception as e:
        logger.error(f"获取城市列表失败: {str(e)}")
        logger.exception(e)
        return {
            "code": 500,
            "msg": "获取城市列表失败",
            "data": []
        } 