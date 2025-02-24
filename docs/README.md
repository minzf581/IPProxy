# IP管理后台系统

## 项目简介
IP管理后台是一个完整的IP资源管理系统，支持动态IP和静态IP的统一管理，包含多级代理商管理体系，提供订单管理、用户管理等核心功能。

## 主要功能

### 1. 仪表盘
- 财务数据统计（充值、消费、余额）
- 动态资源使用情况监控
- 静态资源使用情况监控
- 数据可视化展示

### 2. 账户管理
#### 2.1 代理商管理
- 代理商账户CRUD
- 余额充值
- 额度调整
- 密码管理
- 状态管理

#### 2.2 用户管理
- 用户账户CRUD
- 状态管理
- 密码管理
- 用户仪表盘查看

### 3. 订单管理
#### 3.1 代理商订单
- 订单查询和筛选
- 订单状态管理
- 支付确认
- 订单详情查看

#### 3.2 用户动态订单
- 订单查询和筛选
- 流量使用统计
- 订单详情查看

#### 3.3 用户静态订单
- 订单多维度查询
- IP资源分配管理
- 订单状态跟踪
- 到期时间管理

### 4. 静态IP管理
- IP资源统计
- IP使用状态管理
- IP分配记录
- 资源导出

### 5. 系统设置
- 管理员密码修改
- 系统参数配置

## 技术栈

### 前端
- React 18
- TypeScript
- Ant Design 5.x
- React Router 6
- Axios
- ECharts (数据可视化)
- Redux Toolkit (状态管理)

### 后端
- Node.js
- Express/Koa
- TypeScript
- MySQL/PostgreSQL
- Redis (缓存)
- JWT (认证)

### 开发工具和环境
- Vite (构建工具)
- ESLint + Prettier (代码规范)
- Git (版本控制)
- Docker (容器化)

## 权限控制
系统实现了基于角色的访问控制(RBAC)：
- 超级管理员：可访问所有功能
- 代理商：不可访问代理商管理功能
- 普通用户：仅可访问基础功能

## 部署要求
- Node.js >= 16
- MySQL >= 8.0
- Redis >= 6.0
- 现代浏览器支持

## 开发团队
- 前端开发工程师
- 后端开发工程师
- UI设计师
- 测试工程师

## 项目特点
1. 完整的多级代理商管理体系
2. 动态和静态IP资源的统一管理
3. 详细的数据统计和可视化
4. 完善的权限控制机制
5. 响应式设计，支持多端适配

## 未来规划
暂无