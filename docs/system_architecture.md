# IP代理管理系统架构文档

## 1. 系统概述

IP代理管理系统是一个完整的代理服务管理平台，支持动态代理和静态代理的管理、订单处理和用户管理。

## 2. 技术栈

### 2.1 后端
- FastAPI (Python)
- SQLAlchemy (ORM)
- PostgreSQL/SQLite (数据库)
- JWT (认证)

### 2.2 前端
- React
- TypeScript
- Ant Design
- Less (样式)

## 3. 数据库结构

### 3.1 核心表
- `users`: 用户表
- `transactions`: 交易记录表
- `dynamic_orders`: 动态订单表
- `static_orders`: 静态订单表
- `agent_prices`: 代理商价格表

### 3.2 资源相关表
- `product_inventory`: 产品库存表
- `resource_types`: 资源类型表
- `resource_usage`: 资源使用情况表
- `resource_usage_history`: 资源使用历史记录表
- `resource_usage_statistics`: 资源使用统计表

### 3.3 代理相关表
- `instances`: 代理实例表
- `flow_usage`: 流量使用记录表
- `agent_statistics`: 代理商统计表
- `proxy_info`: 代理信息表

## 4. 主要功能模块

### 4.1 用户管理
- 用户认证与授权
- 角色管理（管理员、代理商、普通用户）
- 用户信息管理

### 4.2 代理商管理
- 代理商账户管理
- 代理商资金管理
- 代理商统计信息

### 4.3 订单管理
- 动态代理订单
- 静态代理订单
- 订单状态追踪
- 订单统计

### 4.4 资源管理
- 代理资源管理
- 资源使用统计
- 资源分配

## 5. API接口

### 5.1 认证接口
- `/api/auth/login`: 用户登录
- `/api/auth/current-user`: 获取当前用户信息

### 5.2 代理商接口
- `/api/open/app/agent/list`: 获取代理商列表
- `/api/open/app/agent/{agent_id}`: 获取代理商详情
- `/api/open/app/agent/{agent_id}/statistics`: 获取代理商统计信息

### 5.3 订单接口
- `/api/open/app/agent-orders/v2`: 获取代理商订单列表
- `/api/open/app/static/order/list/v2`: 获取静态订单列表
- `/api/open/app/order/v2`: 获取订单列表

## 6. 前端架构

### 6.1 目录结构
```
src/
├── pages/          # 页面组件
├── services/       # API服务
├── components/     # 公共组件
├── hooks/          # 自定义Hook
├── utils/          # 工具函数
└── types/          # TypeScript类型定义
```

### 6.2 主要页面
- 代理商订单页面
- 用户管理页面
- 订单管理页面
- 统计分析页面

## 7. 安全性考虑

### 7.1 认证与授权
- JWT token认证
- 基于角色的访问控制
- API访问白名单

### 7.2 数据安全
- 密码加密存储
- 敏感数据加密
- 数据库事务保证

## 8. 性能优化

### 8.1 数据库优化
- 合理的索引设计
- 查询优化
- 连接池管理

### 8.2 前端优化
- 组件懒加载
- 数据缓存
- 请求防抖

## 9. 部署说明

### 9.1 环境要求
- Python 3.8+
- Node.js 14+
- PostgreSQL/SQLite

### 9.2 配置说明
- 数据库配置
- API配置
- 跨域配置
- 日志配置 