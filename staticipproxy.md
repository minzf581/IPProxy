# 静态代理 IP 业务流程设计

## 1. 概述

本文档描述了静态代理 IP 业务开通流程的设计，包括前端界面交互、后端数据同步以及与 IPIPV API 的集成。

## 2. 业务流程

### 2.1 整体流程

1. 用户打开业务开通页面
2. 用户选择静态代理服务
3. 系统展示区域选择界面
4. 用户依次选择：区域 -> 国家 -> 城市
5. 系统展示可用 IP 段和库存信息
6. 用户选择具体 IP 段并提交订单

### 2.2 数据同步流程

#### 区域信息同步
1. 前端从后端数据库获取区域列表
2. 后端定期从 IPIPV API 同步区域信息到本地数据库

#### 国家信息同步
1. 用户选择区域后，前端请求后端获取该区域的国家列表
2. 后端检查本地数据库是否有该区域的国家信息
3. 如果没有或需要更新，后端从 IPIPV API 获取并同步到本地数据库
4. 返回国家列表给前端

#### 城市信息同步
1. 用户选择国家后，前端请求后端获取该国家的城市列表
2. 后端检查本地数据库是否有该国家的城市信息
3. 如果没有或需要更新，后端从 IPIPV API 获取并同步到本地数据库
4. 返回城市列表给前端

#### IP 段和库存信息同步
1. 用户选择城市后，前端请求后端获取该城市的 IP 段和库存信息
2. 后端检查本地数据库是否有该城市的 IP 段和库存信息
3. 如果没有或需要更新，后端从 IPIPV API 获取并同步到本地数据库
4. 返回 IP 段和库存信息给前端

## 3. 数据模型

