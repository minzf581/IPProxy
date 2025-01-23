from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.agent import Agent
from typing import Dict, Any, List, Optional
from sqlalchemy import or_

router = APIRouter()

@router.get("/api/open/app/user/list")
async def get_user_list(
    page: int = 1,
    pageSize: int = 10,
    username: Optional[str] = None,
    agentAccount: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取用户列表"""
    query = db.query(User)
    
    # 添加搜索条件
    if username:
        query = query.filter(User.username.like(f"%{username}%"))
    if agentAccount:
        query = query.join(Agent).filter(Agent.app_username == agentAccount)
    
    # 计算总数
    total = query.count()
    
    # 分页
    skip = (page - 1) * pageSize
    users = query.offset(skip).limit(pageSize).all()
    
    # 转换为列表
    user_list = []
    for user in users:
        agent = db.query(Agent).filter(Agent.id == user.agent_id).first()
        user_dict = user.to_dict()
        user_dict['agentAccount'] = agent.app_username if agent else None
        user_list.append(user_dict)
    
    return {
        "code": 0,
        "msg": "success",
        "data": {
            "list": user_list,
            "total": total
        }
    }

@router.post("/api/open/app/user/create")
async def create_user(
    user_data: dict,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """创建用户"""
    try:
        user = User(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        return {
            "code": 0,
            "message": "success",
            "data": user.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/api/open/app/user/{user_id}")
async def update_user(
    user_id: int,
    user_data: dict,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新用户信息"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in user_data.items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return {
        "code": 0,
        "message": "success",
        "data": user.to_dict()
    }

@router.delete("/api/open/app/user/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """删除用户"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {
        "code": 0,
        "message": "success"
    }

@router.put("/api/open/app/user/{user_id}/status")
async def update_user_status(
    user_id: int,
    status: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新用户状态"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {
                "code": 404,
                "msg": "用户不存在",
                "data": None
            }
        
        # 更新状态
        user.status = status
        db.commit()
        db.refresh(user)
        
        return {
            "code": 0,
            "msg": "success",
            "data": user.to_dict()
        }
    except Exception as e:
        db.rollback()
        return {
            "code": 500,
            "msg": f"更新用户状态失败: {str(e)}",
            "data": None
        }

@router.put("/api/open/app/user/{user_id}/password")
async def update_user_password(
    user_id: int,
    password: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新用户密码"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {
                "code": 404,
                "msg": "用户不存在",
                "data": None
            }
        
        # 更新密码
        user.password = password  # 注意：实际应用中应该对密码进行加密
        db.commit()
        db.refresh(user)
        
        return {
            "code": 0,
            "msg": "success",
            "data": user.to_dict()
        }
    except Exception as e:
        db.rollback()
        return {
            "code": 500,
            "msg": f"更新用户密码失败: {str(e)}",
            "data": None
        } 