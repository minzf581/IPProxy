import pytest
import time
from datetime import datetime
from app.models import Region, Country, City, IpRange
from app.services.sync_service import sync_areas, sync_countries, sync_cities, sync_ip_ranges

class TestPerformance:
    @pytest.mark.asyncio
    async def test_batch_update(self, test_db, mock_ipproxy_api):
        """测试批量更新性能"""
        # 记录开始时间
        start_time = time.time()
        
        # 执行批量更新
        await sync_areas(test_db)
        await sync_countries(test_db, 'AS')
        await sync_cities(test_db, 'CN')
        
        # 计算耗时
        duration = time.time() - start_time
        
        # 验证性能要求（所有操作应在3秒内完成）
        assert duration < 3.0
    
    @pytest.mark.asyncio
    async def test_query_performance(self, test_db):
        """测试查询性能"""
        # 准备测试数据
        countries = [
            Country(
                code=f'C{i}',
                name=f'Country{i}',
                cname=f'国家{i}',
                region_code='AS',
                status=1,
                sync_status='success',
                last_sync_at=datetime.now()
            )
            for i in range(1000)
        ]
        test_db.bulk_save_objects(countries)
        test_db.commit()
        
        # 测试单个查询性能
        start_time = time.time()
        result = test_db.query(Country).filter_by(code='C500').first()
        single_query_time = time.time() - start_time
        assert single_query_time < 0.01  # 单个查询应在10ms内完成
        
        # 测试批量查询性能
        start_time = time.time()
        results = test_db.query(Country).filter_by(region_code='AS').all()
        batch_query_time = time.time() - start_time
        assert batch_query_time < 0.1  # 批量查询应在100ms内完成
        assert len(results) == 1000
    
    @pytest.mark.asyncio
    async def test_concurrent_updates(self, test_db, mock_ipproxy_api):
        """测试并发更新性能"""
        import asyncio
        
        # 创建多个并发更新任务
        tasks = [
            sync_countries(test_db, 'AS'),
            sync_countries(test_db, 'EU'),
            sync_cities(test_db, 'CN'),
            sync_cities(test_db, 'JP')
        ]
        
        # 记录开始时间
        start_time = time.time()
        
        # 并发执行任务
        await asyncio.gather(*tasks)
        
        # 计算耗时
        duration = time.time() - start_time
        
        # 验证性能要求（并发操作应在2秒内完成）
        assert duration < 2.0
    
    @pytest.mark.asyncio
    async def test_memory_usage(self, test_db):
        """测试内存使用"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # 转换为MB
        
        # 执行大量数据操作
        cities = [
            City(
                code=f'CITY{i}',
                name=f'City {i}',
                cname=f'城市 {i}',
                country_code='CN',
                status=1,
                sync_status='success',
                last_sync_at=datetime.now()
            )
            for i in range(10000)
        ]
        test_db.bulk_save_objects(cities)
        test_db.commit()
        
        # 查询所有数据
        all_cities = test_db.query(City).all()
        
        # 检查内存使用增长
        final_memory = process.memory_info().rss / 1024 / 1024
        memory_increase = final_memory - initial_memory
        
        # 验证内存增长不超过100MB
        assert memory_increase < 100 