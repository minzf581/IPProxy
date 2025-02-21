from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import UploadFile
import pandas as pd
import io
import logging
from decimal import Decimal
from app.models.product_inventory import ProductInventory
from app.models.prices import AgentPrice, UserPrice
from app.schemas.product import (
    ProductPriceBase,
    ProductPriceUpdateRequest,
    ImportPriceItem,
    ImportResult
)

logger = logging.getLogger(__name__)

def get_prices(
    db: Session,
    is_global: bool,
    agent_id: Optional[int] = None,
    proxy_types: Optional[List[int]] = None
) -> List[ProductPriceBase]:
    """获取价格列表"""
    try:
        logger.info(f"开始获取价格列表: is_global={is_global}, agent_id={agent_id}, proxy_types={proxy_types}")
        query = db.query(ProductInventory)
        
        # 添加代理类型过滤
        if proxy_types:
            logger.info(f"添加代理类型过滤条件: {proxy_types}")
            proxy_types = [int(pt) for pt in proxy_types]
            query = query.filter(ProductInventory.proxy_type.in_(proxy_types))
        
        # 获取基础产品信息
        products = query.all()
        logger.info(f"查询到 {len(products)} 个产品")
        
        # 如果是代理商查询，获取代理商价格设置
        agent_prices = {}
        if agent_id:
            logger.info(f"查询代理商 {agent_id} 的价格设置")
            prices = db.query(AgentPrice).filter(
                AgentPrice.agent_id == agent_id
            ).all()
            agent_prices = {p.product_id: p.price for p in prices}
            logger.info(f"找到代理商价格设置: {len(agent_prices)} 条记录")
        
        result = []
        for product in products:
            try:
                # 确定价格
                price = None
                min_agent_price = float(product.min_agent_price) if product.min_agent_price else 0
                
                if agent_id and product.id in agent_prices:
                    logger.info(f"使用代理商价格: product_id={product.id}, price={agent_prices[product.id]}")
                    price = float(agent_prices[product.id])
                else:
                    logger.info(f"使用全局价格: product_id={product.id}, price={product.global_price}")
                    price = float(product.global_price) if product.global_price else float(product.cost_price)
                
                # 记录IP白名单信息
                ip_whitelist = product.ip_whitelist if product.ip_whitelist else []
                logger.info(f"产品 {product.id} 的IP白名单: {ip_whitelist}")
                
                price_info = ProductPriceBase(
                    id=product.id,
                    type=product.product_no,
                    proxyType=product.proxy_type,
                    area=product.area_code,
                    country=product.country_code,
                    city=product.city_code,
                    ipRange=f"{product.ip_start}-{product.ip_end}" if product.ip_start and product.ip_end else None,
                    price=Decimal(str(price)) if price else Decimal(str(product.cost_price)),
                    minAgentPrice=Decimal(str(min_agent_price)) if min_agent_price else Decimal('0'),
                    isGlobal=is_global,
                    createdAt=product.created_at,
                    updatedAt=product.updated_at,
                    ipWhitelist=ip_whitelist
                )
                
                result.append(price_info)
            except Exception as e:
                logger.error(f"处理产品 {product.id} 时发生错误: {str(e)}", exc_info=True)
                continue
        
        return result
    except Exception as e:
        logger.error(f"获取价格列表时发生错误: {str(e)}", exc_info=True)
        raise

