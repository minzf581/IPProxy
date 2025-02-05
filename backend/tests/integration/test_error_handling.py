import pytest
from datetime import datetime, timedelta
from app.models import Region, Country, City
from app.services.sync_service import sync_areas, sync_countries, sync_cities

class TestErrorHandling:
    @pytest.mark.asyncio
    async def test_sync_timeout(self, test_db, mock_ipproxy_api):
        """测试同步超时处理"""
        # 设置API延迟
        mock_ipproxy_api.add_delay(10)
        
        # 执行区域同步
        await sync_areas(test_db)
        
        # 验证同步状态
        areas = test_db.query(Region).all()
        assert areas[0].sync_status == 'failed'
        assert areas[0].error_count == 1
        
        # 清除延迟
        mock_ipproxy_api.add_delay(0)
    
    @pytest.mark.asyncio
    async def test_retry_mechanism(self, test_db, mock_ipproxy_api):
        """测试重试机制"""
        # 设置前两次请求失败
        mock_ipproxy_api.fail_next(2)
        
        # 执行区域同步
        await sync_areas(test_db)
        
        # 验证最终同步成功
        areas = test_db.query(Region).all()
        assert areas[0].sync_status == 'success'
        assert areas[0].error_count == 2
    
    @pytest.mark.asyncio
    async def test_concurrent_sync_protection(self, test_db, mock_ipproxy_api):
        """测试并发同步保护"""
        # 创建一个正在同步中的区域记录
        area = Region(
            code='TEST',
            name='Test Region',
            sync_status='syncing',
            last_sync_at=datetime.now()
        )
        test_db.add(area)
        test_db.commit()
        
        # 尝试再次同步
        await sync_areas(test_db)
        
        # 验证状态未改变
        area = test_db.query(Region).filter_by(code='TEST').first()
        assert area.sync_status == 'syncing'
    
    @pytest.mark.asyncio
    async def test_error_recovery(self, test_db, mock_ipproxy_api):
        """测试错误恢复"""
        # 创建一个同步失败的记录
        area = Region(
            code='TEST',
            name='Test Region',
            sync_status='failed',
            error_count=1,
            last_sync_at=datetime.now() - timedelta(minutes=5)
        )
        test_db.add(area)
        test_db.commit()
        
        # 执行同步
        await sync_areas(test_db)
        
        # 验证恢复成功
        area = test_db.query(Region).filter_by(code='TEST').first()
        assert area.sync_status == 'success'
        assert area.error_count == 0 