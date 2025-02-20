# 代理商管理路由模块
# ==============
#
# 此模块处理所有与代理商相关的路由请求，包括：
# - 代理商账户管理（创建、更新、查询）
# - 代理商资金管理（余额更新、交易记录）
# - 代理商统计信息（订单统计、收入统计）
#
# 重要提示：
# ---------
# 1. 代理商是系统的核心角色之一，所有操作需要严格的权限控制
# 2. 涉及资金操作时需要保证事务的原子性和数据一致性
# 3. 所有关键操作都需要记录详细的日志
#
# 依赖关系：
# ---------
# - 数据模型：
#   - User (app/models/user.py)
#   - Transaction (app/models/transaction.py)
# - 服务：
#   - UserService (app/services/user_service.py)
#   - ProxyService (app/services/proxy_service.py)
#   - AreaService (app/services/area_service.py)
#   - AuthService (app/services/auth.py)
#
# 前端对应：
# ---------
# - 服务层：src/services/agentService.ts
# - 页面组件：src/pages/agent/index.tsx
# - 类型定义：src/types/agent.ts
#
# 修改注意事项：
# ------------
# 1. 权限控制：
#    - 所有接口都需要进行权限验证
#    - 防止越权访问和操作
#    - 记录敏感操作日志
#
# 2. 资金操作：
#    - 使用事务确保操作原子性
#    - 记录详细的资金变动日志
#    - 定期对账和数据校验
#
# 3. 数据验证：
#    - 所有输入参数必须经过验证
#    - 特别注意金额等敏感字段
#    - 确保数据一致性
#
# 4. 错误处理：
#    - 统一的错误响应格式
#    - 详细的错误日志记录
#    - 友好的错误提示信息
#
# 5. 性能优化：
#    - 合理使用数据库索引
#    - 避免重复查询
#    - 优化大数据量查询

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from typing import Dict, Any, List
from pydantic import BaseModel, Field, validator
from typing import Optional
from app.services import UserService, ProxyService, AreaService
from app.services.auth import get_current_user
from datetime import datetime, timedelta
import logging
from sqlalchemy import func
import uuid
from app.schemas.agent import AgentList, AgentCreate, AgentUpdate
import json
import traceback
from app.core.deps import get_user_service, get_proxy_service, get_area_service
from app.models.dynamic_order import DynamicOrder
from app.models.static_order import StaticOrder
from sqlalchemy import or_
import re
from app.core.security import get_password_hash

# 设置日志记录器
logger = logging.getLogger(__name__)

router = APIRouter()

class CreateAgentRequest(BaseModel):
    """创建代理商请求"""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=50)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)  # 添加联系方式字段
    remark: Optional[str] = Field(None, max_length=255)
    status: Optional[int] = Field(1, description="状态：1=正常，0=禁用")
    balance: Optional[float] = Field(0.0, ge=0)

    @validator('username')
    def validate_username(cls, v):
        """验证用户名"""
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('用户名只能包含字母、数字、下划线和连字符')
        return v

    @validator('email')
    def validate_email(cls, v):
        """验证邮箱"""
        if v is not None and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('邮箱格式不正确')
        return v

    @validator('phone')
    def validate_phone(cls, v):
        """验证联系方式"""
        if v is not None and not re.match(r'^[\d\-+() ]{5,20}$', v):
            raise ValueError('联系方式格式不正确')
        return v

    @validator('status')
    def validate_status(cls, v):
        """验证状态"""
        if v not in [0, 1]:
            raise ValueError('状态只能是 0 或 1')
        return v

class UpdateAgentRequest(BaseModel):
    """更新代理商请求"""
    status: Optional[str] = None
    remark: Optional[str] = None
    balance: Optional[float] = None

class AgentBalanceAdjustRequest(BaseModel):
    """代理商额度调整请求"""
    amount: float = Field(..., description="调整金额，正数为增加，负数为减少")
    remark: Optional[str] = Field(None, max_length=255, description="调整备注")

def generate_transaction_no() -> str:
    """生成交易号"""
    return f"TRX{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"