### 3.1 区域表 (areas)
```sql
CREATE TABLE areas (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cname VARCHAR(100) NOT NULL,
    status INTEGER DEFAULT 1,
    -- 缓存控制字段
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending',
    error_count INTEGER DEFAULT 0,
    next_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 国家表 (countries)
```sql
CREATE TABLE countries (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cname VARCHAR(100) NOT NULL,
    region_code VARCHAR(50) NOT NULL,
    status INTEGER DEFAULT 1,
    -- 缓存控制字段
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending',
    error_count INTEGER DEFAULT 0,
    next_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (region_code) REFERENCES areas(code)
);
```

### 3.3 城市表 (cities)
```sql
CREATE TABLE cities (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cname VARCHAR(100) NOT NULL,
    country_code VARCHAR(50) NOT NULL,
    status INTEGER DEFAULT 1,
    -- 缓存控制字段
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending',
    error_count INTEGER DEFAULT 0,
    next_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (country_code) REFERENCES countries(code)
);
```

### 3.4 IP 段表 (ip_ranges)
```sql
CREATE TABLE ip_ranges (
    id SERIAL PRIMARY KEY,
    city_code VARCHAR(50) NOT NULL,
    ip_start VARCHAR(50) NOT NULL,
    ip_end VARCHAR(50) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_code) REFERENCES cities(code)
);
```

## 4. API 接口设计

### 4.1 前端 API

#### 获取区域列表
```
GET /api/areas
Response: {
    code: number,
    data: Array<{
        code: string,
        name: string,
        cname: string
    }>
}
```

#### 获取国家列表
```
GET /api/countries?areaCode={areaCode}
Response: {
    code: number,
    data: Array<{
        code: string,
        name: string,
        cname: string,
        areaCode: string
    }>
}
```

#### 获取城市列表
```
GET /api/cities?countryCode={countryCode}
Response: {
    code: number,
    data: Array<{
        code: string,
        name: string,
        cname: string,
        countryCode: string
    }>
}
```

#### 获取 IP 段列表
```
GET /api/ip-ranges?cityCode={cityCode}
Response: {
    code: number,
    data: Array<{
        id: number,
        cityCode: string,
        ipStart: string,
        ipEnd: string,
        stock: number
    }>
}
```

### 4.2 后端同步任务

#### 同步区域信息
- 定时任务，每天同步一次
- 调用 IPIPV API 获取最新区域信息
- 更新本地数据库

#### 同步国家信息
- 用户请求触发
- 检查数据更新时间，超过 1 小时则重新同步
- 调用 IPIPV API 获取指定区域的国家信息
- 更新本地数据库

#### 同步城市信息
- 用户请求触发
- 检查数据更新时间，超过 1 小时则重新同步
- 调用 IPIPV API 获取指定国家的城市信息
- 更新本地数据库

#### 同步 IP 段和库存信息
- 用户请求触发
- 检查数据更新时间，超过 5 分钟则重新同步
- 调用 IPIPV API 获取指定城市的 IP 段和库存信息
- 更新本地数据库

## 5. 前端组件设计

### 5.1 业务开通表单 (BusinessActivationForm)
- 选择代理类型（静态/动态）
- 根据选择显示不同的表单内容

### 5.2 区域选择组件 (RegionSelector)
- 级联选择器
- 包含区域、国家、城市三级选择
- 异步加载数据
- 实时显示选中项的可用性状态

### 5.3 IP 段选择组件 (IpRangeSelector)
- 表格形式展示可用 IP 段
- 显示每个 IP 段的库存信息
- 支持多选功能
- 实时计算选中 IP 的总数和费用

## 6. 注意事项

### 6.1 数据同步
- 合理设置同步频率，避免过于频繁请求 IPIPV API
- 实现数据版本控制，确保数据一致性
- 添加同步失败重试机制
- 记录同步日志，方便问题排查

### 6.2 缓存策略
- 对区域、国家、城市信息进行适当缓存
- IP 段和库存信息需要及时更新，缓存时间不宜过长
- 实现缓存预热机制，提高系统响应速度

### 6.3 错误处理
- 完善的错误提示机制
- 网络异常时的重试机制
- 数据加载失败时的降级策略

### 6.4 性能优化
- 使用分页加载大量数据
- 实现数据预加载
- 优化数据库查询性能
- 添加必要的索引

## 7. 后续优化建议

1. 添加数据同步状态监控
2. 实现数据变更通知机制
3. 优化用户选择体验
4. 添加数据统计和分析功能
5. 实现智能库存预警机制

## 8. 数据库缓存优化方案

### 8.1 缓存控制字段说明

1. **last_sync_at**
   - 记录最后一次同步时间
   - 用于判断数据是否需要更新
   - 配合 next_sync_at 实现智能更新

2. **sync_status**
   - pending: 待同步
   - syncing: 同步中
   - success: 同步成功
   - failed: 同步失败
   - 用于防止重复同步和监控同步状态

3. **error_count**
   - 记录同步失败次数
   - 用于实现退避策略
   - 超过阈值时可以触发告警

4. **next_sync_at**
   - 计划下次同步时间
   - 基于访问频率动态调整
   - 用于实现智能预热

### 8.2 缓存更新策略

1. **按需更新机制**
   ```python
   def should_update(entity):
       if entity.sync_status == 'syncing':
           # 如果正在同步中，检查是否超时
           if datetime.now() - entity.last_sync_at > SYNC_TIMEOUT:
               return True
           return False
       
       if entity.sync_status == 'failed':
           # 如果同步失败，使用指数退避策略
           backoff = min(2 ** entity.error_count, MAX_BACKOFF)
           if datetime.now() - entity.last_sync_at > timedelta(minutes=backoff):
               return True
           return False
       
       # 检查是否达到下次同步时间
       if entity.next_sync_at and datetime.now() < entity.next_sync_at:
           return False
       
       return True
   ```

2. **智能预热策略**
   - 基于访问频率动态调整 next_sync_at
   - 高频访问的数据提前同步
   - 低频访问的数据延长同步间隔

3. **批量更新优化**
   - 同时更新关联数据
   - 减少 API 调用次数
   - 保持数据一致性

### 8.3 错误处理和恢复

1. **指数退避策略**
   - 首次失败等待 1 分钟
   - 第二次失败等待 2 分钟
   - 第三次失败等待 4 分钟
   - 最大等待时间 30 分钟

2. **同步状态恢复**
   - 系统启动时检查 syncing 状态的记录
   - 超时未完成的任务重置为 pending
   - 记录异常日志

3. **数据一致性保护**
   - 使用事务确保更新原子性
   - 保留旧数据直到新数据验证成功
   - 支持手动触发重新同步

### 8.4 监控和维护

1. **性能指标**
   - 同步成功率
   - 数据更新延迟
   - API 调用频率
   - 缓存命中率

2. **告警机制**
   - 同步失败次数超过阈值
   - 数据更新延迟超过阈值
   - API 调用频率异常
   - 存储空间告警

3. **维护工具**
   - 手动触发同步
   - 清理过期数据
   - 重置错误计数
   - 调整同步参数

### 8.5 配置参数

```python
SYNC_CONFIG = {
    'areas': {
        'max_error_count': 5,
        'sync_timeout': 300,  # 5分钟
        'min_sync_interval': 3600,  # 1小时
        'max_sync_interval': 86400,  # 24小时
    },
    'countries': {
        'max_error_count': 5,
        'sync_timeout': 300,
        'min_sync_interval': 1800,  # 30分钟
        'max_sync_interval': 43200,  # 12小时
    },
    'cities': {
        'max_error_count': 5,
        'sync_timeout': 300,
        'min_sync_interval': 1800,
        'max_sync_interval': 43200,
    }
}
```

## 9. 数据获取流程详解

### 9.1 区域数据获取流程

1. **前端请求区域列表**
```typescript
GET /api/areas
```

2. **后端处理流程**
```python
async def get_areas():
    # 1. 检查数据库缓存
    areas = db.query(Area).filter(Area.status == 1).all()
    
    # 2. 检查是否需要更新
    if should_update(areas):
        try:
            # 2.1 更新状态为同步中
            areas.sync_status = 'syncing'
            db.commit()
            
            # 2.2 从 IPIPV API 获取数据
            api_data = await ipproxy_api.get_area_list()
            
            # 2.3 更新数据库
            for area in api_data:
                db_area = Area(
                    code=area['code'],
                    name=area['name'],
                    status=1,
                    sync_status='success',
                    last_sync_at=datetime.now()
                )
                db.merge(db_area)
            
            db.commit()
            
        except Exception as e:
            # 2.4 更新失败处理
            areas.error_count += 1
            areas.sync_status = 'failed'
            db.commit()
            log_error(e)
    
    # 3. 返回数据给前端
    return areas
