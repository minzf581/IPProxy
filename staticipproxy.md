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
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100),
    cname VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 国家表 (countries)
```sql
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100),
    cname VARCHAR(100) NOT NULL,
    area_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (area_code) REFERENCES areas(code)
);
```

### 3.3 城市表 (cities)
```sql
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100),
    cname VARCHAR(100) NOT NULL,
    country_code VARCHAR(50) NOT NULL,
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