# IP管理后台系统数据库设计

## 用户相关表

### 1. 用户表 (users)
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户账号',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    agent_id BIGINT COMMENT '所属代理商ID',
    role ENUM('admin', 'agent', 'user') NOT NULL COMMENT '用户角色',
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active' COMMENT '账户状态',
    remark VARCHAR(255) COMMENT '备注',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
);
```

### 2. 代理商账户表 (agent_accounts)
```sql
CREATE TABLE agent_accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    agent_id BIGINT NOT NULL COMMENT '代理商ID',
    balance DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '账户余额',
    total_recharge DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '累计充值',
    total_consumption DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '累计消费',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES users(id)
);
```

## 订单相关表

### 3. 代理商订单表 (agent_orders)
```sql
CREATE TABLE agent_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(20) UNIQUE NOT NULL COMMENT '订单号',
    agent_id BIGINT NOT NULL COMMENT '代理商ID',
    amount DECIMAL(10,2) NOT NULL COMMENT '订单金额',
    status ENUM('pending', 'paid') NOT NULL DEFAULT 'pending' COMMENT '订单状态',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    paid_at TIMESTAMP NULL COMMENT '支付时间',
    FOREIGN KEY (agent_id) REFERENCES users(id)
);
```

### 4. 用户动态订单表 (user_dynamic_orders)
```sql
CREATE TABLE user_dynamic_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(20) UNIQUE NOT NULL COMMENT '订单号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    agent_id BIGINT NOT NULL COMMENT '代理商ID',
    resource_id BIGINT NOT NULL COMMENT '资源ID',
    traffic BIGINT NOT NULL COMMENT '流量大小(GB)',
    remark VARCHAR(255) COMMENT '备注',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (agent_id) REFERENCES users(id)
);
```

### 5. 用户静态订单表 (user_static_orders)
```sql
CREATE TABLE user_static_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(20) UNIQUE NOT NULL COMMENT '订单号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    agent_id BIGINT NOT NULL COMMENT '代理商ID',
    ip_id BIGINT NOT NULL COMMENT 'IP资源ID',
    status ENUM('active', 'expired') NOT NULL DEFAULT 'active' COMMENT '订单状态',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    expired_at TIMESTAMP NOT NULL COMMENT '到期时间',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (agent_id) REFERENCES users(id)
);
```

## 资源相关表

### 6. 动态资源表 (dynamic_resources)
```sql
CREATE TABLE dynamic_resources (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '资源名称',
    total_traffic BIGINT NOT NULL COMMENT '总流量(GB)',
    used_traffic BIGINT NOT NULL DEFAULT 0 COMMENT '已使用流量(GB)',
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active' COMMENT '资源状态',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 7. 静态IP资源表 (static_ip_resources)
```sql
CREATE TABLE static_ip_resources (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ip_address VARCHAR(15) NOT NULL COMMENT 'IP地址',
    port INT NOT NULL COMMENT '端口',
    username VARCHAR(50) NOT NULL COMMENT '认证用户名',
    password VARCHAR(50) NOT NULL COMMENT '认证密码',
    location VARCHAR(50) NOT NULL COMMENT '位置',
    resource_type VARCHAR(50) NOT NULL COMMENT '资源类型',
    status ENUM('available', 'in_use', 'expired') NOT NULL DEFAULT 'available' COMMENT 'IP状态',
    user_id BIGINT NULL COMMENT '使用者ID',
    expired_at TIMESTAMP NULL COMMENT '到期时间',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 8. 资源使用统计表 (resource_usage_stats)
```sql
CREATE TABLE resource_usage_stats (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    resource_id BIGINT NOT NULL COMMENT '资源ID',
    resource_type ENUM('dynamic', 'static') NOT NULL COMMENT '资源类型',
    usage_amount BIGINT NOT NULL COMMENT '使用量',
    stat_date DATE NOT NULL COMMENT '统计日期',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 索引设计

```sql
-- users表索引
CREATE INDEX idx_users_agent_id ON users(agent_id);
CREATE INDEX idx_users_status ON users(status);

-- agent_accounts表索引
CREATE INDEX idx_agent_accounts_agent_id ON agent_accounts(agent_id);

-- 订单表索引
CREATE INDEX idx_agent_orders_agent_id ON agent_orders(agent_id);
CREATE INDEX idx_agent_orders_status ON agent_orders(status);
CREATE INDEX idx_user_dynamic_orders_user_id ON user_dynamic_orders(user_id);
CREATE INDEX idx_user_static_orders_user_id ON user_static_orders(user_id);
CREATE INDEX idx_user_static_orders_status ON user_static_orders(status);

-- 资源表索引
CREATE INDEX idx_static_ip_resources_status ON static_ip_resources(status);
CREATE INDEX idx_static_ip_resources_user_id ON static_ip_resources(user_id);
CREATE INDEX idx_resource_usage_stats_user_date ON resource_usage_stats(user_id, stat_date);
```

## 说明

1. 所有表都包含 created_at 字段，记录创建时间
2. 关键表包含 updated_at 字段，记录更新时间
3. 使用软删除策略，关键表添加 deleted_at 字段
4. 金额相关字段使用 DECIMAL 类型确保精确计算
5. 使用外键约束确保数据完整性
6. 合理设置索引提升查询性能
7. 使用 ENUM 类型规范状态字段的值范围

## 注意事项

1. 生产环境部署时注意设置适当的字符集和排序规则
2. 根据实际数据量设置合适的字段长度
3. 关键表建议开启事务日志
4. 定期备份数据库
5. 监控索引使用情况，适时优化 