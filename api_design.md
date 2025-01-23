# IP管理后台系统 API 接口文档

## 基础说明

### 接口规范
- 基础路径: `/api/open/app`
- 请求方式: REST
- 数据格式: JSON
- 认证方式: Bearer Token

### 通用响应格式
```json
{
  "code": 0,       // 状态码，0表示成功
  "message": "",   // 响应消息
  "data": {}       // 响应数据
}
```

## 认证相关接口

### 1. 用户登录
```
POST /auth/login
```
请求参数:
```json
{
  "username": "string",
  "password": "string"
}
```
响应数据:
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "role": "enum(admin|agent|user)",
    "status": "enum(active|disabled)"
  }
}
```

## 代理商管理接口

### 1. 创建代理商
```
POST /agent/create
```
请求参数:
```json
{
  "username": "string",
  "password": "string",
  "parentAgentId": "number?",
  "initialBalance": "number"
}
```

### 2. 代理商充值
```
POST /agent/{id}/recharge
```
请求参数:
```json
{
  "amount": "number",
  "remark": "string?"
}
```

### 3. 获取代理商列表
```
GET /agent/list
```
查询参数:
- page: 页码
- pageSize: 每页数量
- status: 状态筛选
- username: 用户名搜索

## 用户管理接口

### 1. 创建用户
```
POST /users
```
请求参数:
```json
{
  "username": "string",
  "password": "string",
  "agentId": "number",
  "remark": "string?"
}
```

### 2. 获取用户列表
```
GET /users
```
查询参数:
- page: 页码
- pageSize: 每页数量
- status: 状态筛选
- agentId: 代理商ID
- username: 用户名搜索

## 订单管理接口

### 1. 创建动态代理订单
```
POST /orders/dynamic
```
请求参数:
```json
{
  "userId": "number",
  "resourceId": "number",
  "traffic": "number",
  "remark": "string?"
}
```

### 2. 创建静态代理订单
```
POST /orders/static
```
请求参数:
```json
{
  "userId": "number",
  "ipId": "number",
  "duration": "number",
  "unit": "enum(day|week|month|year)"
}
```

### 3. 获取订单列表
```
GET /orders/{type}
```
type: dynamic | static | agent
查询参数:
- page: 页码
- pageSize: 每页数量
- status: 状态筛选
- userId: 用户ID
- agentId: 代理商ID
- orderNo: 订单号搜索
- dateRange: 日期范围

## 资源管理接口

### 1. 获取动态资源列表
```
GET /resources/dynamic
```
查询参数:
- page: 页码
- pageSize: 每页数量
- status: 状态筛选

### 2. 获取静态IP资源列表
```
GET /resources/static-ip
```
查询参数:
- page: 页码
- pageSize: 每页数量
- status: 状态筛选
- location: 位置筛选
- type: 资源类型
- ip: IP地址搜索

### 3. 资源使用统计
```
GET /resources/usage-stats
```
查询参数:
- userId: 用户ID
- resourceType: dynamic|static
- dateRange: 统计日期范围

## 回调接口

### 1. 订单状态回调
```
GET /callback/order
```
查询参数:
- type: order
- no: 订单号
- op: 1(创建)|2(续费)|3(释放)

### 2. 实例状态回调
```
GET /callback/instance
```
查询参数:
- type: instance
- no: 实例编号
- op: 状态码

### 3. 产品状态回调
```
GET /callback/product
```
查询参数:
- type: product
- no: 产品编号
- op: 状态码

## 系统设置接口

### 1. 修改密码
```
PUT /settings/password
```
请求参数:
```json
{
  "oldPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

### 2. 系统参数配置
```
PUT /settings/params
```
请求参数:
```json
{
  "paramKey": "string",
  "paramValue": "string"
}
```

## 错误码说明

- 0: 成功
- 1001: 参数错误
- 1002: 认证失败
- 1003: 权限不足
- 2001: 余额不足
- 2002: 资源不可用
- 2003: 订单状态异常
- 3001: 系统错误

## 注意事项

1. 所有接口都需要进行认证（除了登录接口）
2. 接口访问需要根据用户角色进行权限控制
3. 涉及金额的接口需要使用事务处理
4. 敏感数据传输需要加密
5. 接口调用需要做频率限制
6. 重要操作需要记录日志 