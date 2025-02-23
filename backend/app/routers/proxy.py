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

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import logging
import traceback
import json
from datetime import datetime
from app.core.config import settings

from app.database import get_db
from app.models.user import User
from app.models.dashboard import ProxyInfo
from app.models.transaction import FlowUsage
from app.models.product_inventory import ProductInventory
from app.services.auth import get_current_user
from app.core.deps import get_proxy_service, get_area_service, get_product_service
from app.services.proxy_service import ProxyService
from app.services.area_service import AreaService
from app.services.product_service import ProductService

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
    try:
        logger.info(f"[query_product] 开始查询产品: {request}")
        return await proxy_service.query_product(request, db)
    except Exception as e:
        logger.error(f"[query_product] 查询产品失败: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "code": 500,
            "msg": f"查询产品失败: {str(e)}",
            "data": []
        }

@router.get("/business/dynamic-proxy/products")
async def get_dynamic_proxy_products(
    proxy_service: ProxyService = Depends(get_proxy_service),
    product_service: ProductService = Depends(get_product_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取动态代理产品列表"""
    try:
        logger.debug("[get_dynamic_proxy_products] 开始查询动态代理产品")
        
        # 从数据库查询动态代理产品
        products = db.query(ProductInventory).filter(
            ProductInventory.proxy_type == 104,  # 动态代理类型
            ProductInventory.enable == True
        ).all()
        
        # 如果没有产品数据，直接返回空数组
        if not products:
            logger.info("[get_dynamic_proxy_products] 未找到产品数据")
            return {
                "code": 0,
                "msg": "success",
                "data": []
            }
        
        logger.debug(f"[get_dynamic_proxy_products] 查询到 {len(products)} 个产品")
        
        # 格式化产品数据
        formatted_products = []
        for product in products:
            logger.debug(f"[get_dynamic_proxy_products] 处理产品: {product.product_no}")
            formatted_product = {
                "id": product.id,
                "type": product.product_no,
                "proxyType": product.proxy_type,
                "area": product.area_code or "",
                "country": product.country_code or "",
                "city": product.city_code or "",
                "ipRange": product.ip_start + "-" + product.ip_end if product.ip_start and product.ip_end else "",
                "price": float(product.global_price) if product.global_price else 0,
                "isGlobal": True,  # 默认为全局产品
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
            }
            formatted_products.append(formatted_product)
        
        response = {
            "code": 0,
            "msg": "success",
            "data": formatted_products
        }
        
        logger.info(f"[get_dynamic_proxy_products] Response: {json.dumps(response)}")
        return response
        
    except Exception as e:
        logger.error(f"[get_dynamic_proxy_products] 获取产品列表失败: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "code": 500,
            "msg": f"获取产品列表失败: {str(e)}",
            "data": []
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
        
        try:
            # 从数据库获取代理商信息
            agent_id = request["appUsername"]  # 这里接收的是代理商ID
            logger.info(f"[{func_name}] 开始查询代理商信息: agent_id={agent_id}")
            
            # 确保agent_id是整数
            try:
                agent_id = int(agent_id)
            except (ValueError, TypeError):
                error_msg = f"代理商ID格式错误: {agent_id}"
                logger.error(f"[{func_name}] {error_msg}")
                return {
                    "code": 400,
                    "msg": error_msg,
                    "data": None
                }
            
            # 先查询用户基本信息，不带任何条件
            base_user = db.query(User).filter(User.id == agent_id).first()
            logger.info(f"[{func_name}] 基本用户信息: {vars(base_user) if base_user else None}")
            
            # 查询代理商信息
            query = db.query(User).filter(
                User.id == agent_id,
                User.is_agent == True,  # 确保是代理商
                User.status == 1  # 确保账号是激活状态
            )
            
            # 记录SQL查询语句
            logger.info(f"[{func_name}] SQL查询: {query.statement}")
            
            agent = query.first()
            logger.info(f"[{func_name}] 查询结果: {vars(agent) if agent else None}")
            
            if not agent:
                error_msg = f"未找到代理商账号或账号未激活: ID={agent_id}"
                logger.error(f"[{func_name}] {error_msg}")
                # 记录更多信息以便调试
                if base_user:
                    logger.error(f"[{func_name}] 用户存在但不满足条件:")
                    logger.error(f"  - is_agent: {base_user.is_agent}")
                    logger.error(f"  - status: {base_user.status}")
                return {
                    "code": 404,
                    "msg": error_msg,
                    "data": None
                }
            
            if not agent.app_username:
                error_msg = "代理商app_username未设置"
                logger.error(f"[{func_name}] {error_msg}")
                return {
                    "code": 400,
                    "msg": error_msg,
                    "data": None
                }
            
            # 记录代理商详细信息
            logger.info(f"[{func_name}] 找到代理商:")
            logger.info(f"  - ID: {agent.id}")
            logger.info(f"  - 用户名: {agent.username}")
            logger.info(f"  - 应用用户名: {agent.app_username}")
            logger.info(f"  - 平台账号: {agent.platform_account}")
            logger.info(f"  - 状态: {agent.status}")
            logger.info(f"  - 是否代理商: {agent.is_agent}")
            
            # 准备请求参数
            params = {
                "appUsername": agent.app_username,  # 使用数据库中的app_username
                "limitFlow": request["limitFlow"],  # MB为单位
                "remark": request["remark"],
                "platformAccount": agent.platform_account,  # 平台主账号
                "channelAccount": agent.app_username,   # 渠道商主账号
                "mainUsername": agent.app_username,  # 使用代理商自己的用户名作为主账号
                "appMainUsername": agent.app_username,  # 使用代理商自己的用户名作为主账号
                "user_id": agent.id,  # 添加用户ID
                "agent_id": agent.id  # 添加代理商ID
            }
            
            logger.info(f"[{func_name}] 准备调用IPIPV API, 参数: {json.dumps(params, ensure_ascii=False)}")
            
            # 调用IPIPV API创建代理用户
            response = await proxy_service.create_proxy_user(params)
            logger.info(f"[{func_name}] IPIPV API响应: {json.dumps(response, ensure_ascii=False)}")
            
            # 统一响应格式
            if response.get("code") == 0:  # 服务层返回0表示成功
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
            "data": None
        }

@router.get("/resources")
async def get_proxy_resources(
    current_user: User = Depends(get_current_user),
    proxy_service: ProxyService = Depends(get_proxy_service)
):
    """获取代理资源列表"""
    return await proxy_service.get_proxy_resources(current_user.username)

@router.get("/open/app/proxy/resources/v2")
async def get_proxy_resources(
    username: str,
    agent_id: Optional[int] = None,
    status: Optional[str] = None,
    proxy_service: ProxyService = Depends(get_proxy_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    获取代理资源列表
    """
    try:
        logger.info(f"获取代理资源列表: username={username}, agent_id={agent_id}, status={status}")
        return await proxy_service.get_proxy_resources(username)
    except Exception as e:
        logger.error(f"获取代理资源列表失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": 500,
                "message": f"获取代理资源列表失败: {str(e)}"
            }
        )

@router.post("/business/dynamic-proxy/extract")
async def extract_dynamic_proxy(
    request: Dict[str, Any],
    proxy_service: ProxyService = Depends(get_proxy_service),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """提取动态代理"""
    func_name = "extract_dynamic_proxy"
    try:
        logger.info(f"[{func_name}] 收到提取请求，参数：{json.dumps(request, ensure_ascii=False)}")
        
        # 验证基本参数
        required_fields = ["productNo", "proxyType", "flow"]
        missing_fields = [field for field in required_fields if field not in request]
        if missing_fields:
            error_msg = f"缺少必要参数: {', '.join(missing_fields)}"
            logger.error(f"[{func_name}] {error_msg}")
            return {
                "code": 400,
                "msg": error_msg,
                "data": None
            }
            
        # 获取目标用户
        target_username = request.get("username")
        target_user = None
        if target_username:
            target_user = db.query(User).filter(User.username == target_username).first()
            if not target_user:
                error_msg = f"指定的用户不存在: {target_username}"
                logger.error(f"[{func_name}] {error_msg}")
                return {
                    "code": 404,
                    "msg": error_msg,
                    "data": None
                }
        else:
            target_user = current_user
            
        logger.info(f"[{func_name}] 目标用户: {target_user.username}")
        
        # 构建提取参数
        flow = request["flow"]
        extract_params = {
            "username": target_user.username,
            "userId": target_user.id,
            "agentId": target_user.agent_id,
            "productNo": request["productNo"],
            "proxyType": request["proxyType"],
            "flow": flow,
            "maxFlowLimit": flow,
        }
        
        logger.info(f"[{func_name}] 流量参数: flow={flow}, maxFlowLimit={flow}")
        
        # 添加地址代码
        if "addressCode" in request:
            extract_params["addressCode"] = request["addressCode"]
            logger.info(f"[{func_name}] 使用地址代码: {request['addressCode']}")
        
        # 获取提取配置
        extract_config = request.get("extractConfig", {})
        extract_method = extract_config.get("method", "api")
        logger.info(f"[{func_name}] 提取方式: {extract_method}")
        
        if extract_method == "password":
            # 账密提取方式的特殊参数
            extract_params.update({
                "extractMethod": "password",
                "quantity": extract_config.get("quantity", 1),
                "validTime": extract_config.get("validTime", 5)
            })
            logger.info(f"[{func_name}] 账密提取参数: quantity={extract_params['quantity']}, validTime={extract_params['validTime']}")
        else:
            # API提取方式的特殊参数
            extract_params.update({
                "extractMethod": "api",
                "protocol": extract_config.get("protocol", "socks5"),
                "returnType": extract_config.get("returnType", "txt"),
                "delimiter": extract_config.get("delimiter", 1)
            })
            logger.info(f"[{func_name}] API提取参数: protocol={extract_params['protocol']}, returnType={extract_params['returnType']}, delimiter={extract_params['delimiter']}")
            
        # 调用服务层方法
        logger.info(f"[{func_name}] 最终提取参数: {json.dumps(extract_params, ensure_ascii=False)}")
        response = await proxy_service.extract_proxy_complete(extract_params, db)
        
        logger.info(f"[{func_name}] 格式化后的响应: {json.dumps(response, ensure_ascii=False)}")
        return response
        
    except Exception as e:
        error_msg = f"提取动态代理失败: {str(e)}"
        logger.error(f"[{func_name}] {error_msg}")
        logger.error(traceback.format_exc())
        return {
            "code": 500,
            "msg": error_msg,
            "data": None
        }

@router.get("/open/app/product/area/v2")
async def get_product_area_list(
    proxyType: int,
    productNo: str,
    proxy_service: ProxyService = Depends(get_proxy_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取产品区域列表"""
    func_name = "get_product_area_list"
    try:
        logger.info(f"[{func_name}] 开始获取产品区域列表: proxyType={proxyType}, productNo={productNo}")
        
        # 调用IPIPV API获取区域列表
        response = await proxy_service._make_request(
            "api/open/app/product/area/v2",
            {
                "proxyType": proxyType,
                "productNo": productNo,
                "version": "v2"
            }
        )
        
        logger.info(f"[{func_name}] API响应: {json.dumps(response, ensure_ascii=False)}")
        
        # 确保返回的数据是数组格式
        area_data = []
        if isinstance(response, dict) and "data" in response:
            area_data = response["data"]
        elif isinstance(response, list):
            area_data = response
            
        if not isinstance(area_data, list):
            area_data = []
            
        logger.info(f"[{func_name}] 处理后的区域数据: {json.dumps(area_data, ensure_ascii=False)}")
        
        return {
            "code": 0,
            "msg": "success",
            "data": area_data
        }
        
    except Exception as e:
        logger.error(f"[{func_name}] 获取产品区域列表失败: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "code": 500,
            "msg": f"获取产品区域列表失败: {str(e)}",
            "data": []
        }

@router.post("/business/dynamic-proxy/sync-inventory")
async def sync_inventory(
    proxy_service: ProxyService = Depends(get_proxy_service),
    area_service: AreaService = Depends(get_area_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """同步库存和地域数据"""
    try:
        logger.info("[ProxyRouter] 开始同步库存和地域数据")
        
        # 同步地域数据
        area_result = await area_service.sync_area_data(db)
        if area_result["code"] != 0:
            logger.error(f"[ProxyRouter] 同步地域数据失败: {area_result['msg']}")
            return area_result
            
        logger.info("[ProxyRouter] 地域数据同步完成，开始同步库存")
        
        # 同步库存数据
        inventory_result = await proxy_service.sync_inventory(db)
        if inventory_result["code"] != 0:
            logger.error(f"[ProxyRouter] 同步库存失败: {inventory_result['msg']}")
            return inventory_result
            
        logger.info("[ProxyRouter] 库存同步完成")
        
        return {
            "code": 0,
            "msg": "success",
            "data": "同步完成"
        }
        
    except Exception as e:
        error_msg = f"同步失败: {str(e)}"
        logger.error(f"[ProxyRouter] {error_msg}")
        logger.error(traceback.format_exc())
        return {
            "code": 500,
            "msg": error_msg,
            "data": None
        }

async def get_user_info(db: Session, user_id: int) -> Optional[User]:
    """
    获取用户信息
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        
    Returns:
        Optional[User]: 用户信息，如果不存在返回None
    """
    try:
        return db.query(User).filter(User.id == user_id).first()
    except Exception as e:
        logger.error(f"获取用户信息失败: {str(e)}")
        logger.error(traceback.format_exc())
        return None