def update_prices(
    db: Session,
    request: ProductPriceUpdateRequest
) -> bool:
    """更新价格"""
    try:
        logger.info(f"开始更新价格: is_global={request.is_global}, agent_id={request.agent_id}")
        logger.info(f"待更新的价格数据: {[p.dict() for p in request.prices]}")

        # 如果有agent_id，强制设置is_global为False
        if request.agent_id:
            request.is_global = False
            logger.info(f"检测到agent_id={request.agent_id}，强制设置is_global=False")

        if request.is_global:
            # 更新全局价格
            for price_update in request.prices:
                logger.info(f"更新全局价格: product_id={price_update.id}, price={price_update.price}")
                product = db.query(ProductInventory).get(price_update.id)
                if product:
                    old_price = product.global_price
                    product.global_price = price_update.price
                    if hasattr(price_update, 'min_agent_price') and price_update.min_agent_price is not None:
                        product.min_agent_price = price_update.min_agent_price
                        # 检查并更新所有低于最低代理商价格的用户价格
                        user_prices = db.query(UserPrice).filter(
                            UserPrice.product_id == price_update.id,
                            UserPrice.price < price_update.min_agent_price
                        ).all()
                        for user_price in user_prices:
                            user_price.price = price_update.min_agent_price
                            logger.info(f"更新用户价格到最低代理商价格: user_id={user_price.user_id}, product_id={price_update.id}, new_price={price_update.min_agent_price}")
                    logger.info(f"全局价格更新成功: product_id={price_update.id}, old_price={old_price}, new_price={price_update.price}, min_agent_price={price_update.min_agent_price if hasattr(price_update, 'min_agent_price') else None}")
                else:
                    logger.warning(f"未找到产品: product_id={price_update.id}")
        
        elif request.agent_id:  # 确保有代理商ID
            # 更新代理商价格
            for price_update in request.prices:
                logger.info(f"更新代理商价格: agent_id={request.agent_id}, product_id={price_update.id}, price={price_update.price}")
                
                # 查找产品
                product = db.query(ProductInventory).get(price_update.id)
                if not product:
                    logger.warning(f"未找到产品: product_id={price_update.id}")
                    continue
                
                # 查找或创建代理商价格记录
                agent_price = db.query(AgentPrice).filter(
                    AgentPrice.agent_id == request.agent_id,
                    AgentPrice.product_id == price_update.id
                ).first()
                
                if agent_price:
                    # 更新现有价格记录
                    old_price = agent_price.price
                    agent_price.price = price_update.price
                    logger.info(f"更新现有代理商价格: agent_id={request.agent_id}, product_id={price_update.id}, old_price={old_price}, new_price={price_update.price}")
                else:
                    # 创建新的价格记录
                    logger.info(f"创建新的代理商价格记录: agent_id={request.agent_id}, product_id={price_update.id}, price={price_update.price}")
                    agent_price = AgentPrice(
                        agent_id=request.agent_id,
                        product_id=price_update.id,
                        price=price_update.price
                    )
                    db.add(agent_price)
        
        try:
            db.commit()
            logger.info("价格更新提交成功")
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"价格更新提交失败: {str(e)}")
            raise
            
    except Exception as e:
        logger.error(f"更新价格失败: {str(e)}")
        db.rollback()
        raise e

async def import_prices(db: Session, file: UploadFile) -> Dict:
    """导入价格数据"""
    try:
        # 读取Excel文件
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        total = len(df)
        success = 0
        failed = 0
        
        for _, row in df.iterrows():
            try:
                # 查找对应的产品
                product = db.query(ProductInventory).filter(
                    ProductInventory.area_code == row['区域'],
                    ProductInventory.country_code == row['国家'],
                    ProductInventory.city_code == row['城市']
                ).first()
                
                if product:
                    # 更新价格
                    product.global_price = float(row['价格'])
                    success += 1
                else:
                    failed += 1
                    
            except Exception as e:
                print(f"导入行数据失败: {str(e)}")
                failed += 1
                continue
        
        db.commit()
        return {
            "total": total,
            "success": success,
            "failed": failed
        }
        
    except Exception as e:
        db.rollback()
        raise e

def batch_import_prices(db: Session, prices: List[ImportPriceItem]) -> ImportResult:
    """批量导入价格数据"""
    total = len(prices)
    success = 0
    failed = 0
    
    logger.info(f"开始批量更新价格，共 {total} 条数据")

    try:
        for price in prices:
            try:
                logger.debug(f"处理产品价格: {price.dict()}")
                # 使用产品ID直接查找
                product = db.query(ProductInventory).filter(
                    ProductInventory.id == price.product_id
                ).first()

                if product:
                    logger.info(f"更新产品 {price.product_id} 的价格: {price.price} -> {price.min_agent_price}")
                    # 更新全局价格和最低代理商价格
                    product.global_price = price.price
                    product.min_agent_price = price.min_agent_price

                    # 更新所有代理商的价格
                    agent_prices = db.query(AgentPrice).filter(
                        AgentPrice.product_id == price.product_id
                    ).all()
                    
                    for agent_price in agent_prices:
                        # 如果代理商价格低于最低代理商价格，则更新为最低代理商价格
                        if agent_price.price < price.min_agent_price:
                            agent_price.price = price.min_agent_price
                            logger.info(f"更新代理商 {agent_price.agent_id} 的价格到最低代理商价格: {price.min_agent_price}")

                    # 检查并更新用户价格
                    user_prices = db.query(UserPrice).filter(
                        UserPrice.product_id == price.product_id,
                        UserPrice.price < price.min_agent_price
                    ).all()
                    
                    for user_price in user_prices:
                        user_price.price = price.min_agent_price
                        logger.info(f"更新用户 {user_price.user_id} 的价格到最低代理商价格: {price.min_agent_price}")

                    success += 1
                else:
                    logger.warning(f"未找到产品: {price.product_id}")
                    failed += 1

            except Exception as e:
                logger.error(f"更新产品 {price.product_id} 价格失败: {str(e)}")
                failed += 1
                continue

        db.commit()
        logger.info(f"价格更新完成: 总数={total}, 成功={success}, 失败={failed}")
        return ImportResult(
            total=total,
            success=success,
            failed=failed
        )

    except Exception as e:
        logger.error(f"批量更新价格失败: {str(e)}")
        db.rollback()
        raise e

