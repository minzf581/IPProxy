"""
代理服务路由模块
==============

此模块处理所有与代理服务相关的路由请求，包括：
- 动态代理管理
- 静态代理管理
- 代理池管理
- 价格计算
- 流量统计

重要提示：
---------
1. 所有API路由都需要遵循统一的响应格式
2. 错误处理需要保持一致性
3. 日志记录需要包含关键信息

依赖关系：
---------
- 数据模型：
  - ProxyInfo (app/models/dashboard.py)
  - FlowUsage (app/models/transaction.py)
  - ProductInventory (app/models/product_inventory.py)
  - User (app/models/user.py)
- 服务层：
  - ProxyService (app/services/proxy.py)
- 前端对应：
  - 服务层：src/services/proxyService.ts
  - 组件：src/pages/proxy/index.tsx

修改注意事项：
------------
1. API路由：
   - 保持与API文档的一致性
   - 确保与前端请求路径匹配
   - 维护版本兼容性

2. 参数验证：
   - 所有输入参数需要进行验证
   - 特别注意敏感参数的处理
   - 保持与前端类型定义的一致性

3. 错误处理：
   - 统一的错误响应格式
   - 详细的错误日志记录
   - 合适的错误码使用

4. 数据处理：
   - 注意数据类型转换
   - 处理空值和默认值
   - 保持数据一致性

5. 性能考虑：
   - 避免重复的API调用
   - 合理使用数据库会话
   - 考虑并发请求处理
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dashboard import ProxyInfo
from app.models.transaction import FlowUsage
from app.models.product_inventory import ProductInventory
from app.models.user import User
from app.core.deps import get_proxy_service
from app.services import ProxyService
from typing import Dict, Any, List, Optional
import logging
import json
from datetime import datetime
import traceback

router = APIRouter()
logger = logging.getLogger(__name__)

def log_request_info(func_name: str, **kwargs):
    """记录请求信息的辅助函数"""
    logger.info(f"[{func_name}] Request started at {datetime.now()}")
    logger.info(f"[{func_name}] Parameters: {json.dumps(kwargs, ensure_ascii=False)}")

def log_response_info(func_name: str, response: Any):
    """记录响应信息的辅助函数"""
    logger.info(f"[{func_name}] Response: {json.dumps(response, ensure_ascii=False)}")
    logger.info(f"[{func_name}] Request completed at {datetime.now()}")

@router.get("/open/app/proxy/dynamic/list/v2")
async def get_dynamic_proxy_list(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    ip: Optional[str] = None,
    status: Optional[str] = None,
    protocol: Optional[str] = None,
    proxy_service: ProxyService = Depends(get_proxy_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取动态代理列表"""
    func_name = "get_dynamic_proxy_list"
    try:
        log_request_info(func_name, page=page, pageSize=pageSize, ip=ip, status=status, protocol=protocol)
        
        params = {
            "page": page,
            "pageSize": pageSize,
            "proxyType": 104,  # 动态代理类型
        }
        if ip:
            params["ip"] = ip
        if status:
            params["status"] = status
        if protocol:
            params["protocol"] = protocol
            
        logger.info(f"[{func_name}] Calling ProxyService with params: {json.dumps(params, ensure_ascii=False)}")
        response = await proxy_service.get_dynamic_proxy_list(params)
        logger.info(f"[{func_name}] Service response: {json.dumps(response, ensure_ascii=False)}")
        
        result = {
            "code": 0,
            "msg": "success",
            "data": response
        }
        log_response_info(func_name, result)
        return result
    except Exception as e:
        logger.error(f"[{func_name}] Error: {str(e)}", exc_info=True)
        logger.error(f"[{func_name}] Stack trace:", stack_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/open/app/proxy/pools/v2")
async def get_proxy_pools(
    proxy_service: ProxyService = Depends(get_proxy_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理池列表"""
    func_name = "get_proxy_pools"
    try:
        log_request_info(func_name)
        
        logger.info(f"[{func_name}] Calling ProxyService for proxy pools")
        response = await proxy_service.get_proxy_pools(104)  # 动态代理类型
        logger.info(f"[{func_name}] Service response: {json.dumps(response, ensure_ascii=False)}")
        
        result = {
            "code": 0,
            "msg": "success",
            "data": response
        }
        log_response_info(func_name, result)
        return result
    except Exception as e:
        logger.error(f"[{func_name}] Error: {str(e)}", exc_info=True)
        logger.error(f"[{func_name}] Stack trace:", stack_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/open/app/proxy/price/calculate/v2")
async def calculate_proxy_price(
    poolId: str,
    trafficAmount: int,
    proxy_service: ProxyService = Depends(get_proxy_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """计算代理价格"""
    func_name = "calculate_proxy_price"
    try:
        log_request_info(func_name, poolId=poolId, trafficAmount=trafficAmount)
        
        params = {
            "poolId": poolId,
            "trafficAmount": trafficAmount
        }
        logger.info(f"[{func_name}] Calling ProxyService with params: {json.dumps(params, ensure_ascii=False)}")
        response = await proxy_service.calculate_price(params)
        logger.info(f"[{func_name}] Service response: {json.dumps(response, ensure_ascii=False)}")
        
        result = {
            "code": 0,
            "msg": "success",
            "data": {
                "price": float(response.get("price", 0))
            }
        }
        log_response_info(func_name, result)
        return result
    except Exception as e:
        logger.error(f"[{func_name}] Error: {str(e)}", exc_info=True)
        logger.error(f"[{func_name}] Stack trace:", stack_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/open/app/proxy/open/v2")
async def open_dynamic_proxy(
    poolId: str,
    trafficAmount: int,
    username: Optional[str] = None,
    password: Optional[str] = None,
    remark: Optional[str] = None,
    proxy_service: ProxyService = Depends(get_proxy_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """开通动态代理"""
    try:
        params = {
            "poolId": poolId,
            "trafficAmount": trafficAmount,
            "proxyType": 104  # 动态代理类型
        }
        if username:
            params["username"] = username
        if password:
            params["password"] = password
        if remark:
            params["remark"] = remark
            
        response = await proxy_service.open_proxy(params)
        return {
            "code": 0,
            "msg": "success",
            "data": response
        }
    except Exception as e:
        logger.error(f"开通动态代理失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/open/app/proxy/refresh/v2/{orderNo}")
async def refresh_dynamic_proxy(
    orderNo: str,
    proxy_service: ProxyService = Depends(get_proxy_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """刷新动态代理"""
    try:
        response = await proxy_service.refresh_proxy(orderNo)
        return {
            "code": 0,
            "msg": "success",
            "data": response
        }
    except Exception as e:
        logger.error(f"刷新动态代理失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/open/app/proxy/info/v2")
async def get_proxy_info(
    proxy_service: ProxyService = Depends(get_proxy_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理信息"""
    try:
        proxy_info = await proxy_service.get_proxy_info()
        return {
            "code": 0,
            "msg": "success",
            "data": proxy_info
        }
    except Exception as e:
        logger.error(f"获取代理信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/open/app/proxy/flow/use/log/v2")
async def get_flow_usage(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """获取流量使用记录"""
    flow_usage = db.query(FlowUsage).first()
    if not flow_usage:
        # 如果没有数据，创建测试数据
        flow_usage = FlowUsage(
            monthly_usage=150.5,    # 本月已使用 150.5GB
            daily_usage=5.2,        # 今日已使用 5.2GB
            last_month_usage=200.8  # 上月使用 200.8GB
        )
        db.add(flow_usage)
        db.commit()
        db.refresh(flow_usage)
    
    return {
        "code": "200",
        "msg": "success",
        "data": {
            "monthlyUsage": flow_usage.monthly_usage,
            "dailyUsage": flow_usage.daily_usage,
            "lastMonthUsage": flow_usage.last_month_usage
        }
    }

@router.post("/open/app/product/query/v2")
async def query_product(
    request: Dict[str, Any],
    proxy_service: ProxyService = Depends(get_proxy_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """查询产品信息"""
    func_name = "query_product"
    try:
        logger.info(f"[{func_name}] 开始处理请求")
        logger.info(f"[{func_name}] 请求参数类型: {type(request)}")
        logger.info(f"[{func_name}] 请求参数内容: {json.dumps(request, ensure_ascii=False)}")
        
        # 处理加密参数
        if "params" in request:
            try:
                encrypted_params = request.get("params")
                logger.info(f"[{func_name}] 收到加密参数: {encrypted_params}")
                decrypted_params = proxy_service._decrypt_response(encrypted_params)
                logger.info(f"[{func_name}] 解密后参数: {decrypted_params}")
                if not isinstance(decrypted_params, dict):
                    logger.error(f"[{func_name}] 解密后参数格式错误: {type(decrypted_params)}")
                    return {
                        "code": 400,
                        "msg": "参数格式错误",
                        "data": []
                    }
                request = decrypted_params
            except Exception as e:
                logger.error(f"[{func_name}] 解密参数失败: {str(e)}")
                return {
                    "code": 400,
                    "msg": "参数解密失败",
                    "data": []
                }

        # 参数名称映射
        param_mapping = {
            "regionCode": "regionCode",
            "countryCode": "countryCode",
            "cityCode": "cityCode",
            "proxyType": "proxyType"
        }
        
        mapped_request = {}
        for frontend_key, backend_key in param_mapping.items():
            if frontend_key in request:
                mapped_request[backend_key] = request[frontend_key]
        
        # 验证必要参数
        required_fields = ["regionCode", "countryCode", "cityCode", "proxyType"]
        missing_fields = [field for field in required_fields if field not in mapped_request]
        if missing_fields:
            error_msg = f"缺少必要参数: {', '.join(missing_fields)}"
            logger.error(f"[{func_name}] {error_msg}")
            return {
                "code": 400,
                "msg": error_msg,
                "data": []
            }
            
        # 处理 proxyType 参数
        try:
            proxy_type = mapped_request["proxyType"]
            if isinstance(proxy_type, str):
                if proxy_type.lower() == "static":
                    proxy_type = 1
                elif proxy_type.lower() == "dynamic":
                    proxy_type = 2
                else:
                    proxy_type = int(proxy_type)
            mapped_request["proxyType"] = [proxy_type]  # 转换为数组格式
        except (ValueError, TypeError) as e:
            logger.error(f"[{func_name}] proxyType 转换失败: {str(e)}")
            return {
                "code": 400,
                "msg": "proxyType 参数格式错误",
                "data": []
            }
            
        # 调用服务
        try:
            response = await proxy_service.query_product(mapped_request)
            logger.info(f"[{func_name}] 服务调用成功")
            logger.info(f"[{func_name}] 响应内容: {json.dumps(response, ensure_ascii=False)}")
            
            # 如果没有找到IP段，返回默认的ALL选项
            if not response or len(response) == 0:
                default_response = [{
                    "ipStart": "ALL",
                    "ipEnd": "ALL",
                    "ipCount": 0,
                    "stock": 999999,
                    "staticType": request.get("staticType", "1"),
                    "countryCode": mapped_request["countryCode"],
                    "cityCode": mapped_request["cityCode"],
                    "regionCode": mapped_request["regionCode"],
                    "price": 0,
                    "status": 1
                }]
                return {
                    "code": 0,
                    "msg": "success",
                    "data": default_response
                }
                
            return {
                "code": 0,
                "msg": "success",
                "data": response
            }
        except Exception as e:
            logger.error(f"[{func_name}] 服务调用失败: {str(e)}")
            logger.error(f"[{func_name}] 错误堆栈:", exc_info=True)
            return {
                "code": 500,
                "msg": f"服务调用失败: {str(e)}",
                "data": []
            }
            
    except Exception as e:
        logger.error(f"[{func_name}] Error: {str(e)}")
        return {
            "code": 500,
            "msg": str(e),
            "data": []
        }

@router.get("/business/dynamic-proxy/products")
async def get_dynamic_proxy_products(
    proxy_service: ProxyService = Depends(get_proxy_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取动态代理产品区域列表"""
    func_name = "get_dynamic_proxy_products"
    try:
        log_request_info(func_name)
        
        # 记录数据库会话信息
        logger.debug(f"[{func_name}] Database session: {db}")
        
        # 从数据库中获取已同步的动态代理区域列表
        logger.debug(f"[{func_name}] 开始查询动态代理产品")
        query = db.query(ProductInventory).filter(
            ProductInventory.enable == 1,
            ProductInventory.proxy_type == 104  # 动态代理类型
        )
        
        # 记录SQL查询语句
        logger.debug(f"[{func_name}] SQL Query: {query.statement}")
        
        products = query.all()
        
        # 记录查询结果
        logger.debug(f"[{func_name}] 查询到 {len(products)} 个产品")
        
        # 记录每个产品的详细信息
        for product in products:
            logger.debug(f"[{func_name}] 产品详细信息:")
            logger.debug(f"  - product_no: {product.product_no}")
            logger.debug(f"  - area_code: {product.area_code}")
            logger.debug(f"  - country_code: {product.country_code}")
            logger.debug(f"  - city_code: {product.city_code}")
            logger.debug(f"  - global_price: {product.global_price}")
            logger.debug(f"  - enable: {product.enable}")
            logger.debug(f"  - proxy_type: {product.proxy_type}")
            logger.debug(f"  - 所有属性: {vars(product)}")
        
        # 转换为前端需要的格式，添加默认区域信息
        result = []
        for product in products:
            logger.debug(f"[{func_name}] 处理产品: {product.product_no}")
            if product.product_no == 'out_dynamic_1':
                result.append({
                    "productNo": product.product_no,
                    "areaCode": "GLOBAL",  # 默认全球
                    "countryCode": "ALL",   # 默认所有国家
                    "cityCode": "ALL",      # 默认所有城市
                    "price": float(product.global_price or 0),
                    "status": product.enable,
                    "name": product.product_name or "海外动态代理"
                })
            else:
                result.append({
                    "productNo": product.product_no,
                    "areaCode": product.area_code or "",
                    "countryCode": product.country_code or "",
                    "cityCode": product.city_code or "",
                    "price": float(product.global_price or 0),
                    "status": product.enable,
                    "name": product.product_name
                })
            
        response = {
            "code": 0,
            "msg": "success",
            "data": result
        }
        
        # 记录响应信息
        log_response_info(func_name, response)
        return response
        
    except Exception as e:
        logger.error(f"[{func_name}] Error: {str(e)}", exc_info=True)
        logger.error(f"[{func_name}] Stack trace:", stack_info=True)
        return {
            "code": 500,
            "msg": f"获取产品列表失败: {str(e)}",
            "data": None,
            "error_details": {
                "error_type": type(e).__name__,
                "error_message": str(e),
                "timestamp": datetime.now().isoformat()
            }
        }

@router.post("/business/dynamic-proxy/create-user")
async def create_dynamic_proxy_user(
    request: Dict[str, Any],
    proxy_service: ProxyService = Depends(get_proxy_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """创建动态代理用户（子账号）"""
    func_name = "create_dynamic_proxy_user"
    try:
        # 记录请求开始
        logger.info(f"[{func_name}] 开始处理创建代理用户请求")
        log_request_info(func_name, **request)
        
        # 验证必要参数
        required_fields = ["appUsername", "limitFlow", "remark"]
        missing_fields = [field for field in required_fields if field not in request]
        if missing_fields:
            error_msg = f"缺少必要参数: {', '.join(missing_fields)}"
            logger.error(f"[{func_name}] {error_msg}")
            return {
                "code": 400,
                "msg": error_msg,
                "data": None
            }
        
        # 记录数据库会话信息
        logger.debug(f"[{func_name}] 数据库会话: {db}")
        
        try:
            # 从数据库获取代理商信息
            logger.info(f"[{func_name}] 开始查询代理商信息: appUsername={request['appUsername']}")
            agent = db.query(User).filter(
                User.app_username == request["appUsername"],
                User.is_agent == True,  # 确保是代理商
                User.status == 1  # 确保账号是激活状态
            ).first()
            
            logger.debug(f"[{func_name}] 查询结果: {agent}")
            
            if not agent:
                error_msg = f"未找到代理商: {request['appUsername']}"
                logger.error(f"[{func_name}] {error_msg}")
                return {
                    "code": 404,
                    "msg": error_msg,
                    "data": None
                }
            
            # 记录代理商详细信息（排除敏感信息）
            logger.info(f"[{func_name}] 找到代理商:")
            logger.info(f"  - ID: {agent.id}")
            logger.info(f"  - 用户名: {agent.username}")
            logger.info(f"  - 应用用户名: {agent.app_username}")
            logger.info(f"  - 平台账号: {agent.platform_account}")
            logger.info(f"  - 状态: {agent.status}")
            logger.info(f"  - 是否代理商: {agent.is_agent}")
            
            # 准备请求参数
            params = {
                "appUsername": request["appUsername"],
                "limitFlow": request["limitFlow"],  # MB为单位
                "remark": request["remark"],
                "platformAccount": agent.platform_account,  # 平台主账号
                "channelAccount": agent.app_username,   # 渠道商主账号就是 app_username
            }
            
            logger.info(f"[{func_name}] 准备调用IPIPV API, 参数: {json.dumps(params, ensure_ascii=False)}")
            
            # 调用IPIPV API创建代理用户
            response = await proxy_service.create_proxy_user(params)
            logger.info(f"[{func_name}] IPIPV API响应: {json.dumps(response, ensure_ascii=False)}")
            
            if response.get("code") == 0:
                logger.info(f"[{func_name}] 创建代理用户成功")
                return {
                    "code": 0,
                    "msg": "success",
                    "data": response.get("data")
                }
            else:
                error_msg = response.get("msg", "创建代理用户失败")
                logger.error(f"[{func_name}] {error_msg}")
                return {
                    "code": response.get("code", 500),
                    "msg": error_msg,
                    "data": None
                }
                
        except Exception as db_error:
            logger.error(f"[{func_name}] 数据库操作失败: {str(db_error)}")
            logger.error(traceback.format_exc())
            return {
                "code": 500,
                "msg": f"数据库操作失败: {str(db_error)}",
                "data": None
            }
            
    except Exception as e:
        logger.error(f"[{func_name}] Error: {str(e)}", exc_info=True)
        logger.error(f"[{func_name}] Stack trace:", stack_info=True)
        return {
            "code": 500,
            "msg": f"创建代理用户失败: {str(e)}",
            "data": None,
            "error_details": {
                "error_type": type(e).__name__,
                "error_message": str(e),
                "timestamp": datetime.now().isoformat()
            }
        }