# IP代理系统数据库设计文档

## 1. 概述
本文档描述了IP代理系统的数据库设计。系统使用关系型数据库存储用户、订单、资源使用等信息。

## 2. 数据库表结构

### 2.1 用户账户表 (users)
存储系统用户信息
```sql
CREATE TABLE users (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    balance         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.2 充值记录表 (recharge_records)
记录用户的充值历史
```sql
CREATE TABLE recharge_records (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    payment_method  VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.3 消费记录表 (consumption_records)
记录用户的消费历史
```sql
CREATE TABLE consumption_records (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    resource_type   VARCHAR(20) NOT NULL,
    resource_id     BIGINT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.4 动态资源表 (dynamic_resources)
记录动态IP资源的使用情况
```sql
CREATE TABLE dynamic_resources (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    title           VARCHAR(50) NOT NULL,
    total_amount    BIGINT NOT NULL,
    used_amount     BIGINT NOT NULL,
    today_usage     BIGINT NOT NULL DEFAULT 0,
    last_month_usage BIGINT NOT NULL DEFAULT 0,
    percentage      INT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.5 静态资源表 (static_resources)
记录静态IP资源的使用情况
```sql
CREATE TABLE static_resources (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    title           VARCHAR(50) NOT NULL,
    total_amount    BIGINT NOT NULL,
    used_amount     BIGINT NOT NULL,
    today_usage     BIGINT NOT NULL DEFAULT 0,
    last_month_usage BIGINT NOT NULL DEFAULT 0,
    available_amount BIGINT NOT NULL DEFAULT 0,
    percentage      INT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.6 资源更新日志表 (resource_update_logs)
记录从第三方API更新资源数据的日志
```sql
CREATE TABLE resource_update_logs (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    resource_type   VARCHAR(20) NOT NULL,
    resource_id     BIGINT NOT NULL,
    update_type     VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL,
    error_message   TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 3. 数据同步策略

### 3.1 定时同步
- 系统每5分钟从第三方API获取一次最新的资源使用数据
- 更新动态资源和静态资源表中的数据
- 记录更新日志到resource_update_logs表

### 3.2 数据计算
- 每天凌晨计算前一天的资源使用情况，更新today_usage字段
- 每月1号凌晨计算上月的资源使用情况，更新last_month_usage字段
- 实时计算资源使用百分比，更新percentage字段

## 4. 统计数据查询

### 4.1 仪表盘数据
仪表盘数据通过以下SQL查询获取：

```sql
-- 累计充值
SELECT SUM(amount) FROM recharge_records WHERE status = 'SUCCESS';

-- 累计消费
SELECT SUM(amount) FROM consumption_records;

-- 剩余金额
SELECT balance FROM users WHERE id = ?;

-- 本月充值
SELECT SUM(amount) 
FROM recharge_records 
WHERE status = 'SUCCESS' 
AND MONTH(created_at) = MONTH(CURRENT_DATE())
AND YEAR(created_at) = YEAR(CURRENT_DATE());

-- 本月消费
SELECT SUM(amount) 
FROM consumption_records 
WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
AND YEAR(created_at) = YEAR(CURRENT_DATE());

-- 上月消费
SELECT SUM(amount) 
FROM consumption_records 
WHERE MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH));
```

## 5. 注意事项

### 5.1 数据一致性
- 所有金额相关的操作都需要在事务中进行
- 用户余额变动需要同时更新users表和相应的记录表
- 资源使用数据的更新需要保证原子性

### 5.2 性能优化
- 为常用查询字段创建索引
- 定期清理过期的日志数据
- 考虑使用缓存来存储实时统计数据

### 5.3 安全性
- 所有金额相关的字段使用DECIMAL类型，避免浮点数计算误差
- 密码必须加密存储
- 关键操作需要记录操作日志
