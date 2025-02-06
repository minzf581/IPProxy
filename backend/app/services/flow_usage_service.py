from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from fastapi import HTTPException

from app.models.user import User
from app.models.flow_usage import FlowUsage

class FlowUsageService:
    def __init__(self, db: Session):
        self.db = db
        
    async def record_usage(
        self,
        user_id: int,
        instance_no: str,
        usage: float,
        remark: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        记录流量使用
        
        Args:
            user_id: 用户ID
            instance_no: 实例编号
            usage: 使用量(GB)
            remark: 备注
            
        Returns:
            Dict: 记录结果
        """
        try:
            # 获取用户信息
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="用户不存在")
                
            # 获取或创建流量记录
            flow_usage = self.db.query(FlowUsage).filter(
                FlowUsage.user_id == user_id,
                FlowUsage.instance_no == instance_no
            ).first()
            
            if not flow_usage:
                flow_usage = FlowUsage(
                    user_id=user_id,
                    instance_no=instance_no,
                    daily_usage=usage,
                    monthly_usage=usage,
                    total_usage=usage,
                    remark=remark
                )
                self.db.add(flow_usage)
            else:
                # 更新使用量
                flow_usage.daily_usage += usage
                flow_usage.monthly_usage += usage
                flow_usage.total_usage += usage
                flow_usage.remark = remark
                self.db.add(flow_usage)
            
            # 提交事务
            self.db.commit()
            
            return {
                "code": 0,
                "msg": "记录成功",
                "data": flow_usage.to_dict()
            }
            
        except HTTPException as e:
            self.db.rollback()
            raise e
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"记录流量使用失败: {str(e)}")
            
    def get_usage_history(
        self,
        user_id: Optional[int] = None,
        instance_no: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        获取流量使用历史
        
        Args:
            user_id: 用户ID
            instance_no: 实例编号
            start_time: 开始时间
            end_time: 结束时间
            page: 页码
            page_size: 每页数量
            
        Returns:
            Dict: 使用历史列表
        """
        try:
            # 构建查询
            query = self.db.query(FlowUsage)
            
            # 添加过滤条件
            if user_id:
                query = query.filter(FlowUsage.user_id == user_id)
            if instance_no:
                query = query.filter(FlowUsage.instance_no == instance_no)
            if start_time:
                query = query.filter(FlowUsage.created_at >= start_time)
            if end_time:
                query = query.filter(FlowUsage.created_at <= end_time)
                
            # 计算总数
            total = query.count()
            
            # 分页
            records = query.order_by(FlowUsage.created_at.desc()) \
                .offset((page - 1) * page_size) \
                .limit(page_size) \
                .all()
                
            return {
                "code": 0,
                "msg": "success",
                "data": {
                    "list": [r.to_dict() for r in records],
                    "total": total,
                    "page": page,
                    "page_size": page_size
                }
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取流量使用历史失败: {str(e)}")
            
    def get_usage_statistics(
        self,
        user_id: int,
        instance_no: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        获取流量使用统计
        
        Args:
            user_id: 用户ID
            instance_no: 实例编号
            
        Returns:
            Dict: 使用统计信息
        """
        try:
            # 构建查询
            query = self.db.query(FlowUsage).filter(FlowUsage.user_id == user_id)
            
            if instance_no:
                query = query.filter(FlowUsage.instance_no == instance_no)
                
            # 获取今日开始时间
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            
            # 获取本月开始时间
            month_start = today_start.replace(day=1)
            
            # 获取所有记录
            records = query.all()
            
            # 计算统计数据
            statistics = {
                "daily_usage": sum(r.daily_usage for r in records if r.created_at >= today_start),
                "monthly_usage": sum(r.monthly_usage for r in records if r.created_at >= month_start),
                "total_usage": sum(r.total_usage for r in records)
            }
            
            return {
                "code": 0,
                "msg": "success",
                "data": statistics
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取流量使用统计失败: {str(e)}")
            
    def reset_daily_usage(self) -> None:
        """重置每日使用量"""
        try:
            records = self.db.query(FlowUsage).all()
            for record in records:
                record.daily_usage = 0
                self.db.add(record)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"重置每日使用量失败: {str(e)}")
            
    def reset_monthly_usage(self) -> None:
        """重置每月使用量"""
        try:
            records = self.db.query(FlowUsage).all()
            for record in records:
                record.monthly_usage = 0
                self.db.add(record)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"重置每月使用量失败: {str(e)}") 