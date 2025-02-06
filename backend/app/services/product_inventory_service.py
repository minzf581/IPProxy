from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session
from app.models.product_inventory import ProductInventory
from app.models.user import User
from app.models.static_order import StaticOrder
from app.services.ipipv_base_api import IPIPVBaseAPI
from fastapi import HTTPException
import asyncio

logger = logging.getLogger(__name__)

class ProductInventoryService:
    def __init__(self, db: Session, ipipv_api: IPIPVBaseAPI):
        self.db = db
        self.ipipv_api = ipipv_api
        self.sync_lock = asyncio.Lock()  # 添加同步锁
        self.last_sync_time = None
        self.sync_interval = 300  # 5分钟同步间隔

    async def should_sync(self) -> bool:
        """检查是否需要同步"""
        try:
            # 获取最后同步时间
            last_sync = self.db.query(ProductInventory).order_by(
                ProductInventory.last_sync_time.desc()
            ).first()
            
            if not last_sync or not last_sync.last_sync_time:
                logger.info("没有同步记录，需要同步")
                return True
                
            # 如果库存为空，需要同步
            inventory_count = self.db.query(ProductInventory).count()
            if inventory_count == 0:
                logger.info("库存为空，需要同步")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"检查同步状态失败: {str(e)}")
            return False

    async def sync_product_inventory(self) -> bool:
        """同步产品库存"""
        if not await self.should_sync():
            logger.info("产品库存同步间隔未到，跳过同步")
            return True

        async with self.sync_lock:  # 使用同步锁防止并发同步
            try:
                logger.info("=== 开始同步产品库存 ===")
                self.last_sync_time = datetime.now()
                # 所有代理类型
                proxy_types = [101, 102, 103, 104, 105, 201]
                
                total_products = 0
                for proxy_type in proxy_types:
                    logger.info(f"[同步库存] 开始同步代理类型 {proxy_type} 的产品库存")
                    
                    # 调用IPIPV API获取产品库存
                    logger.info(f"[同步库存] 正在从API获取代理类型 {proxy_type} 的产品数据...")
                    products = await self.ipipv_api._make_request(
                        "api/open/app/product/query/v2",
                        {"proxyType": [proxy_type]}
                    )
                    
                    if not products:
                        logger.warning(f"[同步库存] 代理类型 {proxy_type} 没有产品数据")
                        continue

                    logger.info(f"[同步库存] 获取到 {len(products)} 个产品，开始更新数据库...")

                    # 批量更新数据库
                    updated_count = 0
                    inserted_count = 0
                    current_time = datetime.now()
                    for product in products:
                        # 确保设置 static_type 字段
                        static_type = product.get("staticType", "1")  # 默认为 "1"
                        if proxy_type == 103:  # 静态国外家庭代理
                            static_type = static_type or "1"  # 如果为空，设置为 "1"
                            
                        inventory = ProductInventory(
                            product_no=product["productNo"],
                            product_name=product["productName"],
                            proxy_type=product["proxyType"],
                            use_type=product["useType"],
                            protocol=product["protocol"],
                            use_limit=product["useLimit"],
                            sell_limit=product["sellLimit"],
                            area_code=product.get("areaCode"),
                            country_code=product["countryCode"],
                            state_code=product["stateCode"],
                            city_code=product["cityCode"],
                            detail=product.get("detail"),
                            cost_price=float(product["costPrice"]),
                            inventory=product["inventory"],
                            ip_type=product.get("ipType", 1),
                            isp_type=product.get("ispType", 0),
                            net_type=product.get("netType", 0),
                            duration=product["duration"],
                            unit=product["unit"],
                            band_width=product.get("bandWidth"),
                            band_width_price=product.get("bandWidthPrice"),
                            max_band_width=product.get("maxBandWidth"),
                            flow=product.get("flow"),
                            cpu=product.get("cpu"),
                            memory=product.get("memory"),
                            enable=product.get("enable", 1),
                            supplier_code=product.get("supplierCode"),
                            ip_count=product.get("ipCount"),
                            ip_duration=product.get("ipDuration"),
                            assign_ip=product.get("assignIp", -1),
                            cidr_status=product.get("cidrStatus", -1),
                            static_type=static_type,
                            last_sync_time=current_time,
                            ip_start=product.get("ipStart"),
                            ip_end=product.get("ipEnd"),
                        )

                        # 更新或插入记录
                        existing = self.db.query(ProductInventory).filter_by(
                            product_no=product["productNo"]
                        ).first()
                        
                        if existing:
                            for key, value in inventory.__dict__.items():
                                if key != "_sa_instance_state":
                                    setattr(existing, key, value)
                            updated_count += 1
                        else:
                            self.db.add(inventory)
                            inserted_count += 1

                    self.db.commit()
                    total_products += len(products)
                    logger.info(f"[同步库存] 代理类型 {proxy_type} 同步完成:")
                    logger.info(f"[同步库存] - 更新记录数: {updated_count}")
                    logger.info(f"[同步库存] - 新增记录数: {inserted_count}")

                logger.info(f"=== 产品库存同步完成，共同步 {total_products} 个产品 ===")
                return True
                
            except Exception as e:
                logger.error(f"[同步库存] 同步产品库存失败: {str(e)}")
                self.db.rollback()
                return False

    def get_product_inventory(
        self,
        area_code: Optional[str] = None,
        country_code: Optional[str] = None,
        city_code: Optional[str] = None,
        proxy_type: Optional[int] = None,
        static_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """获取指定条件的产品库存"""
        query = self.db.query(ProductInventory)

        logger.info(f"查询产品库存，参数：area_code={area_code}, country_code={country_code}, city_code={city_code}, proxy_type={proxy_type}, static_type={static_type}")

        if area_code:
            query = query.filter(ProductInventory.area_code == area_code)
            logger.info(f"应用 area_code 过滤条件: {area_code}")
            
        if country_code:
            query = query.filter(ProductInventory.country_code == country_code)
            logger.info(f"应用 country_code 过滤条件: {country_code}")
            
        if city_code:
            query = query.filter(ProductInventory.city_code == city_code)
            logger.info(f"应用 city_code 过滤条件: {city_code}")
            
        if proxy_type:
            query = query.filter(ProductInventory.proxy_type == proxy_type)
            logger.info(f"应用 proxy_type 过滤条件: {proxy_type}")
            
        if static_type:
            logger.info(f"收到 static_type 过滤条件: {static_type}，但暂时不应用此过滤条件")

        # 只返回可购买的产品
        query = query.filter(
            ProductInventory.enable == 1,
            ProductInventory.inventory > 0
        )
        logger.info("应用基础过滤条件: enable=1, inventory>0")

        products = query.all()
        logger.info(f"查询结果数量: {len(products)}")
        for product in products:
            logger.info(f"产品详情: {product.to_dict()}")

        return [product.to_dict() for product in products]

    async def activate_business(
        self,
        user_id: int,
        username: str,
        agent_id: int,
        agent_username: str,
        proxy_type: str,
        pool_type: Optional[str] = None,
        traffic: Optional[str] = None,
        region: Optional[str] = None,
        country: Optional[str] = None,
        city: Optional[str] = None,
        static_type: Optional[str] = None,
        ip_range: Optional[str] = None,
        duration: Optional[int] = None,
        quantity: Optional[str] = None,
        remark: Optional[str] = None,
        total_cost: float = 0
    ) -> Dict[str, Any]:
        """
        业务开通
        """
        try:
            # 检查用户余额
            user = self.db.query(User).filter_by(id=user_id).first()
            if not user or user.balance < total_cost:
                raise ValueError("用户余额不足")

            # 构建开通参数
            open_params = {
                "proxyType": 103 if proxy_type == "static" else 104,
                "countryCode": country,
                "cityCode": city,
                "count": int(quantity) if quantity else None,
                "unit": 3,  # 月
                "duration": duration or 1
            }

            if proxy_type == "dynamic":
                open_params.update({
                    "poolType": pool_type,
                    "traffic": int(traffic) if traffic else None
                })
            else:
                open_params.update({
                    "staticType": static_type,
                    "ipRange": ip_range
                })

            # 调用IPIPV API开通代理
            result = await self.ipipv_api._make_request(
                "api/open/app/instance/open/v2",
                open_params
            )

            if not result:
                raise ValueError("代理开通失败")

            # 扣除用户余额
            user.balance -= total_cost
            self.db.commit()

            # 创建订单记录
            order = StaticOrder(
                order_no=f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}",
                user_id=user_id,
                agent_id=agent_id,
                amount=total_cost,
                status="completed",
                resource_type=proxy_type,
                traffic=int(traffic) if traffic else None,
                expire_time=datetime.now() + timedelta(days=30 * (duration or 1)),
                continent=region,
                country=country,
                city=city,
                static_type=static_type,
                ip_range=ip_range,
                duration=duration,
                quantity=int(quantity) if quantity else None,
                remark=remark
            )
            self.db.add(order)
            self.db.commit()

            return {
                "code": 0,
                "msg": "业务开通成功",
                "data": {
                    "order_no": order.order_no,
                    "instance_info": result
                }
            }

        except Exception as e:
            logger.error(f"业务开通失败: {str(e)}")
            self.db.rollback()
            raise

    async def deactivate_business(
        self,
        user_id: int,
        order_no: str,
        proxy_type: str
    ) -> Dict[str, Any]:
        """
        释放业务资源
        """
        try:
            # 查找订单
            order = self.db.query(StaticOrder).filter_by(
                order_no=order_no,
                user_id=user_id
            ).first()

            if not order:
                raise ValueError("订单不存在")

            if order.status != "completed":
                raise ValueError("订单状态异常")

            # 调用IPIPV API释放资源
            result = await self.ipipv_api._make_request(
                "api/open/app/instance/close/v2",
                {
                    "orderNo": order_no,
                    "proxyType": 103 if proxy_type == "static" else 104
                }
            )

            if not result:
                raise ValueError("资源释放失败")

            # 更新订单状态
            order.status = "closed"
            self.db.commit()

            return {
                "code": 0,
                "msg": "资源释放成功",
                "data": result
            }

        except Exception as e:
            logger.error(f"资源释放失败: {str(e)}")
            self.db.rollback()
            raise

    async def query_products(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """查询产品列表
        
        Args:
            params: 查询参数
                - proxyType: 代理类型 (101=静态云平台, 102=静态国内家庭, 103=静态国外家庭)
                - regionCode: 区域代码
                - countryCode: 国家代码
                - cityCode: 城市代码
                - staticType: 静态代理类型
                - version: API版本
        
        Returns:
            List[Dict]: 产品列表
        """
        try:
            logger.info(f"[ProductInventoryService] 开始查询产品，参数: {params}")
            
            # 从数据库查询
            query = self.db.query(ProductInventory).filter(ProductInventory.enable == 1)
            
            if "proxyType" in params:
                logger.info(f"[ProductInventoryService] 添加代理类型过滤: {params['proxyType']}")
                query = query.filter(ProductInventory.proxy_type == params["proxyType"])
                
            if "regionCode" in params:
                logger.info(f"[ProductInventoryService] 添加区域代码过滤: {params['regionCode']}")
                query = query.filter(ProductInventory.area_code == params["regionCode"])
                
            if "countryCode" in params:
                logger.info(f"[ProductInventoryService] 添加国家代码过滤: {params['countryCode']}")
                query = query.filter(ProductInventory.country_code == params["countryCode"])
                
            if "cityCode" in params:
                logger.info(f"[ProductInventoryService] 添加城市代码过滤: {params['cityCode']}")
                query = query.filter(ProductInventory.city_code == params["cityCode"])
                
            if "staticType" in params:
                logger.info(f"[ProductInventoryService] 收到静态类型过滤: {params['staticType']}，但暂时不应用此过滤条件")
                # 暂时注释掉静态类型过滤
                # query = query.filter(ProductInventory.static_type == str(params["staticType"]))
                
            # 执行查询并记录SQL
            products = query.all()
            logger.info(f"[ProductInventoryService] 从数据库查询到 {len(products)} 个产品")
            
            # 记录每个产品的详细信息
            for product in products:
                logger.info(f"[ProductInventoryService] 产品详情: proxy_type={product.proxy_type}, "
                          f"area_code={product.area_code}, country_code={product.country_code}, "
                          f"city_code={product.city_code}, static_type={product.static_type}, "
                          f"ip_start={product.ip_start}, ip_end={product.ip_end}")
            
            # 格式化结果
            result = []
            for product in products:
                result.append({
                    "ipCount": product.ip_count or 0,
                    "stock": product.inventory,
                    "staticType": product.static_type,
                    "countryCode": product.country_code,
                    "cityCode": product.city_code,
                    "regionCode": product.area_code,
                    "ipStart": product.ip_start or "0.0.0.0",
                    "ipEnd": product.ip_end or "0.0.0.0"
                })
            
            return {
                "code": 0,
                "msg": "success",
                "data": result
            }
            
        except Exception as e:
            logger.error(f"[ProductInventoryService] 查询产品失败: {str(e)}")
            logger.exception(e)
            return {
                "code": 500,
                "msg": str(e),
                "data": []
            }

    @classmethod
    async def start_sync_task(cls, db: Session, ipipv_api: IPIPVBaseAPI):
        """启动同步任务 - 已废弃，改为按需同步"""
        logger.info("产品库存同步已改为按需同步机制")
        pass

    async def get_product_stock(self, product_no: str) -> Optional[int]:
        """
        获取产品库存
        
        Args:
            product_no: 产品编号
            
        Returns:
            int: 库存数量
            None: 获取失败
        """
        try:
            logger.info(f"[ProductInventoryService] 获取产品 {product_no} 的库存")
            
            # 首先从数据库查询
            product = self.db.query(ProductInventory).filter_by(
                product_no=product_no,
                enable=1
            ).first()
            
            if product:
                logger.info(f"[ProductInventoryService] 从数据库获取到产品 {product_no} 库存: {product.inventory}")
                return product.inventory
            
            # 如果数据库没有，则从API获取
            result = await self.ipipv_api._make_request(
                "api/open/app/product/query/v2",
                {
                    "productNo": product_no,
                    "version": "v2"
                }
            )
            
            if not result:
                logger.warning(f"[ProductInventoryService] 产品 {product_no} 查询结果为空")
                return None
                
            # 处理API返回结果
            if isinstance(result, list) and len(result) > 0:
                product_data = result[0]
            elif isinstance(result, dict):
                product_data = result
            else:
                logger.warning(f"[ProductInventoryService] 产品 {product_no} 返回格式异常")
                return None
                
            stock = product_data.get("stock", product_data.get("inventory", 0))
            logger.info(f"[ProductInventoryService] 从API获取到产品 {product_no} 库存: {stock}")
            return stock
            
        except Exception as e:
            logger.error(f"[ProductInventoryService] 获取产品 {product_no} 库存失败: {str(e)}")
            return None 