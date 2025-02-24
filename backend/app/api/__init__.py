from fastapi import APIRouter
from app.api.endpoints import product

api_router = APIRouter()

# 注册产品相关路由，移除prefix以使用路由中定义的完整路径
api_router.include_router(
    product.router,
    tags=["product"]
) 