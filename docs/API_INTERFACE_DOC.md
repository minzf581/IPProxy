# IP代理管理系统 API 接口文档

## 目录
1. [认证相关](#认证相关)
2. [用户管理](#用户管理)
3. [订单管理](#订单管理)
4. [代理管理](#代理管理)
5. [系统设置](#系统设置)

## 认证相关

### 登录
- **接口**: `login`
- **参数**: 
  - username: string
  - password: string
- **返回**: 
  ```typescript
  {
    access_token: string
  }
  ```

### 获取当前用户信息
- **接口**: `getCurrentUser`
- **参数**: 无（使用 token）
- **返回**: 
  ```typescript
  {
    id: string;
    username: string;
    role: string;
    lastLoginTime?: string;
  }
  ```

## 用户管理

### 获取用户列表
- **接口**: `getUserList`
- **参数**:
  ```typescript
  {
    page: number;
    pageSize: number;
    searchAccount?: string;
    agentId?: string;
    status?: string;
  }
  ```
- **返回**:
  ```typescript
  {
    list: UserInfo[];
    total: number;
  }
  ```

### 获取代理商列表
- **接口**: `getAgentList`
- **参数**:
  ```typescript
  {
    page: number;
    pageSize: number;
    status?: string;
  }
  ```
- **返回**:
  ```typescript
  {
    list: AgentInfo[];
    total: number;
  }
  ```

### 更新用户状态
- **接口**: `updateUserStatus`
- **参数**:
  - userId: string
  - status: 'active' | 'disabled'
- **返回**: void

### 更新用户密码
- **接口**: `updateUserPassword`
- **参数**:
  - userId: string
  - newPassword: string
- **返回**: void

### 获取用户统计数据
- **接口**: `getUserStatistics`
- **参数**: userId: string
- **返回**:
  ```typescript
  {
    totalRecharge: number;
    totalConsumption: number;
    balance: number;
    monthlyRecharge: number;
    monthlyConsumption: number;
    lastMonthConsumption: number;
  }
  ```

## 订单管理

### 获取动态订单列表
- **接口**: `getUserDynamicOrders`
- **参数**:
  ```typescript
  {
    page: number;
    pageSize: number;
    startTime?: string;
    endTime?: string;
    status?: string;
  }
  ```
- **返回**:
  ```typescript
  {
    list: UserOrder[];
    total: number;
  }
  ```

### 获取静态订单列表
- **接口**: `getUserStaticOrders`
- **参数**: 同动态订单
- **返回**: 同动态订单

### 取消订单
- **接口**: `cancelOrder`
- **参数**: orderId: string
- **返回**: void

### 刷新动态代理
- **接口**: `refreshDynamicProxy`
- **参数**: orderId: string
- **返回**: void

## 代理管理

### 获取动态代理列表
- **接口**: `getDynamicProxies`
- **参数**:
  ```typescript
  {
    page: number;
    pageSize: number;
    ip?: string;
    status?: string;
    protocol?: string;
  }
  ```
- **返回**:
  ```typescript
  {
    list: DynamicProxy[];
    total: number;
  }
  ```

### 获取静态代理列表
- **接口**: `getStaticProxies`
- **参数**:
  ```typescript
  {
    page: number;
    pageSize: number;
    ip?: string;
    status?: string;
    protocol?: string;
    resourceType?: string;
  }
  ```
- **返回**:
  ```typescript
  {
    list: StaticProxy[];
    total: number;
  }
  ```

## 系统设置

### 更新管理员密码
- **接口**: `updateAdminPassword`
- **参数**:
  - oldPassword: string
  - newPassword: string
- **返回**: void

## 数据类型定义

### UserInfo
```typescript
interface UserInfo {
  id: string;
  account: string;
  agentName?: string;
  remark?: string;
  status: 'active' | 'disabled';
  createdAt: string;
}
```

### UserOrder
```typescript
interface UserOrder {
  id: string;
  orderNo: string;
  type: 'dynamic' | 'static';
  amount: number;
  status: OrderStatus;
  createdAt: string;
  expiredAt: string;
  protocol?: string;
  proxyHost?: string;
  proxyPort?: number;
  username?: string;
  password?: string;
}
```

### DynamicProxy
```typescript
interface DynamicProxy {
  id: string;
  ip: string;
  port: number;
  protocol: string;
  status: string;
  location: string;
  lastUsedAt: string;
  createdAt: string;
}
```

### StaticProxy
```typescript
interface StaticProxy {
  id: string;
  ip: string;
  subnet: string;
  protocol: string;
  status: string;
  location: string;
  resourceType: string;
  createdAt: string;
}
```

## 注意事项

1. 所有需要认证的接口都需要在请求头中携带 token：
   ```typescript
   headers: {
     'Authorization': `Bearer ${token}`
   }
   ```

2. 分页相关的接口都遵循相同的格式：
   - 请求参数包含 `page` 和 `pageSize`
   - 返回数据包含 `list` 和 `total`

3. 时间相关的字段都使用 ISO 8601 格式的字符串

4. 所有金额相关的字段都使用 number 类型，单位为元，精确到小数点后两位