```

### 9.2 国家数据获取流程

1. **前端请求国家列表**
```typescript
GET /api/countries?areaCode={areaCode}
```

2. **后端处理流程**
```python
async def get_countries(area_code: str):
    # 1. 检查数据库缓存
    countries = db.query(Country).filter(
        Country.region_code == area_code,
        Country.status == 1
    ).all()
    
    # 2. 检查是否需要更新
    if should_update(countries):
        try:
            # 2.1 更新状态为同步中
            for country in countries:
                country.sync_status = 'syncing'
            db.commit()
            
            # 2.2 从 IPIPV API 获取数据
            api_data = await ipproxy_api.get_countries(area_code)
            
            # 2.3 更新数据库
            for country_data in api_data:
                db_country = Country(
                    code=country_data['code'],
                    name=country_data['name'],
                    region_code=area_code,
                    status=1,
                    sync_status='success',
                    last_sync_at=datetime.now()
                )
                db.merge(db_country)
            
            db.commit()
            
        except Exception as e:
            # 2.4 更新失败处理
            for country in countries:
                country.error_count += 1
                country.sync_status = 'failed'
            db.commit()
            log_error(e)
    
    # 3. 返回数据给前端
    return countries
```

### 9.3 城市数据获取流程

1. **前端请求城市列表**
```typescript
GET /api/cities?countryCode={countryCode}
```

2. **后端处理流程**
```python
async def get_cities(country_code: str):
    # 1. 检查数据库缓存
    cities = db.query(City).filter(
        City.country_code == country_code,
        City.status == 1
    ).all()
    
    # 2. 检查是否需要更新
    if should_update(cities):
        try:
            # 2.1 更新状态为同步中
            for city in cities:
                city.sync_status = 'syncing'
            db.commit()
            
            # 2.2 从 IPIPV API 获取数据
            api_data = await ipproxy_api.get_cities(country_code)
            
            # 2.3 更新数据库
            for city_data in api_data:
                db_city = City(
                    code=city_data['code'],
                    name=city_data['name'],
                    country_code=country_code,
                    status=1,
                    sync_status='success',
                    last_sync_at=datetime.now()
                )
                db.merge(db_city)
            
            db.commit()
            
        except Exception as e:
            # 2.4 更新失败处理
            for city in cities:
                city.error_count += 1
                city.sync_status = 'failed'
            db.commit()
            log_error(e)
    
    # 3. 返回数据给前端
    return cities
