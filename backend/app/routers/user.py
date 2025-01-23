from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from typing import Dict, Any, List

router = APIRouter()

@router.get("/api/open/app/user/list")
async def get_user_list(
    page: int = 1,
    pageSize: int = 10,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取用户列表"""
    skip = (page - 1) * pageSize
    total = db.query(User).count()
    users = db.query(User).offset(skip).limit(pageSize).all()
    
    return {
        "code": 0,
        "message": "success",
        "data": {
            "list": [user.to_dict() for user in users],
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