from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.services.ipproxy_service import IPProxyService
from app.core.deps import get_ipproxy_service

router = APIRouter()

@router.post("/open/app/area/v2")
async def get_area_list(
    params: Dict[str, Any],
    ipproxy_service: IPProxyService = Depends(get_ipproxy_service)
) -> List[Dict[str, Any]]:
    """获取地区列表"""
    return await ipproxy_service.get_area_list()

@router.post("/open/app/city/list/v2")
async def get_city_list(
    params: Dict[str, Any],
    ipproxy_service: IPProxyService = Depends(get_ipproxy_service)
) -> List[Dict[str, Any]]:
    """获取城市列表"""
    country_code = params.get("countryCode")
    if not country_code:
        return []
    return await ipproxy_service.get_city_list(country_code)

@router.post("/open/app/area/ip-ranges/v2")
async def get_ip_ranges(
    params: Dict[str, Any],
    ipproxy_service: IPProxyService = Depends(get_ipproxy_service)
) -> List[Dict[str, Any]]:
    """获取IP段列表"""
    return await ipproxy_service.get_ip_ranges(params) 