```

### 9.4 IP 段数据获取流程

1. **前端请求 IP 段列表**
```typescript
GET /api/ip-ranges?cityCode={cityCode}
```

2. **后端处理流程**
```python
async def get_ip_ranges(city_code: str):
    # 1. 检查数据库缓存
    ip_ranges = db.query(IpRange).filter(
        IpRange.city_code == city_code
    ).all()
    
    # 2. 检查是否需要更新（IP 段数据更新频率更高）
    if should_update_ip_ranges(ip_ranges):
        try {
            # 2.1 从 IPIPV API 获取数据
            api_data = await ipproxy_api.get_ip_ranges(city_code)
            
            # 2.2 更新数据库
            # 使用事务保证原子性
            with db.begin():
                # 删除旧数据
                db.query(IpRange).filter(
                    IpRange.city_code == city_code
                ).delete()
                
                # 插入新数据
                for range_data in api_data:
                    db_range = IpRange(
                        city_code=city_code,
                        ip_start=range_data['start'],
                        ip_end=range_data['end'],
                        stock=range_data['stock']
                    )
                    db.add(db_range)
            
        } catch (e) {
            log_error(e)
            # 返回旧数据
            return ip_ranges
        }
    
    # 3. 返回数据给前端
    return ip_ranges
```

### 9.5 数据同步状态监控

1. **同步状态检查**
```python
def check_sync_status():
    # 检查长时间处于 syncing 状态的记录
    timeout_records = db.query(Base).filter(
        Base.sync_status == 'syncing',
        Base.last_sync_at < datetime.now() - SYNC_TIMEOUT
    ).all()
    
    for record in timeout_records:
        record.sync_status = 'failed'
        record.error_count += 1
        log_error(f"同步超时: {record}")
    
    db.commit()
```

2. **错误恢复机制**
```python
def recover_failed_sync():
    # 查找失败次数未超过阈值的记录
    failed_records = db.query(Base).filter(
        Base.sync_status == 'failed',
        Base.error_count < MAX_ERROR_COUNT
    ).all()
    
    for record in failed_records:
        # 使用指数退避策略计算下次同步时间
        backoff = min(2 ** record.error_count, MAX_BACKOFF)
        record.next_sync_at = datetime.now() + timedelta(minutes=backoff)
        record.sync_status = 'pending'
    
    db.commit()
```

### 9.6 性能优化

1. **批量更新优化**
```python
async def batch_update_countries(area_code: str):
    # 一次性获取所有需要更新的国家
    countries = await ipproxy_api.get_countries(area_code)
    
    # 批量插入/更新
    db.bulk_insert_mappings(Country, [
        {
            'code': c['code'],
            'name': c['name'],
            'region_code': area_code,
            'status': 1,
            'sync_status': 'success',
            'last_sync_at': datetime.now()
        }
        for c in countries
    ])
    
    db.commit()
```

2. **查询优化**
```python
# 添加复合索引
Index('idx_country_status_sync', Country.status, Country.sync_status)
Index('idx_city_country_status', City.country_code, City.status)
```

## 10. 集成测试方案

### 10.1 测试环境配置

1. **测试数据库设置**
```python
# backend/tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base

@pytest.fixture(scope="session")
def test_db():
    # 使用 SQLite 内存数据库进行测试
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    TestingSessionLocal = sessionmaker(bind=engine)
    
    Base.metadata.create_all(bind=engine)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)
```

2. **Mock IPIPV API**
```python
# backend/tests/mocks/ipproxy_api.py
class MockIPIPVAPI:
    def __init__(self):
        self.test_data = {
            'areas': [
                {'code': 'AS', 'name': 'Asia', 'cname': '亚洲'},
                {'code': 'EU', 'name': 'Europe', 'cname': '欧洲'}
            ],
            'countries': {
                'AS': [
                    {'code': 'CN', 'name': 'China', 'cname': '中国'},
                    {'code': 'JP', 'name': 'Japan', 'cname': '日本'}
                ]
            },
            'cities': {
                'CN': [
                    {'code': 'BJ', 'name': 'Beijing', 'cname': '北京'},
                    {'code': 'SH', 'name': 'Shanghai', 'cname': '上海'}
                ]
            },
            'ip_ranges': {
                'BJ': [
                    {'start': '1.1.1.1', 'end': '1.1.1.255', 'stock': 100},
                    {'start': '2.2.2.1', 'end': '2.2.2.255', 'stock': 200}
                ]
            }
        }
    
    async def get_area_list(self):
        return self.test_data['areas']
    
    async def get_countries(self, area_code: str):
        return self.test_data['countries'].get(area_code, [])
    
    async def get_cities(self, country_code: str):
        return self.test_data['cities'].get(country_code, [])
    
    async def get_ip_ranges(self, city_code: str):
        return self.test_data['ip_ranges'].get(city_code, [])
```

### 10.2 测试用例设计

1. **数据同步测试**
```python
# backend/tests/test_sync.py
import pytest
from app.models import Region, Country, City, IpRange

