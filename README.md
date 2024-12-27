# IP代理管理系统

这是一个基于Flask和Vue.js的IP代理管理系统，提供动态和静态IP代理的管理功能。

## 功能特性

- 用户认证和授权
- 动态IP代理管理
- 静态IP代理管理
- 订单管理
- 流量统计
- 白名单管理
- 实时监控

## 技术栈

### 前端

- Vue 3
- Vue Router
- Pinia
- Element Plus
- ECharts
- Axios

### 后端

- Flask
- SQLAlchemy
- PostgreSQL
- JWT认证
- RESTful API

## 安装和运行

### 前端

```bash
cd frontend
npm install
npm run serve
```

### 后端

1. 创建虚拟环境：

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows
```

2. 安装依赖：

```bash
pip install -r requirements.txt
```

3. 设置环境变量：

```bash
cp .env.example .env
# 编辑.env文件，设置必要的环境变量
```

4. 初始化数据库：

```bash
flask db upgrade
```

5. 运行开发服务器：

```bash
flask run
```

## API文档

### 认证API

- POST /api/auth/login - 用户登录
- POST /api/auth/register - 用户注册
- POST /api/auth/logout - 用户登出
- GET /api/auth/me - 获取当前用户信息

### 资源API

- GET /api/resources/dynamic - 获取动态资源列表
- POST /api/resources/dynamic - 创建动态资源
- GET /api/resources/static - 获取静态资源列表
- POST /api/resources/static - 创建静态资源
- GET /api/resources/whitelist - 获取白名单列表
- POST /api/resources/whitelist - 添加白名单
- DELETE /api/resources/whitelist/:id - 删除白名单

### 订单API

- GET /api/orders - 获取订单列表
- POST /api/orders/renew - 续费资源
- POST /api/orders/release - 释放资源

### 统计API

- GET /api/statistics/overview - 获取概览数据
- GET /api/statistics/resource_trend - 获取资源趋势
- GET /api/statistics/expense_trend - 获取消费趋势
- GET /api/statistics/traffic_stats - 获取流量统计

## 贡献

欢迎提交问题和改进建议！

## 许可证

MIT