@router.post("/open/app/proxy/user/v2")
async def create_agent(
    request: CreateAgentRequest,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service)
) -> Dict[str, Any]:
    """创建代理商"""
    try:
        logger.info(f"[AgentRouter] 开始创建代理商: {request.dict()}")
        
        # 检查必需参数
        if not request.username or not request.password:
            logger.error("[AgentRouter] 缺少必需的参数：username 或 password")
            raise HTTPException(status_code=400, detail="用户名和密码是必需的")

        # 检查用户名是否已存在
        existing_user = db.query(User).filter(User.username == request.username).first()
        if existing_user:
            logger.error(f"[AgentRouter] 用户名已存在: {request.username}")
            raise HTTPException(
                status_code=400,
                detail=f"用户名 '{request.username}' 已存在，请使用其他用户名"
            )

        # 准备IPIPV API请求参数
        ipipv_params = {
            "appUsername": request.username,
            "password": request.password,
            "phone": request.phone,
            "email": request.email,
            "status": 1,  # 默认启用状态
            "authType": 1  # 默认认证类型
        }
            
        # 记录日志时排除敏感信息
        log_params = ipipv_params.copy()
        log_params.pop("password", None)
        logger.info(f"[AgentRouter] 调用 IPIPV API 的参数: {json.dumps(log_params, ensure_ascii=False)}")
        
        # 调用IPIPV API创建用户
        response = await user_service._make_request(
            "api/open/app/user/v2",
            ipipv_params
        )
        
        if not response:
            error_msg = "创建代理商失败：IPIPV API返回空响应"
            logger.error(f"[AgentRouter] {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
            
        if response.get("code") not in [0, 200]:
            error_msg = f"创建代理商失败：{response.get('msg', '未知错误')}"
            logger.error(f"[AgentRouter] {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)

        # 准备用户数据
        user_params = {
            "username": request.username,
            "password": get_password_hash(request.password),
            "email": request.email,
            "phone": request.phone,
            "is_agent": True,
            "balance": float(request.balance) if request.balance is not None else 0.0,
            "remark": request.remark,
            "status": 1,
            "app_username": request.username,  # 使用相同的用户名作为app_username
            "ipipv_username": response.get("data", {}).get("username"),  # 保存IPIPV返回的用户名
            "ipipv_password": response.get("data", {}).get("password")   # 保存IPIPV返回的密码
        }

        # 创建数据库用户记录
        new_user = User(**user_params)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
            
        return {
            "code": 0,
            "message": "代理商创建成功",
            "data": new_user.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AgentRouter] 创建代理商失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/open/app/agent/list")
async def get_agent_list(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    user_service: UserService = Depends(get_user_service),
    db: Session = Depends(get_db)
):
    """获取代理商列表"""
    try:
        logger.info(f"[AgentRouter] 开始获取代理商列表")
        logger.info(f"[AgentRouter] 请求参数: page={page}, pageSize={pageSize}")
        
        # 构建查询条件
        query = db.query(User).filter(User.is_agent == True)
        logger.info(f"[AgentRouter] 构建查询条件: {query.statement}")
        
        # 计算总数
        total = query.count()
        logger.info(f"[AgentRouter] 总记录数: {total}")
        
        # 分页查询
        agents = query.order_by(User.created_at.desc()) \
            .offset((page - 1) * pageSize) \
            .limit(pageSize) \
            .all()
        logger.info(f"[AgentRouter] 查询到 {len(agents)} 条记录")
            
        # 转换为响应格式
        agent_list = []
        for agent in agents:
            agent_data = {
                "id": str(agent.id),
                "username": agent.username,
                "app_username": agent.app_username or agent.username,
                "platform_account": agent.platform_account or agent.ipipv_username or agent.username,
                "email": agent.email,
                "phone": agent.phone,
                "balance": float(agent.balance) if agent.balance is not None else 0.0,
                "status": "active" if agent.status == 1 else "disabled",
                "remark": agent.remark,
                "created_at": agent.created_at.isoformat() if agent.created_at else None,
                "updated_at": agent.updated_at.isoformat() if agent.updated_at else None
            }
            agent_list.append(agent_data)
            logger.info(f"[AgentRouter] 处理代理商数据: {agent_data}")
            
        response_data = {
            "code": 0,
            "message": "获取代理商列表成功",
            "data": {
                "list": agent_list,
                "total": total
            }
        }
        logger.info(f"[AgentRouter] 返回响应: {response_data}")
        return response_data
        
    except Exception as e:
        logger.error(f"[AgentRouter] 获取代理商列表失败: {str(e)}")
        logger.error(f"[AgentRouter] 错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/open/app/agent/{agent_id}")
async def get_agent_detail(
    agent_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商详情"""
    agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return {
        "code": 0,
        "message": "success",
        "data": agent.to_dict()
    }

@router.get("/open/app/agent/{agent_id}/statistics")
async def get_agent_statistics(
    agent_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商统计信息"""
    agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    # 获取统计数据
    total_orders = db.query(func.count(Transaction.id)).filter(
        Transaction.agent_id == agent_id
    ).scalar()
    
    total_amount = db.query(func.sum(Transaction.amount)).filter(
        Transaction.agent_id == agent_id
    ).scalar() or 0.0
    
    return {
        "code": 0,
        "message": "success",
        "data": {
            "total_orders": total_orders,
            "total_amount": float(total_amount),
            "balance": agent.balance
        }
    }

@router.put("/open/app/agent/{agent_id}/status")
async def update_agent_status(
    agent_id: int,
    status: str = Query(..., description="Agent status to update to"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新代理商状态"""
    try:
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            return {
                "code": 404,
                "msg": "代理商不存在",
                "data": None
            }
            
        agent.status = status
        db.commit()
        db.refresh(agent)
        
        return {
            "code": 0,
            "msg": "success",
            "data": agent.to_dict()
        }
    except Exception as e:
        db.rollback()
        return {
            "code": 500,
            "msg": f"更新代理商状态失败: {str(e)}",
            "data": None
        }

@router.put("/open/app/agent/{agent_id}")
async def update_agent(
    agent_id: int,
    request: UpdateAgentRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新代理商信息"""
    try:
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            return {
                "code": 404,
                "msg": "代理商不存在",
                "data": None
            }
        
        if request.status is not None:
            agent.status = request.status
        if request.remark is not None:
            agent.remark = request.remark
        if request.balance is not None:
            agent.balance = request.balance
            
        db.commit()
        db.refresh(agent)
        
        return {
            "code": 0,
            "msg": "success",
            "data": agent.to_dict()
        }
    except Exception as e:
        db.rollback()
        return {
            "code": 500,
            "msg": f"更新代理商信息失败: {str(e)}",
            "data": None
        }

@router.get("/agent/{agent_id}/detail")
async def get_agent_detail(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商详情"""
    try:
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
        
        # 检查权限：管理员可以查看所有代理商，代理商只能查看自己的信息
        if not current_user.is_admin and current_user.id != agent_id:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        return {
            "code": 200,
            "message": "success",
            "data": {
                "agent": agent.to_dict()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取代理商详情失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.get("/agent/{agent_id}/statistics")
async def get_agent_statistics(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商统计数据"""
    try:
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
        
        # 检查权限：管理员可以查看所有代理商，代理商只能查看自己的信息
        if not current_user.is_admin and current_user.id != agent_id:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 获取统计数据
        statistics = {
            "total_users": db.query(User).filter(User.agent_id == agent_id).count(),
            "total_balance": agent.balance,
            "total_transactions": db.query(Transaction).filter(Transaction.user_id == agent_id).count()
        }
        
        return {
            "code": 200,
            "message": "success",
            "data": {
                "statistics": statistics
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取代理商统计数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.post("/agent/{agent_id}/balance")
async def update_agent_balance(
    agent_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    调整代理商额度
    
    此接口用于管理员调整代理商的账户余额，包括充值和扣减操作。
    所有操作都会记录详细的交易日志，并确保数据一致性。
    
    参数:
        agent_id (int): 代理商ID
        data (dict): 请求数据，包含：
            - amount (float): 调整金额
            - type (str): 调整类型，'add'为充值，'subtract'为扣减
            - remark (str, optional): 操作备注
        current_user (User): 当前操作用户，必须是管理员
        db (Session): 数据库会话
    
    返回:
        Dict[str, Any]: 包含更新后的代理商信息
            - code (int): 状态码
            - message (str): 操作结果描述
            - data (dict): 更新后的代理商数据
    
    异常:
        - 404: 代理商不存在
        - 403: 无权限执行操作
        - 400: 参数错误或余额不足
        - 500: 服务器内部错误
    
    注意事项:
        1. 只有管理员可以执行此操作
        2. 扣减操作需要检查余额充足性
        3. 所有操作都会记录交易日志
        4. 使用事务确保数据一致性
    """
    try:
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
        
        # 检查权限：只有管理员可以调整代理商额度
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 获取调整金额和类型
        amount = data.get("amount")
        adjust_type = data.get("type")
        remark = data.get("remark", "")
        
        if not amount or not adjust_type:
            raise HTTPException(status_code=400, detail={"code": 400, "message": "缺少必要参数"})
        
        # 根据类型调整余额
        if adjust_type == "add":
            agent.balance += amount
            transaction_type = "recharge"
        else:
            if agent.balance < amount:
                raise HTTPException(status_code=400, detail={"code": 400, "message": "余额不足"})
            agent.balance -= amount
            transaction_type = "deduction"
        
        # 记录交易
        transaction = Transaction(
            order_no=generate_transaction_no(),
            user_id=agent.id,
            amount=amount,
            type=transaction_type,
            status="completed",
            remark=remark,
            operator_id=current_user.id
        )
        db.add(transaction)
        
        db.commit()
        db.refresh(agent)
        
        return {
            "code": 200,
            "message": "额度调整成功",
            "data": agent.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"调整代理商额度失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.post("/agent/{agent_id}/status")
async def update_agent_status(
    agent_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    更新代理商状态
    
    此接口用于管理员更新代理商的状态，可以启用或禁用代理商账户。
    状态变更会影响代理商的所有业务操作权限。
    
    参数:
        agent_id (int): 代理商ID
        data (dict): 请求数据，包含：
            - status (str): 新状态，可选值：'active'/'disabled'
            - remark (str, optional): 状态变更原因
        current_user (User): 当前操作用户，必须是管理员
        db (Session): 数据库会话
    
    返回:
        Dict[str, Any]: 包含更新后的代理商信息
            - code (int): 状态码
            - message (str): 操作结果描述
            - data (dict): 更新后的代理商数据
    
    异常:
        - 404: 代理商不存在
        - 403: 无权限执行操作
        - 400: 状态参数无效
        - 500: 服务器内部错误
    
    注意事项:
        1. 只有管理员可以执行此操作
        2. 状态变更会影响代理商的所有业务操作
        3. 需要记录状态变更日志
        4. 状态变更可能需要同步更新相关资源
    """
    try:
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
        
        # 检查权限：只有管理员可以更新代理商状态
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 更新状态
        status = data.get("status")
        if not status:
            raise HTTPException(status_code=400, detail={"code": 400, "message": "缺少状态参数"})
            
        agent.status = status
        agent.remark = data.get("remark", "")
        
        db.commit()
        db.refresh(agent)
        
        return {
            "code": 200,
            "message": "状态更新成功",
            "data": agent.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"更新代理商状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.get("/agent/{agent_id}/transactions")
async def get_agent_transactions(
    agent_id: int,
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商交易记录"""
    try:
        logger.info(f"获取代理商交易记录: agent_id={agent_id}, page={page}, pageSize={pageSize}, status={status}")
        
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
        
        # 检查权限：管理员可以查看所有代理商，代理商只能查看自己的信息
        if not current_user.is_admin and current_user.id != agent_id:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 构建查询条件
        query = db.query(Transaction).filter(Transaction.user_id == agent_id)
        
        if status:
            query = query.filter(Transaction.status == status)
        
        # 计算总数
        total = query.count()
        
        # 分页查询
        transactions = query.order_by(Transaction.created_at.desc()) \
            .offset((page - 1) * pageSize) \
            .limit(pageSize) \
            .all()
        
        # 转换为响应格式
        transaction_list = []
        for t in transactions:
            transaction_list.append({
                "id": t.id,
                "order_no": t.order_no,
                "amount": float(t.amount),
                "status": t.status,
                "type": t.type,
                "remark": t.remark,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "updated_at": t.updated_at.isoformat() if t.updated_at else None
            })
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "list": transaction_list,
                "total": total,
                "page": page,
                "pageSize": pageSize
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取代理商交易记录失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.post("/open/app/area/v2")
async def get_area_list(
    params: Dict[str, Any] = Body(...),
    area_service: AreaService = Depends(get_area_service)
) -> Dict[str, Any]:
    """获取地区列表"""
    try:
        logger.info("[AreaService] 获取区域列表")
        result = await area_service.get_area_list(params)
        return {
            "code": 0,
            "message": "success",
            "data": result
        }
    except Exception as e:
        logger.error(f"[AreaService] 获取区域列表失败: {str(e)}")
        logger.error(f"[AreaService] 错误堆栈: {traceback.format_exc()}")
        return {
            "code": 500,
            "message": str(e),
            "data": []
        }

@router.get("/open/app/agent-orders/v2")
async def get_agent_orders(
    agentId: Optional[int] = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取代理商订单列表"""
    try:
        logger.info(f"获取代理商订单列表: agent_id={agentId}, page={page}, pageSize={pageSize}, status={status}, startDate={startDate}, endDate={endDate}")
        logger.info(f"当前用户: id={current_user.id}, is_admin={current_user.is_admin}, is_agent={current_user.is_agent}")
        
        # 权限检查
        if not current_user.is_admin and current_user.id != agentId:
            logger.warning(f"权限检查失败: 用户{current_user.id}尝试访问代理商{agentId}的订单")
            raise HTTPException(
                status_code=403,
                detail={
                    "code": 403,
                    "message": "没有权限查看此代理商的订单"
                }
            )
        
        # 构建动态订单查询
        dynamic_query = db.query(DynamicOrder)
        static_query = db.query(StaticOrder)
        
        # 如果指定了代理商ID，添加过滤条件
        if agentId:
            logger.info(f"按代理商ID过滤: {agentId}")
            dynamic_query = dynamic_query.filter(DynamicOrder.agent_id == agentId)
            static_query = static_query.filter(StaticOrder.agent_id == agentId)
        elif not current_user.is_admin:
            # 非管理员必须指定代理商ID
            logger.error("非管理员用户未指定代理商ID")
            raise HTTPException(
                status_code=400,
                detail={
                    "code": 400,
                    "message": "必须指定代理商ID"
                }
            )
        
        # 状态过滤
        if status:
            logger.info(f"按状态过滤: {status}")
            dynamic_query = dynamic_query.filter(DynamicOrder.status == status)
            static_query = static_query.filter(StaticOrder.status == status)
        
        # 日期范围过滤
        if startDate:
            start_datetime = datetime.strptime(startDate, "%Y-%m-%d")
            logger.info(f"按开始日期过滤: {start_datetime}")
            dynamic_query = dynamic_query.filter(DynamicOrder.created_at >= start_datetime)
            static_query = static_query.filter(StaticOrder.created_at >= start_datetime)
            
        if endDate:
            end_datetime = datetime.strptime(endDate, "%Y-%m-%d") + timedelta(days=1)
            logger.info(f"按结束日期过滤: {end_datetime}")
            dynamic_query = dynamic_query.filter(DynamicOrder.created_at < end_datetime)
            static_query = static_query.filter(StaticOrder.created_at < end_datetime)
        
        # 获取所有订单
        dynamic_orders = dynamic_query.all()
        static_orders = static_query.all()
        
        logger.info(f"查询结果: 动态订单数量={len(dynamic_orders)}, 静态订单数量={len(static_orders)}")
        
        # 合并订单并转换格式
        all_orders = []
        
        # 处理动态订单
        for order in dynamic_orders:
            all_orders.append({
                "id": str(order.id),
                "order_no": order.order_no,
                "amount": float(order.total_amount) if order.total_amount else 0.0,
                "status": order.status,
                "type": "dynamic",
                "remark": order.remark,
                "created_at": order.created_at.strftime("%Y-%m-%d %H:%M:%S") if order.created_at else None,
                "updated_at": order.updated_at.strftime("%Y-%m-%d %H:%M:%S") if order.updated_at else None
            })
        
        # 处理静态订单
        for order in static_orders:
            all_orders.append({
                "id": str(order.id),
                "order_no": order.order_no,
                "amount": float(order.amount) if order.amount else 0.0,
                "status": order.status,
                "type": "static",
                "remark": order.remark,
                "created_at": order.created_at.strftime("%Y-%m-%d %H:%M:%S") if order.created_at else None,
                "updated_at": order.updated_at.strftime("%Y-%m-%d %H:%M:%S") if order.updated_at else None
            })
        
        # 按创建时间排序
        all_orders.sort(key=lambda x: x["created_at"] or "", reverse=True)
        
        # 计算总数
        total = len(all_orders)
        logger.info(f"总订单数: {total}")
        
        # 分页
        start = (page - 1) * pageSize
        end = start + pageSize
        paginated_orders = all_orders[start:end]
        logger.info(f"返回订单数: {len(paginated_orders)}")
            
        return {
            "code": 0,
            "message": "获取代理商订单列表成功",
            "data": {
                "list": paginated_orders,
                "total": total
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取代理商订单列表失败: {str(e)}")
        logger.error(f"错误堆栈: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": 500,
                "message": str(e)
            }
        )

@router.post("/agent/{agent_id}/balance/adjust")
async def adjust_agent_balance(
    agent_id: int,
    request: AgentBalanceAdjustRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """调整代理商额度"""
    try:
        logger.info(f"[AgentRouter] 开始调整代理商额度: agent_id={agent_id}, amount={request.amount}")
        
        # 权限检查
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="只有管理员可以调整代理商额度")
            
        # 查找代理商
        agent = db.query(User).filter(
            User.id == agent_id,
            User.is_agent == True
        ).first()
        
        if not agent:
            raise HTTPException(status_code=404, detail="代理商不存在")
            
        # 生成订单号
        order_no = f"BAL{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
        
        # 创建额度调整订单
        order = AgentOrder(
            order_no=order_no,
            agent_id=agent_id,
            amount=abs(request.amount),  # 使用绝对值
            type="increase" if request.amount > 0 else "decrease",
            status="completed",
            remark=request.remark or f"{'增加' if request.amount > 0 else '减少'}额度 {abs(request.amount)}",
            operator_id=current_user.id,
            created_at=datetime.now()
        )
        
        # 更新代理商余额
        old_balance = agent.balance
        new_balance = float(old_balance) + request.amount
        
        if new_balance < 0:
            raise HTTPException(status_code=400, detail="调整后余额不能小于0")
            
        agent.balance = new_balance
        
        # 创建交易记录
        transaction = Transaction(
            transaction_no=generate_transaction_no(),
            user_id=agent_id,
            agent_id=agent_id,
            order_no=order_no,
            amount=abs(request.amount),
            balance=new_balance,
            type="recharge" if request.amount > 0 else "deduct",
            status="success",
            remark=request.remark or f"{'增加' if request.amount > 0 else '减少'}额度 {abs(request.amount)}"
        )
        
        try:
            db.add(order)
            db.add(transaction)
            db.commit()
            
            logger.info(f"[AgentRouter] 代理商额度调整成功: agent_id={agent_id}, old_balance={old_balance}, new_balance={new_balance}")
            
            return {
                "code": 0,
                "message": "额度调整成功",
                "data": {
                    "order_no": order_no,
                    "old_balance": float(old_balance),
                    "new_balance": float(new_balance),
                    "amount": request.amount
                }
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"[AgentRouter] 保存额度调整记录失败: {str(e)}")
            raise HTTPException(status_code=500, detail="保存额度调整记录失败")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AgentRouter] 调整代理商额度失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agent/{agent_id}/balance/orders")
async def get_agent_balance_orders(
    agent_id: int,
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商额度调整订单列表"""
    try:
        logger.info(f"[AgentRouter] 获取代理商额度订单: agent_id={agent_id}")
        
        # 权限检查
        if not current_user.is_admin and current_user.id != agent_id:
            raise HTTPException(status_code=403, detail="没有权限查看此代理商的额度订单")
            
        # 构建查询
        query = db.query(AgentOrder).filter(AgentOrder.agent_id == agent_id)
        
        # 添加日期过滤
        if startDate:
            query = query.filter(AgentOrder.created_at >= startDate)
        if endDate:
            query = query.filter(AgentOrder.created_at <= endDate)
            
        # 计算总数
        total = query.count()
        
        # 获取分页数据
        orders = query.order_by(AgentOrder.created_at.desc()) \
            .offset((page - 1) * pageSize) \
            .limit(pageSize) \
            .all()
            
        # 转换为响应格式
        order_list = []
        for order in orders:
            order_list.append({
                "id": order.id,
                "order_no": order.order_no,
                "amount": float(order.amount),
                "type": order.type,
                "status": order.status,
                "remark": order.remark,
                "created_at": order.created_at.isoformat() if order.created_at else None
            })
            
        return {
            "code": 0,
            "message": "获取额度订单列表成功",
            "data": {
                "list": order_list,
                "total": total
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AgentRouter] 获取代理商额度订单失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/open/app/agent/{id}/users")
async def get_agent_users(
    id: int,
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商名下的用户列表"""
    try:
        logger.info(f"[AgentRouter] 开始获取代理商用户列表: agent_id={id}, page={page}, pageSize={pageSize}, status={status}")
        
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == id, User.is_agent == True).first()
        logger.info(f"[AgentRouter] 查询代理商结果: {agent.to_dict() if agent else None}")
        
        if not agent:
            logger.error(f"[AgentRouter] 代理商不存在: id={id}")
            return {"code": 404, "message": "代理商不存在", "data": None}
        
        # 检查权限
        if not current_user.is_admin and current_user.id != id:
            logger.error(f"[AgentRouter] 权限不足: current_user_id={current_user.id}, agent_id={id}")
            return {"code": 403, "message": "没有权限查看此代理商的用户", "data": None}
        
        # 构建查询
        query = db.query(User).filter(User.agent_id == id)
        logger.info(f"[AgentRouter] 基础查询SQL: {str(query)}")
        
        # 添加状态过滤
        if status:
            if status == 'active':
                query = query.filter(User.status == 1)
            elif status == 'disabled':
                query = query.filter(User.status == 0)
            logger.info(f"[AgentRouter] 添加状态过滤后的SQL: {str(query)}")
        
        # 计算总数
        total = query.count()
        logger.info(f"[AgentRouter] 查询到的总记录数: {total}")
        
        # 分页查询
        users = query.order_by(User.created_at.desc()) \
            .offset((page - 1) * pageSize) \
            .limit(pageSize) \
            .all()
        
        logger.info(f"[AgentRouter] 查询到的用户数量: {len(users)}")
        
        # 转换为响应格式
        user_list = []
        for user in users:
            user_dict = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "status": "active" if user.status == 1 else "disabled",
                "balance": float(user.balance) if user.balance is not None else 0.0,
                "remark": user.remark,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None,
                "app_username": user.app_username,
                "phone": user.phone
            }
            user_list.append(user_dict)
            logger.info(f"[AgentRouter] 处理用户数据: {user_dict}")
        
        logger.info(f"[AgentRouter] 返回用户列表成功: total={total}, current_page={page}, page_size={pageSize}")
        
        return {
            "code": 0,
            "message": "获取用户列表成功",
            "data": {
                "list": user_list,
                "total": total,
                "page": page,
                "pageSize": pageSize
            }
        }
        
    except Exception as e:
        logger.error(f"[AgentRouter] 获取代理商用户列表失败: {str(e)}")
        logger.error(f"[AgentRouter] 错误详情: {traceback.format_exc()}")
        return {"code": 500, "message": f"获取用户列表失败: {str(e)}", "data": None}

class DynamicProxyParam(BaseModel):
    productNo: str
    proxyType: int
    appUsername: str
    flow: int
    duration: int
    unit: int

class OpenDynamicProxyRequest(BaseModel):
    appOrderNo: str
    params: List[DynamicProxyParam]

@router.post("/open/app/instance/open/v2")
async def open_dynamic_proxy(
    request: OpenDynamicProxyRequest,
    proxy_service: ProxyService = Depends(get_proxy_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """开通动态代理实例"""
    try:
        logger.info("[AgentRouter] 开始开通动态代理实例")
        logger.info(f"[AgentRouter] 请求参数: {request.dict()}")

        # 调用IPIPV API开通实例
        response = await proxy_service._make_request(
            "api/open/app/instance/open/v2",
            request.dict()
        )

        if not response or response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误") if response else "API返回为空"
            logger.error(f"[AgentRouter] 开通动态代理实例失败: {error_msg}")
            return {
                "code": response.get("code", 500) if response else 500,
                "msg": error_msg,
                "data": None
            }

        logger.info(f"[AgentRouter] 开通实例成功: {response}")
        return {
            "code": 0,
            "msg": "success",
            "data": response.get("data")
        }

    except Exception as e:
        logger.error(f"[AgentRouter] 开通动态代理实例失败: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "code": 500,
            "msg": f"开通动态代理实例失败: {str(e)}",
            "data": None
        }