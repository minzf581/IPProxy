# IP代理管理系统设计文档

## 1. 项目结构

```
src/
├── components/        # 可复用组件
│   ├── Layout/       # 布局组件
│   ├── PrivateRoute/ # 路由权限控制组件
│   ├── User/         # 用户相关组件
│   ├── Order/        # 订单相关组件
│   ├── Resource/     # 资源相关组件
│   ├── Agent/        # 代理商相关组件
│   ├── Header/       # 头部组件
│   ├── Settings/     # 设置相关组件
│   └── Dashboard/    # 仪表盘组件
├── pages/            # 页面组件
│   ├── dashboard/    # 仪表盘页面
│   ├── account/      # 账户管理页面
│   │   ├── agent/   # 代理商管理
│   │   └── user/    # 用户管理
│   ├── order/       # 订单管理页面
│   │   ├── agent/   # 代理商订单
│   │   ├── dynamic/ # 动态订单
│   │   └── static/  # 静态订单
│   ├── ip/          # IP资源管理页面
│   │   └── static/  # 静态IP管理
│   ├── settings/    # 系统设置页面
│   └── login/       # 登录页面
├── contexts/         # React Context
│   └── AuthContext  # 认证上下文
├── hooks/           # 自定义Hooks
│   └── useAuth     # 认证相关Hook
├── services/        # API服务
├── utils/          # 工具函数
├── types/          # TypeScript类型定义
├── router/         # 路由配置
├── config/         # 全局配置
└── styles/         # 全局样式

```

## 2. 核心功能模块

### 2.1 认证系统
- 文件位置：`src/contexts/AuthContext.tsx`, `src/hooks/useAuth.ts`
- 主要功能：
  - 用户登录/登出管理
  - 权限控制
  - 用户状态管理

### 2.2 布局系统
- 文件位置：`src/components/Layout/index.tsx`
- 主要功能：
  - 响应式侧边栏
  - 导航菜单
  - 用户信息展示
  - 路由集成

### 2.3 路由系统
- 文件位置：`src/router/router.tsx`
- 主要功能：
  - 路由配置
  - 权限路由
  - 路由守卫

### 2.4 代理商管理
- 文件位置：`src/pages/account/agent/index.tsx`
- 主要功能：
  - 代理商列表
  - 代理商添加/编辑
  - 代理商状态管理

### 2.5 用户管理
- 文件位置：`src/pages/account/user/index.tsx`
- 主要功能：
  - 用户列表
  - 用户添加/编辑
  - 用户状态管理

### 2.6 订单管理
- 文件位置：`src/pages/order/*`
- 主要功能：
  - 代理商订单管理
  - 动态订单管理
  - 静态订单管理
  - 订单状态追踪

### 2.7 IP资源管理
- 文件位置：`src/pages/ip/static/index.tsx`
- 主要功能：
  - 静态IP资源管理
  - IP状态监控
  - IP分配管理

## 3. 技术栈

- 前端框架：React 18
- UI组件库：Ant Design
- 状态管理：React Context
- 路由管理：React Router 6
- 样式解决方案：Less + CSS Modules
- 类型系统：TypeScript
- 开发工具：Vite
- HTTP客户端：Axios

## 4. 数据流

```
用户操作 -> 组件事件处理 -> Hooks/Context -> API调用 -> 状态更新 -> UI更新
```

## 5. 权限控制

### 5.1 角色类型
- 超级管理员
- 代理商
- 普通用户

### 5.2 权限实现
- 路由级别：PrivateRoute组件
- 菜单级别：基于角色的菜单过滤
- 操作级别：基于角色的按钮/功能控制

## 6. 开发规范

### 6.1 目录规范
- 组件文件使用大驼峰命名
- 工具函数使用小驼峰命名
- 样式文件使用module.less后缀

### 6.2 代码规范
- 使用ESLint进行代码检查
- 使用Prettier进行代码格式化
- 使用TypeScript强类型约束

### 6.3 组件规范
- 函数组件 + Hooks
- Props类型声明
- 错误边界处理
- 适当的组件拆分

## 7. 部署架构

### 7.1 开发环境
- Vite开发服务器
- 接口代理配置
- 热更新支持

### 7.2 生产环境
- 静态资源部署
- 接口代理配置
- 错误监控
- 性能监控 