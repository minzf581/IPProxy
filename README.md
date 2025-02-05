# IP代理管理系统

## 项目结构
```
project/
├── backend/           # 后端代码
│   ├── app/          # 应用主目录
│   │   ├── routers/  # 路由处理
│   │   ├── services/ # 业务服务
│   │   ├── models/   # 数据模型
│   │   └── utils/    # 工具函数
│   └── tests/        # 测试代码
└── src/              # 前端代码
    ├── pages/        # 页面组件
    ├── services/     # API服务
    ├── utils/        # 工具函数
    └── types/        # TypeScript类型定义
```

## 核心模块依赖关系

### 用户模块
- 后端主文件：`backend/app/routers/user.py`
- 核心依赖：
  - IPProxyService (`backend/app/services/ipproxy_service.py`)
  - 用户模型 (`backend/app/models/user.py`)
- 前端对应：
  - 服务层：`src/services/userService.ts`
  - 页面组件：`src/pages/user/index.tsx`
  - 类型定义：`src/types/user.ts`

### 代理模块
- 后端主文件：`backend/app/routers/proxy.py`
- 核心依赖：
  - IPProxyService (`backend/app/services/ipproxy_service.py`)
  - 代理模型 (`backend/app/models/proxy.py`)
- 前端对应：
  - 服务层：`src/services/proxyService.ts`
  - 页面组件：`src/pages/proxy/index.tsx`
  - 类型定义：`src/types/proxy.ts`

### 代理商模块
- 后端主文件：`backend/app/routers/agent.py`
- 核心依赖：
  - 代理商模型 (`backend/app/models/agent.py`)
  - 订单模型 (`backend/app/models/order.py`)
- 前端对应：
  - 服务层：`src/services/agentService.ts`
  - 页面组件：`src/pages/agent/index.tsx`

## API路由规范
- 所有API路由以 `/api` 开头
- 用户相关：`/api/user/*`
- 代理相关：`/api/proxy/*`
- 代理商相关：`/api/agent/*`

## 开发注意事项

### 修改路由时
1. 确保前后端路由一致
2. 更新相关的API文档
3. 同步修改前端服务层代码

### 修改数据结构时
1. 同步更新前后端的类型定义
2. 更新相关的数据库模型
3. 修改对应的测试用例

### 修改业务逻辑时
1. 检查相关模块的依赖关系
2. 确保事务的完整性
3. 更新相关的单元测试

## 环境配置
- 开发环境：`.env.development`
- 生产环境：`.env.production`
- 测试环境：`.env.test`

## 调试指南
1. 检查API路由配置
2. 验证数据库连接
3. 确认环境变量设置
4. 查看日志输出

## 常见问题
1. 404错误：检查路由配置是否正确
2. 500错误：检查服务器日志
3. 类型错误：确认前后端类型定义一致