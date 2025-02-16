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
  - UserService (`backend/app/services/user_service.py`)
  - 用户模型 (`backend/app/models/user.py`)
- 前端对应：
  - 服务层：`src/services/userService.ts`
  - 页面组件：`src/pages/user/index.tsx`
  - 类型定义：`src/types/user.ts`

### 代理模块
- 后端主文件：`backend/app/routers/proxy.py`
- 核心依赖：
  - ProxyService (`backend/app/services/proxy_service.py`)
  - 代理模型 (`backend/app/models/proxy.py`)
- 前端对应：
  - 服务层：`src/services/proxyService.ts`
  - 页面组件：`src/pages/proxy/index.tsx`
  - 类型定义：`src/types/proxy.ts`

### 代理商模块
- 后端主文件：`backend/app/routers/agent.py`
- 核心依赖：
  - AgentService (`backend/app/services/agent_service.py`)
  - 代理商模型 (`backend/app/models/agent.py`)
  - 订单模型 (`backend/app/models/order.py`)
- 前端对应：
  - 服务层：`src/services/agentService.ts`
  - 页面组件：`src/pages/agent/index.tsx`
  - 类型定义：`src/types/agent.ts`

### 仪表盘模块
- 后端主文件：`backend/app/routers/dashboard.py`
- 核心依赖：
  - DashboardService (`backend/app/services/dashboard_service.py`)
  - 统计模型 (`backend/app/models/statistics.py`)
- 前端对应：
  - 服务层：`src/services/dashboardService.ts`
  - 页面组件：`src/pages/dashboard.tsx`
  - 类型定义：`src/types/dashboard.ts`

## API路由规范
所有API路由配置统一在 `src/shared/routes.ts` 中管理，包括：
- `/api/open/*` - 开放接口
- `/api/auth/*` - 认证相关
- `/api/user/*` - 用户相关
- `/api/admin/*` - 管理接口
- `/api/proxy/*` - 代理相关
- `/api/agents/*` - 代理商相关

## 开发注意事项

### 修改路由时
1. 确保在 `src/shared/routes.ts` 中更新路由配置
2. 更新相关的API文档
3. 同步修改前端服务层代码

### 修改数据结构时
1. 同步更新前后端的类型定义
2. 更新相关的数据库模型
3. 使用 alembic 创建数据库迁移脚本

### 修改业务逻辑时
1. 检查相关模块的依赖关系
2. 确保事务的完整性
3. 更新相关的单元测试

## 环境配置
- 开发环境：`.env.development`
- 生产环境：`.env.production`
- 测试环境：`.env.test`

## 调试指南
1. 检查API路由配置是否正确
2. 验证数据库连接状态
3. 确认环境变量设置
4. 查看日志输出（`backend/logs/app.log`）

## 常见问题
1. 404错误：检查 `src/shared/routes.ts` 中的路由配置
2. 500错误：检查服务器日志
3. 类型错误：确认前后端类型定义一致

## 代理商额度模块设计

### 数据库设计

1. **代理商额度订单表 (agent_balance_orders)**
   - 记录代理商额度变更的订单信息
   - 包含订单号、代理商ID、调整金额、类型、状态等字段
   - 与现有用户表和订单表关联

2. **代理商消费记录表 (agent_transactions)**
   - 记录代理商的消费流水
   - 包含代理商ID、消费金额、关联订单信息等
   - 用于统计和分析代理商消费情况

### 功能模块

1. **额度管理**
   - 路径：`/api/agents/{agent_id}/balance`
   - 功能：调整代理商额度、查询额度订单
   - 权限：仅管理员可调整额度

2. **仪表盘扩展**
   - 路径：`/api/agents/{agent_id}/dashboard`
   - 显示：累计充值、本月充值、账户余额等
   - 支持管理员切换查看不同代理商

### 实现方案

1. **后端实现**
   - 复用现有的代理商模块代码
   - 扩展 `AgentService` 添加额度相关方法
   - 使用事务确保数据一致性

2. **前端实现**
   - 扩展现有代理商管理页面
   - 复用现有的表格和表单组件
   - 添加额度管理和统计展示

### 注意事项

1. **数据安全**
   - 所有金额操作需要日志记录
   - 关键操作需要二次确认
   - 防止金额计算精度丢失

2. **性能优化**
   - 仪表盘数据缓存
   - 分页查询优化
   - 索引优化

3. **代码规范**
   - 遵循现有项目结构
   - 保持代码风格一致
   - 完善注释和文档

### 模块依赖

1. **后端依赖**
   - 用户模块：`backend/app/models/user.py`
   - 订单模块：`backend/app/models/order.py`
   - 代理商模块：`backend/app/routers/agent.py`

2. **前端依赖**
   - 代理商服务：`src/services/agentService.ts`
   - 代理商页面：`src/pages/agent/index.tsx`
   - 仪表盘页面：`src/pages/dashboard/index.tsx`

### 实施步骤

1. **数据库变更**
   - 创建新的数据库表
   - 添加必要的索引
   - 确保与现有表的关联关系

2. **后端开发**
   - 添加新的路由处理
   - 实现业务逻辑
   - 添加单元测试

3. **前端开发**
   - 扩展现有页面
   - 添加新的交互功能
   - 实现数据展示

4. **测试验证**
   - 功能测试
   - 性能测试
   - 安全测试