from fastapi import APIRouter
from app.api.endpoints import product, static_order
from app.routers import callback

api_router = APIRouter()

# 注册产品相关路由，移除prefix以使用路由中定义的完整路径
api_router.include_router(
    product.router,
    tags=["product"]
)

# 注册静态代理订单路由
api_router.include_router(
    static_order.router,
    tags=["static_order"]
)

# 注册回调路由
api_router.include_router(
    callback.router,
    tags=["callback"]
) 