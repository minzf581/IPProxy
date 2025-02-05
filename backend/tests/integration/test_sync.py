import pytest
from datetime import datetime, timedelta
from app.models.region import Region, Country, City
from app.services.sync import sync_regions, sync_countries, sync_cities
import logging

# 设置日志级别
logging.basicConfig(level=logging.INFO)

class TestDataSync:
    @pytest.mark.asyncio
    async def test_area_sync(self, test_db, mock_ipproxy_api):
        """测试区域同步"""
        # 执行区域同步
        regions = await sync_regions(test_db)
        
        # 验证同步结果
        assert len(regions) == 6  # 预定义了6个区域
        
        # 验证数据库中的区域数据
        areas = test_db.query(Region).all()
        assert len(areas) == 6
        
        # 验证亚洲区域数据
        asia = test_db.query(Region).filter_by(code='AS').first()
        assert asia is not None
        assert asia.name == '亚洲'
        assert asia.status == 1
    
    @pytest.mark.asyncio
    async def test_country_sync(self, test_db, mock_ipproxy_api):
        """测试国家同步"""
        # 先同步区域
        await sync_regions(test_db)
        
        # 执行国家同步
        countries = await sync_countries(test_db, 'AS')
        
        # 验证同步结果
        assert len(countries) > 0
        
        # 验证数据库中的国家数据
        db_countries = test_db.query(Country).filter_by(region_code='AS').all()
        assert len(db_countries) > 0
        
        # 验证中国数据
        china = test_db.query(Country).filter_by(code='CN').first()
        assert china is not None
        assert china.region_code == 'AS'
    
    @pytest.mark.asyncio
    async def test_city_sync(self, test_db, mock_ipproxy_api):
        """测试城市同步"""
        # 先同步区域和国家
        await sync_regions(test_db)
        await sync_countries(test_db, 'AS')
        
        # 执行城市同步
        cities = await sync_cities(test_db, 'CN')
        
        # 验证同步结果
        assert len(cities) > 0
        
        # 验证数据库中的城市数据
        db_cities = test_db.query(City).filter_by(country_code='CN').all()
        assert len(db_cities) > 0
        
        # 验证北京数据
        beijing = test_db.query(City).filter_by(name='北京').first()
        assert beijing is not None
        assert beijing.country_code == 'CN'
    
    @pytest.mark.asyncio
    async def test_sync_error_handling(self, test_db, mock_ipproxy_api):
        """测试同步错误处理"""
        # 清除数据库中的现有数据
        test_db.query(Country).delete()
        test_db.commit()
        
        # 模拟API调用失败，设置3次失败
        mock_ipproxy_api.fail_next(3)
        
        # 执行同步并验证错误处理
        countries = await sync_countries(test_db, 'AS', max_retries=3)
        
        # 验证在失败后仍能返回空列表
        assert isinstance(countries, list)
        assert len(countries) == 0 