class TestDataSync:
    async def test_area_sync(self, test_db, mock_ipproxy_api):
        # 测试区域同步
        await sync_areas(test_db)
        areas = test_db.query(Region).all()
        assert len(areas) == 2
        assert areas[0].code == 'AS'
        assert areas[0].sync_status == 'success'
    
    async def test_country_sync(self, test_db, mock_ipproxy_api):
        # 测试国家同步
        await sync_countries(test_db, 'AS')
        countries = test_db.query(Country).filter_by(region_code='AS').all()
        assert len(countries) == 2
        assert countries[0].code == 'CN'
    
    async def test_city_sync(self, test_db, mock_ipproxy_api):
        # 测试城市同步
        await sync_cities(test_db, 'CN')
        cities = test_db.query(City).filter_by(country_code='CN').all()
        assert len(cities) == 2
        assert cities[0].code == 'BJ'
    
    async def test_ip_range_sync(self, test_db, mock_ipproxy_api):
        # 测试IP段同步
        await sync_ip_ranges(test_db, 'BJ')
        ranges = test_db.query(IpRange).filter_by(city_code='BJ').all()
        assert len(ranges) == 2
        assert ranges[0].stock == 100
```

2. **错误处理测试**
```python
# backend/tests/test_error_handling.py
class TestErrorHandling:
    async def test_sync_timeout(self, test_db, mock_ipproxy_api):
        # 测试同步超时处理
        mock_ipproxy_api.add_delay(10)  # 添加延迟
        await sync_areas(test_db)
        areas = test_db.query(Region).all()
        assert areas[0].sync_status == 'failed'
        assert areas[0].error_count == 1
    
    async def test_retry_mechanism(self, test_db, mock_ipproxy_api):
        # 测试重试机制
        mock_ipproxy_api.fail_next(2)  # 前两次请求失败
        await sync_areas(test_db)
        areas = test_db.query(Region).all()
        assert areas[0].sync_status == 'success'
        assert areas[0].error_count == 2
```

3. **缓存策略测试**
```python
# backend/tests/test_cache.py
class TestCacheStrategy:
    async def test_cache_update_condition(self, test_db):
        # 测试缓存更新条件
        area = Region(code='AS', name='Asia', last_sync_at=datetime.now())
        test_db.add(area)
        test_db.commit()
        
        assert not should_update(area)  # 刚更新的不需要同步
        
        area.last_sync_at = datetime.now() - timedelta(hours=2)
        assert should_update(area)  # 超过时间阈值需要同步
    
    async def test_concurrent_sync_protection(self, test_db):
        # 测试并发同步保护
        area = Region(code='AS', name='Asia', sync_status='syncing')
        test_db.add(area)
        test_db.commit()
        
        assert not should_update(area)  # 正在同步中不应该重复同步
```

### 10.3 性能测试

1. **批量操作测试**
```python
# backend/tests/test_performance.py
class TestPerformance:
    async def test_batch_update(self, test_db, mock_ipproxy_api):
        # 测试批量更新性能
        start_time = time.time()
        await batch_update_countries('AS')
        duration = time.time() - start_time
        assert duration < 1.0  # 批量更新应该在1秒内完成
    
    async def test_query_performance(self, test_db):
        # 测试查询性能
        # 添加1000条测试数据
        countries = [
            Country(code=f'C{i}', name=f'Country{i}', region_code='AS')
            for i in range(1000)
        ]
        test_db.bulk_save_objects(countries)
        test_db.commit()
        
        start_time = time.time()
        result = test_db.query(Country).filter_by(region_code='AS').all()
        duration = time.time() - start_time
        assert duration < 0.1  # 查询应该在0.1秒内完成
```

### 10.4 集成测试流程

1. **准备阶段**
   - 初始化测试数据库
   - 配置 Mock API
   - 设置测试环境变量

2. **测试执行**
   - 运行单元测试：`pytest tests/unit/`
   - 运行集成测试：`pytest tests/integration/`
   - 运行性能测试：`pytest tests/performance/`

3. **测试报告**
   - 生成覆盖率报告：`pytest --cov=app tests/`
   - 生成HTML测试报告：`pytest --html=report.html`

4. **测试验证标准**
   - 所有测试用例通过
   - 代码覆盖率达到 80% 以上
   - 性能测试指标满足要求
   - 无严重错误或警告

### 10.5 持续集成配置

```yaml
# .github/workflows/test.yml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio
      
      - name: Run tests
        run: |
          pytest --cov=app tests/
          pytest --html=report.html
      
      - name: Upload test results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: report.html
``` 