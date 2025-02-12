from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from fastapi import UploadFile
import pandas as pd
import io
import logging
from decimal import Decimal
from app.models.product_inventory import ProductInventory
from app.models.agent_price import AgentPrice
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
    agent_id: Optional[int] = None
) -> List[ProductPriceBase]:
    """获取价格列表"""
    try:
        logger.info(f"开始获取价格列表: is_global={is_global}, agent_id={agent_id}")
        query = db.query(ProductInventory)
        
        # 获取基础产品信息
        products = query.all()
        logger.info(f"查询到 {len(products)} 个产品")
        result = []
        
        for product in products:
            try:
                logger.debug(f"处理产品 ID: {product.id}")
                # 构建基础价格信息
                price_info = ProductPriceBase(
                    id=product.id,
                    type=product.product_no,  # 使用产品编号作为类型
                    proxyType=product.proxy_type,
                    area=product.area_code,
                    country=product.country_code,
                    city=product.city_code,
                    ipRange=f"{product.ip_start}-{product.ip_end}" if product.ip_start and product.ip_end else None,
                    price=Decimal(str(product.global_price)) if product.global_price else Decimal(str(product.cost_price)),
                    isGlobal=is_global,
                    createdAt=product.created_at,
                    updatedAt=product.updated_at
                )
                
                logger.debug(f"产品 {product.id} 的价格信息: {price_info}")
                result.append(price_info)
            except Exception as e:
                logger.error(f"处理产品 {product.id} 时发生错误: {str(e)}", exc_info=True)
                continue
        
        logger.info(f"成功处理 {len(result)} 个产品价格")
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
        if request.is_global:
            # 更新全局价格
            for price_update in request.prices:
                product = db.query(ProductInventory).get(price_update.id)
                if product:
                    product.global_price = price_update.price
        else:
            # 更新代理商价格
            agent_price = db.query(AgentPrice).filter(
                AgentPrice.agent_id == request.agent_id
            ).first()
            
            if not agent_price:
                # 创建新的价格记录
                agent_price = AgentPrice(
                    agent_id=request.agent_id,
                    dynamic_proxy_price=0.1,
                    static_proxy_price=0.2
                )
                db.add(agent_price)
            
            # 根据产品类型更新价格
            for price_update in request.prices:
                product = db.query(ProductInventory).get(price_update.id)
                if product:
                    if product.proxy_type == 1:
                        agent_price.dynamic_proxy_price = price_update.price
                    else:
                        agent_price.static_proxy_price = price_update.price
        
        db.commit()
        return True
    except Exception as e:
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

    try:
        for price in prices:
            try:
                # 查找对应的产品
                product = db.query(ProductInventory).filter(
                    ProductInventory.area_code == price.area,
                    ProductInventory.country_code == price.country,
                    ProductInventory.city_code == price.city
                ).first()

                if product:
                    # 更新价格
                    product.global_price = price.price
                    success += 1
                else:
                    failed += 1

            except Exception as e:
                print(f"导入单条数据失败: {str(e)}")
                failed += 1
                continue

        db.commit()
        return ImportResult(
            total=total,
            success=success,
            failed=failed
        )

    except Exception as e:
        db.rollback()
        raise e 