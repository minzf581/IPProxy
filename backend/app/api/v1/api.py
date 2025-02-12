from fastapi import APIRouter
from app.api.v1 import product_prices

api_router = APIRouter()

# 注册价格管理路由
api_router.include_router(
    product_prices.router,
    prefix="/product",
    tags=["product"]
) 