def get_product_price(
    db: Session,
    product_id: int,
    user_id: Optional[int] = None,
    agent_id: Optional[int] = None
) -> Dict[str, Any]:
    """获取产品价格
    优先级：用户价格 > 代理商价格 > 全局价格
    """
    try:
        product = db.query(ProductInventory).get(product_id)
        if not product:
            raise ValueError(f"产品不存在: {product_id}")

        # 查询用户价格
        if user_id:
            user_price = db.query(UserPrice).filter(
                UserPrice.user_id == user_id,
                UserPrice.product_id == product_id
            ).first()
            if user_price:
                return {
                    "price": float(user_price.price),
                    "type": "user",
                    "min_price": float(product.min_agent_price)
                }

        # 查询代理商价格
        if agent_id:
            agent_price = db.query(AgentPrice).filter(
                AgentPrice.agent_id == agent_id,
                AgentPrice.product_id == product_id
            ).first()
            if agent_price:
                return {
                    "price": float(agent_price.price),
                    "type": "agent",
                    "min_price": float(product.min_agent_price)
                }

        # 返回全局价格
        return {
            "price": float(product.global_price),
            "type": "global",
            "min_price": float(product.min_agent_price)
        }

    except Exception as e:
        logger.error(f"获取产品价格失败: {str(e)}")
        raise

def initialize_agent_price(
    db: Session,
    agent_id: int,
    product_id: int
) -> AgentPrice:
    """初始化代理商价格（使用全局价格）"""
    try:
        # 检查是否已存在
        existing_price = db.query(AgentPrice).filter(
            AgentPrice.agent_id == agent_id,
            AgentPrice.product_id == product_id
        ).first()
        
        if existing_price:
            return existing_price

        # 获取产品全局价格
        product = db.query(ProductInventory).get(product_id)
        if not product:
            raise ValueError(f"产品不存在: {product_id}")

        # 创建代理商价格记录
        agent_price = AgentPrice(
            agent_id=agent_id,
            product_id=product_id,
            price=product.global_price
        )
        
        db.add(agent_price)
        db.commit()
        logger.info(f"初始化代理商价格成功: agent_id={agent_id}, product_id={product_id}, price={product.global_price}")
        
        return agent_price

    except Exception as e:
        db.rollback()
        logger.error(f"初始化代理商价格失败: {str(e)}")
        raise

def initialize_user_price(
    db: Session,
    user_id: int,
    product_id: int,
    agent_id: int
) -> UserPrice:
    """初始化用户价格（使用全局价格）"""
    try:
        # 检查是否已存在
        existing_price = db.query(UserPrice).filter(
            UserPrice.user_id == user_id,
            UserPrice.product_id == product_id
        ).first()
        
        if existing_price:
            return existing_price

        # 获取产品全局价格
        product = db.query(ProductInventory).get(product_id)
        if not product:
            raise ValueError(f"产品不存在: {product_id}")

        # 创建用户价格记录
        user_price = UserPrice(
            user_id=user_id,
            product_id=product_id,
            agent_id=agent_id,
            price=product.global_price
        )
        
        db.add(user_price)
        db.commit()
        logger.info(f"初始化用户价格成功: user_id={user_id}, product_id={product_id}, price={product.global_price}")
        
        return user_price

    except Exception as e:
        db.rollback()
        logger.error(f"初始化用户价格失败: {str(e)}")
        raise

def get_agent_prices(
    db: Session,
    agent_id: int
) -> List[Dict[str, Any]]:
    """获取代理商的所有产品价格"""
    try:
        agent_prices = db.query(AgentPrice).filter(
            AgentPrice.agent_id == agent_id
        ).all()
        
        return [price.to_dict() for price in agent_prices]
        
    except Exception as e:
        logger.error(f"获取代理商价格列表失败: {str(e)}")
        raise

def get_user_prices(
    db: Session,
    user_id: int
) -> List[Dict[str, Any]]:
    """获取用户的所有产品价格"""
    try:
        user_prices = db.query(UserPrice).filter(
            UserPrice.user_id == user_id
        ).all()
        
        return [price.to_dict() for price in user_prices]
        
    except Exception as e:
        logger.error(f"获取用户价格列表失败: {str(e)}")
        raise 