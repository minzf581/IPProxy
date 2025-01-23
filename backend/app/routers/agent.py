from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.agent import Agent
from app.models.transaction import Transaction
from typing import Dict, Any, List
from pydantic import BaseModel
from typing import Optional
from app.services.ipproxy_service import IPProxyService
from app.models.main_user import MainUser

router = APIRouter()
ipproxy_service = IPProxyService()

class CreateAgentRequest(BaseModel):
    appUsername: Optional[str] = None
    password: Optional[str] = None
    limitFlow: int = 1000  # 默认流量限制1000GB
    mainUsername: Optional[str] = None
    appMainUsername: Optional[str] = None
    remark: Optional[str] = None
    status: int = 1  # 默认状态为启用
    balance: float = 1000.0  # 默认额度1000元

class UpdateAgentRequest(BaseModel):
    """更新代理商请求"""
    status: Optional[str] = None
    remark: Optional[str] = None
    limit_flow: Optional[int] = None
    balance: Optional[float] = None

@router.post("/api/open/app/proxy/user/v2")
async def create_agent(
    request: CreateAgentRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """创建代理商"""
    try:
        # 获取主账户信息
        main_user = db.query(MainUser).first()
        if not main_user:
            raise HTTPException(status_code=400, detail="系统未初始化主账户，请先初始化主账户")

        # 验证参数
        if not request.mainUsername and not request.appMainUsername:
            # 使用系统主账户
            request.appMainUsername = main_user.app_username

        # 调用IPIPV API创建代理用户
        params = {
            "appUsername": request.appUsername,
            "password": request.password,
            "limitFlow": request.limitFlow,
            "mainUsername": request.mainUsername,
            "appMainUsername": request.appMainUsername or main_user.app_username,
            "remark": request.remark,
            "status": request.status
        }
        
        try:
            response_data = ipproxy_service.create_proxy_user(params)
            
            # 保存到数据库
            agent = Agent(
                app_username=response_data["appUsername"],
                platform_account=response_data["username"],
                password=response_data["password"],
                status="active" if request.status == 1 else "disabled",
                remark=request.remark,
                balance=request.limitFlow,  # 初始余额设置为limitFlow
                limit_flow=request.limitFlow,
                main_account=main_user.app_username
            )
            db.add(agent)
            db.flush()  # 获取agent.id

            # 记录初始额度充值交易
            transaction = Transaction(
                user_id=agent.id,
                amount=request.limitFlow,
                type="recharge",
                status="completed",
                remark="初始额度充值"
            )
            db.add(transaction)
            
            db.commit()
            db.refresh(agent)

            return {
                "code": 0,
                "msg": "success",
                "data": response_data
            }
        except Exception as e:
            db.rollback()
            print(f"创建代理商失败: {str(e)}")
            return {
                "code": 500,
                "msg": f"创建代理商失败: {str(e)}",
                "data": None
            }
            
    except HTTPException as e:
        return {
            "code": e.status_code,
            "msg": str(e.detail),
            "data": None
        }
    except Exception as e:
        return {
            "code": 500,
            "msg": str(e),
            "data": None
        }

@router.get("/api/open/app/agent/list")
async def get_agent_list(
    page: int = 1,
    pageSize: int = 10,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商列表"""
    skip = (page - 1) * pageSize
    total = db.query(Agent).count()
    print(f"代理商总数: {total}")
    
    agents = db.query(Agent).offset(skip).limit(pageSize).all()
    agent_list = [agent.to_dict() for agent in agents]
    print(f"当前页代理商列表: {agent_list}")
    
    return {
        "code": 0,
        "msg": "success",
        "data": {
            "list": agent_list,
            "total": total
        }
    }

@router.get("/api/open/app/agent/{agent_id}")
async def get_agent_detail(
    agent_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商详情"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return {
        "code": 0,
        "message": "success",
        "data": agent.to_dict()
    }

@router.get("/api/open/app/agent/{agent_id}/statistics")
async def get_agent_statistics(
    agent_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商统计信息"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # TODO: 实现代理商统计信息的查询逻辑
    return {
        "code": 0,
        "message": "success",
        "data": {
            "totalOrders": 0,
            "monthlyOrders": 0,
            "totalRevenue": 0,
            "monthlyRevenue": 0
        }
    }

@router.put("/api/open/app/agent/{agent_id}/status")
async def update_agent_status(
    agent_id: int,
    status: str = Query(..., description="Agent status to update to"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新代理商状态"""
    try:
        # 1. 获取代理商信息
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return {
                "code": 404,
                "msg": "代理商不存在",
                "data": None
            }
            
        # 2. 直接更新数据库状态
        agent.status = status
        db.commit()
        db.refresh(agent)
        
        # 3. 尝试调用API更新子账号状态（作为后台操作）
        try:
            # 获取主账号信息
            main_user = db.query(MainUser).filter(MainUser.app_username == agent.main_account).first()
            if main_user:
                service = IPProxyService()
                api_status = 2 if status == 'disabled' else 1
                service.update_proxy_user({
                    "appUsername": agent.app_username,  # 子账号用户名
                    "appMainUsername": agent.main_account,  # 主账号用户名
                    "mainUsername": main_user.platform_account,  # 主账号平台账号
                    "status": api_status,  # 状态：1=启用，2=禁用
                    "limitFlow": agent.limit_flow or 1000,  # 流量限制
                    "remark": agent.remark or "",  # 备注
                    "balance": agent.balance or 0  # 余额
                })
        except Exception as e:
            # API调用失败不影响数据库状态
            print(f"API调用失败（不影响数据库状态）: {str(e)}")
        
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

@router.put("/api/open/app/agent/{agent_id}")
async def update_agent(
    agent_id: int,
    request: UpdateAgentRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新代理商信息"""
    try:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="代理商不存在")

        # 更新代理商信息
        if request.status is not None:
            agent.status = request.status
        if request.remark is not None:
            agent.remark = request.remark
        if request.limit_flow is not None:
            agent.limit_flow = request.limit_flow
        if request.balance is not None:
            # 计算余额变化
            balance_change = request.balance - agent.balance
            if balance_change != 0:
                # 记录余额变更交易
                transaction = Transaction(
                    user_id=agent.id,
                    amount=abs(balance_change),
                    type="recharge" if balance_change > 0 else "consumption",
                    status="completed",
                    remark=f"{'充值' if balance_change > 0 else '扣费'}调整"
                )
                db.add(transaction)
            agent.balance = request.balance

        # 调用IPIPV API更新代理商状态
        if request.status is not None:
            params = {
                "appUsername": agent.app_username,
                "status": 1 if request.status == "active" else 2
            }
            try:
                response_data = ipproxy_service.update_proxy_user(params)
                if response_data.get("code") != 0:
                    raise HTTPException(status_code=400, detail=response_data.get("msg", "更新代理商状态失败"))
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"调用API更新代理商状态失败: {str(e)}")

        db.commit()
        db.refresh(agent)
        
        return {
            "code": 0,
            "msg": "success",
            "data": agent.to_dict()
        }
    except HTTPException as e:
        db.rollback()
        return {
            "code": e.status_code,
            "msg": str(e.detail),
            "data": None
        }
    except Exception as e:
        db.rollback()
        return {
            "code": 500,
            "msg": str(e),
            "data": None
        } 