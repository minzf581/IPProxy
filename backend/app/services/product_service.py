"""
产品服务模块

此模块处理所有与产品相关的功能，包括：
1. 产品管理（创建、更新、查询）
2. 产品价格管理
3. 产品库存管理
4. 产品统计

此模块继承自IPIPVBaseAPI，使用其提供的基础通信功能。

使用示例：

    product_service = ProductService()
    products = await product_service.get_product_list()

注意事项：
1. 所有方法都应该使用异步调用
2. 确保正确处理错误情况
3. 添加必要的日志记录
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from .ipipv_base_api import IPIPVBaseAPI
from sqlalchemy.orm import Session
from app.models.product_inventory import ProductInventory
import json
import traceback

logger = logging.getLogger(__name__)

class ProductService(IPIPVBaseAPI):
    """产品服务类，处理所有产品相关的操作"""
    
    async def get_product_list(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        获取产品列表
        
        Args:
            params: 查询参数，包括：
                - page: 页码
                - pageSize: 每页数量
                - status: 可选，状态过滤
                - proxyType: 可选，代理类型
                
        Returns:
            list: 产品列表
            空列表: 获取失败
        """
        try:
            logger.info(f"[ProductService] 获取产品列表: {params}")
            
            # 构建请求参数
            request_params = {
                "appUsername": "test_user",
                "page": params.get("page", 1),
                "pageSize": params.get("pageSize", 1000),
                "status": params.get("status", 1)
            }
            
            # 如果指定了代理类型，添加到请求参数
            if "proxyType" in params:
                request_params["proxyType"] = params["proxyType"]
            
            # 调用API
            result = await self._make_request("api/open/app/product/query/v2", request_params)
            
            if not result:
                logger.warning("[ProductService] API返回空数据")
                return []
            
            # 检查响应格式
            if isinstance(result, dict):
                # 检查响应状态
                if result.get("code") not in [0, 200]:
                    logger.error(f"[ProductService] API返回错误: {result.get('msg', '未知错误')}")
                    return []
                    
                # 获取数据部分
                data = result.get("data")
                if isinstance(data, dict):
                    return data.get("list", [])
                elif isinstance(data, list):
                    return data
                else:
                    logger.warning(f"[ProductService] 意外的数据格式: {data}")
                    return []
                    
            elif isinstance(result, list):
                return result
            
            logger.warning(f"[ProductService] 意外的响应格式: {result}")
            return []
            
        except Exception as e:
            logger.error(f"[ProductService] 获取产品列表失败: {str(e)}")
            logger.error(traceback.format_exc())
            return []
            
    async def get_product_info(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        获取产品详情
        
        Args:
            product_id: 产品ID
            
        Returns:
            dict: 产品详情
            None: 获取失败
        """
        try:
            logger.info(f"[ProductService] 获取产品详情: product_id={product_id}")
            result = await self._make_request(f"api/open/app/product/{product_id}/v2")
            return result.get("data") if isinstance(result, dict) else None
        except Exception as e:
            logger.error(f"[ProductService] 获取产品详情失败: {str(e)}")
            return None
            
    async def update_product(self, product_id: str, data: Dict[str, Any]) -> bool:
        """
        更新产品信息
        
        Args:
            product_id: 产品ID
            data: 更新数据
            
        Returns:
            bool: 是否更新成功
        """
        try:
            logger.info(f"[ProductService] 更新产品信息: product_id={product_id}")
            result = await self._make_request(
                f"api/open/app/product/{product_id}/v2",
                data,
                method="PUT"
            )
            return result is not None
        except Exception as e:
            logger.error(f"[ProductService] 更新产品信息失败: {str(e)}")
            return False
            
    async def sync_inventory(self, db: Session) -> bool:
        """
        同步产品库存信息到本地数据库
        
        Args:
            db: 数据库会话
            
        Returns:
            bool: 是否同步成功
        """
        try:
            logger.info("[ProductService] 开始同步产品库存")
            
            # 获取远程产品列表
            request_params = {
                "appUsername": "test_user",
                "page": 1,
                "pageSize": 1000,
                "status": 1,
                "proxyType": [104]  # 动态代理类型，使用数组格式
            }
            
            # 调用API
            result = await self._make_request("api/open/app/product/query/v2", request_params)
            
            if not result:
                logger.warning("[ProductService] API返回空数据")
                return False
                
            # 检查响应格式和状态码
            if not isinstance(result, dict) or result.get("code") not in [0, 200]:
                error_msg = result.get("msg", "未知错误") if isinstance(result, dict) else "响应格式错误"
                logger.error(f"[ProductService] API返回错误: {error_msg}")
                return False
                
            # 获取产品列表数据
            products_data = result.get("data", {})
            if isinstance(products_data, dict):
                products = products_data.get("list", [])
            elif isinstance(products_data, list):
                products = products_data
            else:
                logger.warning(f"[ProductService] 意外的数据格式: {products_data}")
                return False
            
            if not products:
                logger.warning("[ProductService] 未获取到产品数据")
                return False
            
            logger.info(f"[ProductService] 获取到 {len(products)} 个产品")
            
            # 更新本地库存
            for product in products:
                try:
                    product_no = product.get("productNo")
                    if not product_no:
                        logger.warning(f"[ProductService] 产品数据缺少productNo: {product}")
                        continue
                        
                    inventory = db.query(ProductInventory).filter(
                        ProductInventory.product_no == product_no
                    ).first()
                    
                    product_data = {
                        "product_no": product_no,
                        "product_name": product.get("name") or f"动态代理 {product_no}",
                        "proxy_type": product.get("proxyType", 104),
                        "use_type": "1",  # 账密
                        "protocol": "1",  # socks5
                        "use_limit": 3,   # 无限制
                        "sell_limit": 3,  # 无限制
                        "area_code": product.get("area", ""),
                        "country_code": product.get("country", ""),
                        "state_code": "",  # 州省代码
                        "city_code": product.get("city", ""),
                        "cost_price": product.get("costPrice", 0),
                        "global_price": product.get("price", 0),
                        "min_agent_price": product.get("minAgentPrice", 0),
                        "inventory": product.get("stock", 0),
                        "ip_type": 1,  # ipv4
                        "isp_type": 0,  # 未知
                        "net_type": 0,  # 未知
                        "duration": product.get("duration", 0),
                        "unit": product.get("unit", 1),
                        "flow": product.get("flow", 0),
                        "enable": product.get("status", 1) == 1,
                        "updated_at": datetime.now()
                    }
                    
                    if inventory:
                        # 更新现有记录
                        logger.debug(f"[ProductService] 更新产品: {product_no}")
                        for key, value in product_data.items():
                            setattr(inventory, key, value)
                    else:
                        # 创建新记录
                        logger.debug(f"[ProductService] 创建产品: {product_no}")
                        inventory = ProductInventory(**product_data)
                        db.add(inventory)
                        
                except Exception as e:
                    logger.error(f"[ProductService] 处理产品数据失败: {str(e)}, product={product}")
                    continue
                
            db.commit()
            logger.info("[ProductService] 产品库存同步完成")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"[ProductService] 同步产品库存失败: {str(e)}")
            logger.error(traceback.format_exc())
            return False

def get_product_service() -> ProductService:
    """
    工厂函数，用于创建 ProductService 实例
    
    Returns:
        ProductService: 产品服务实例
    """
    return ProductService() 