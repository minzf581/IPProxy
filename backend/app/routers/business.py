from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.prices import AgentPrice
from app.models.product_inventory import ProductInventory
from app.models.area import Area
from app.services.auth import get_current_user
from app.services.area_service import AreaService
from app.core.deps import get_area_service
from typing import Dict, Any, List, Optional
import logging
import json
import traceback

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/business/products")
async def get_products(
    userId: Optional[int] = None,
    proxyType: Optional[int] = None,
    includePrice: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取产品列表，包括价格信息"""
    try:
        logger.info(f"[Business] 开始获取产品列表: userId={userId}, proxyType={proxyType}, includePrice={includePrice}")
        
        # 构建基础查询
        query = db.query(ProductInventory)
        
        # 添加过滤条件
        if proxyType is not None:
            query = query.filter(ProductInventory.proxy_type == proxyType)
            
        # 获取产品列表
        products = query.all()
        logger.info(f"[Business] 查询到 {len(products)} 个产品")
        
        # 如果需要包含价格信息
        if includePrice and userId:
            # 获取代理商价格
            agent_prices = db.query(AgentPrice).filter(
                AgentPrice.agent_id == userId
            ).all()
            
            # 创建价格映射
            price_map = {ap.product_id: ap.price for ap in agent_prices}
            logger.info(f"[Business] 代理商价格映射: {price_map}")
            
        # 格式化响应数据
        formatted_products = []
        for product in products:
            product_data = {
                "id": product.id,
                "productNo": product.product_no,
                "productName": product.product_name,
                "proxyType": product.proxy_type,
                "areaCode": product.area_code,
                "countryCode": product.country_code,
                "stateCode": product.state_code,
                "cityCode": product.city_code,
                "globalPrice": float(product.global_price) if product.global_price else None,
                "enable": product.enable,
                "flow": product.flow
            }
            
            # 如果需要包含价格信息
            if includePrice and userId:
                product_data["agentPrice"] = float(price_map.get(product.id, product.global_price or 0))
                
            formatted_products.append(product_data)
            
        return {
            "code": 0,
            "msg": "success",
            "data": formatted_products
        }
        
    except Exception as e:
        logger.error(f"[Business] 获取产品列表失败: {str(e)}")
        return {
            "code": 500,
            "msg": f"获取产品列表失败: {str(e)}",
            "data": None
        }

@router.get("/business/areas")
async def get_business_areas(
    proxyType: int,
    productNo: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取业务区域列表"""
    try:
        logger.info(f"[Business] 开始获取区域列表: proxyType={proxyType}, productNo={productNo}")
        
        # 从数据库获取区域数据
        areas = db.query(Area).filter(Area.enable == True).all()
        logger.debug(f"[Business] 从数据库获取到 {len(areas)} 个区域")
        
        # 格式化响应数据
        formatted_areas = []
        for area in areas:
            logger.debug(f"[Business] 处理区域: {area.area_code} - {area.area_name}")
            formatted_area = {
                "areaCode": area.area_code,
                "areaName": area.area_name,
                "countries": []
            }
            
            # 获取国家数据
            for country in area.countries:
                if country.enable:
                    logger.debug(f"[Business] 处理国家: {country.country_code} - {country.country_name}")
                    formatted_country = {
                        "countryCode": country.country_code,
                        "countryName": country.country_name,
                        "states": [],
                        "cities": []
                    }
                    
                    # 获取州/省数据
                    for state in country.states:
                        if state.enable:
                            logger.debug(f"[Business] 处理州/省: {state.state_code} - {state.state_name}")
                            formatted_country["states"].append({
                                "code": state.state_code,
                                "name": state.state_name
                            })
                    
                    # 获取城市数据
                    for city in country.cities:
                        if city.enable:
                            logger.debug(f"[Business] 处理城市: {city.city_code} - {city.city_name}")
                            formatted_country["cities"].append({
                                "cityCode": city.city_code,
                                "cityName": city.city_name
                            })
                    
                    formatted_area["countries"].append(formatted_country)
            
            formatted_areas.append(formatted_area)
        
        logger.info(f"[Business] 格式化后的区域数据: {json.dumps(formatted_areas, ensure_ascii=False)}")
        
        return {
            "code": 0,
            "msg": "success",
            "data": formatted_areas
        }
        
    except Exception as e:
        logger.error(f"[Business] 获取区域列表失败: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "code": 500,
            "msg": f"获取区域列表失败: {str(e)}",
            "data": []
        }

@router.get("/business/dynamic-proxy/products")
async def get_dynamic_proxy_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取动态代理产品列表"""
    try:
        logger.info("[Business] 开始获取动态代理产品列表")
        
        # 查询动态代理产品
        products = db.query(ProductInventory).filter(
            ProductInventory.proxy_type == 104,  # 动态代理类型
            ProductInventory.enable == True
        ).all()
        
        logger.info(f"[Business] 查询到 {len(products)} 个动态代理产品")
        
        # 格式化响应数据
        formatted_products = []
        for product in products:
            formatted_products.append({
                "id": product.id,
                "type": product.product_no,
                "proxyType": product.proxy_type,
                "area": product.area_code or "",
                "country": product.country_code or "",
                "city": product.city_code or "",
                "ipRange": "",
                "price": float(product.global_price) if product.global_price else 0,
                "isGlobal": True,
                "stock": product.inventory,
                "minAgentPrice": float(product.min_agent_price) if product.min_agent_price else 0,
                "globalPrice": float(product.global_price) if product.global_price else 0,
                "updatedAt": product.updated_at.isoformat() if product.updated_at else None,
                "createdAt": product.created_at.isoformat() if product.created_at else None,
                "key": product.id,
                "name": product.product_name,
                "flow": product.flow,
                "duration": product.duration,
                "unit": product.unit
            })
            
        return {
            "code": 0,
            "msg": "success",
            "data": formatted_products
        }
        
    except Exception as e:
        logger.error(f"[Business] 获取动态代理产品列表失败: {str(e)}")
        return {
            "code": 500,
            "msg": f"获取动态代理产品列表失败: {str(e)}",
            "data": []
        }

@router.get("/business/dynamic-proxy/inventory")
async def get_dynamic_proxy_inventory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取动态代理库存信息"""
    try:
        logger.info("[Business] 开始获取动态代理库存信息")
        
        # 查询动态代理产品库存
        products = db.query(ProductInventory).filter(
            ProductInventory.proxy_type == 104,  # 动态代理类型
            ProductInventory.enable == True
        ).all()
        
        logger.info(f"[Business] 查询到 {len(products)} 个动态代理产品库存")
        
        # 格式化响应数据
        formatted_products = []
        for product in products:
            formatted_products.append({
                "productId": product.product_no,
                "stock": product.inventory,
                "updatedAt": product.updated_at.isoformat() if product.updated_at else None
            })
            
        return {
            "code": 0,
            "msg": "success",
            "data": formatted_products
        }
        
    except Exception as e:
        logger.error(f"[Business] 获取动态代理库存信息失败: {str(e)}")
        return {
            "code": 500,
            "msg": f"获取动态代理库存信息失败: {str(e)}",
            "data": []
        } 