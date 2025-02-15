# IP代理管理系统 API 文档

## 目录
1. [基础说明](#基础说明)
2. [认证相关](#认证相关)
3. [用户管理](#用户管理)
4. [代理商管理](#代理商管理)
5. [订单管理](#订单管理)
6. [资源管理](#资源管理)
7. [系统设置](#系统设置)
8. [回调接口](#回调接口)
9. [IPIPV API集成](#ipipv-api集成)

## 基础说明

### 接口规范
- 基础路径: `/api`
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

### 错误码说明
- 0: 成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 422: 请求参数验证失败
- 500: 服务器内部错误

## 认证相关

### 1. 用户登录
- **接口**: `/api/auth/login`
- **方法**: POST
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "token": "string",
      "user": {
        "id": "number",
        "username": "string",
        "email": "string",
        "is_admin": "boolean",
        "is_agent": "boolean"
      }
    }
  }
  ```

### 2. 获取当前用户信息
- **接口**: `/api/auth/current-user`
- **方法**: GET
- **请求头**: 
  ```
  Authorization: Bearer <token>
  ```
- **响应**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "id": "number",
      "username": "string",
      "email": "string",
      "is_admin": "boolean",
      "is_agent": "boolean"
    }
  }
  ```

## 用户管理

### 1. 创建用户
- **接口**: `/api/users`
- **方法**: POST
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string",
    "agentId": "number",
    "remark": "string?"
  }
  ```

### 2. 获取用户列表
- **接口**: `/api/users`
- **方法**: GET
- **参数**:
  - page: 页码
  - pageSize: 每页数量
  - status: 状态筛选
  - agentId: 代理商ID
  - username: 用户名搜索
- **响应**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "list": [
        {
          "id": "number",
          "username": "string",
          "email": "string",
          "status": "string",
          "created_at": "string"
        }
      ],
      "total": "number"
    }
  }
  ```

## 代理商管理

### 1. 创建代理商
- **接口**: `/api/agents`
- **方法**: POST
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string",
    "parentAgentId": "number?",
    "initialBalance": "number"
  }
  ```

### 2. 代理商充值
- **接口**: `/api/agents/{id}/recharge`
- **方法**: POST
- **请求体**:
  ```json
  {
    "amount": "number",
    "remark": "string?"
  }
  ```

### 3. 获取代理商列表
- **接口**: `/api/agents`
- **方法**: GET
- **参数**:
  - page: 页码
  - pageSize: 每页数量
  - status: 状态筛选
  - username: 用户名搜索

### 4. 获取代理商统计信息
- **接口**: `/api/agents/{id}/statistics`
- **方法**: GET
- **响应**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "total_orders": "number",
      "total_amount": "number",
      "balance": "number"
    }
  }
  ```

## 订单管理

### 1. 创建动态代理订单
- **接口**: `/api/orders/dynamic`
- **方法**: POST
- **请求体**:
  ```json
  {
    "userId": "number",
    "resourceId": "number",
    "traffic": "number",
    "remark": "string?"
  }
  ```

### 2. 创建静态代理订单
- **接口**: `/api/orders/static`
- **方法**: POST
- **请求体**:
  ```json
  {
    "userId": "number",
    "ipId": "number",
    "duration": "number",
    "unit": "enum(day|week|month|year)"
  }
  ```

### 3. 获取订单列表
- **接口**: `/api/orders/{type}`
- **方法**: GET
- **参数**:
  - type: dynamic | static | agent
  - page: 页码
  - pageSize: 每页数量
  - status: 状态筛选
  - userId: 用户ID
  - agentId: 代理商ID
  - orderNo: 订单号搜索
  - dateRange: 日期范围

## 资源管理

### 1. 获取动态资源列表
- **接口**: `/api/resources/dynamic`
- **方法**: GET
- **参数**:
  - page: 页码
  - pageSize: 每页数量
  - status: 状态筛选

### 2. 获取静态IP资源列表
- **接口**: `/api/resources/static-ip`
- **方法**: GET
- **参数**:
  - page: 页码
  - pageSize: 每页数量
  - status: 状态筛选
  - location: 位置筛选
  - type: 资源类型
  - ip: IP地址搜索

### 3. 资源使用统计
- **接口**: `/api/resources/usage-stats`
- **方法**: GET
- **参数**:
  - userId: 用户ID
  - resourceType: dynamic|static
  - dateRange: 统计日期范围

## 系统设置

### 1. 修改密码
- **接口**: `/api/settings/password`
- **方法**: PUT
- **请求体**:
  ```json
  {
    "oldPassword": "string",
    "newPassword": "string",
    "confirmPassword": "string"
  }
  ```

### 2. 系统参数配置
- **接口**: `/api/settings/params`
- **方法**: PUT
- **请求体**:
  ```json
  {
    "paramKey": "string",
    "paramValue": "string"
  }
  ```

### 3. 批量更新价格
- **接口**: `/api/settings/prices/batch`
- **方法**: POST
- **请求体**:
  ```json
  {
    "prices": [
      {
        "product_id": "string",
        "type": "string",
        "proxy_type": "number",
        "price": "number",
        "min_agent_price": "number",
        "is_global": "boolean"
      }
    ]
  }
  ```

## 回调接口

### 1. 订单状态回调
- **接口**: `/api/callback/order`
- **方法**: GET
- **参数**:
  - type: order
  - no: 订单号
  - op: 1(创建)|2(续费)|3(释放)

### 2. 实例状态回调
- **接口**: `/api/callback/instance`
- **方法**: GET
- **参数**:
  - type: instance
  - no: 实例编号
  - op: 状态码

### 3. 产品状态回调
- **接口**: `/api/callback/product`
- **方法**: GET
- **参数**:
  - type: product
  - no: 产品编号
  - op: 状态码

## IPIPV API集成

### 基础配置
- 基础URL: `https://sandbox.ipipv.com`
- API版本: `v2`
- 加密方式: `AES`
- 认证信息:
  ```
  APP_KEY: AK20241120145620
  APP_SECRET: bf3ffghlt0hpc4omnvc2583jt0fag6a4
  ```

### 请求格式
所有请求都需要包含以下参数：
```json
{
  "version": "v2",
  "encrypt": "AES",
  "appKey": "AK20241120145620",
  "reqId": "md5生成的请求ID",
  "timestamp": "当前时间戳",
  "params": "AES加密的业务参数",
  "sign": "签名"
}
```

### 加密和签名规则
1. 参数加密：
   - 使用 AES-256-CBC 模式
   - 密钥：使用 APP_SECRET 的前32位
   - IV：使用 APP_SECRET 的前16位
   - 加密后使用 Base64 编码

2. 签名生成：
   - 拼接字符串：`appKey={appKey}&params={encrypted_params}&timestamp={timestamp}&key={app_secret}`
   - 对拼接字符串进行 MD5 加密并转大写

### 主要API端点

1. 区域管理
   - `api/open/app/area/v2`: 获取区域列表
   - `api/open/app/city/list/v2`: 获取城市列表

2. 用户管理
   - `api/open/app/user/v2`: 创建用户
   - `api/open/app/user/create/v2`: 创建子用户

3. 代理信息
   - `api/open/app/proxy/info/v2`: 获取代理信息
   - `api/open/app/product/query/v2`: 查询产品信息

4. 订单管理
   - `api/open/app/instance/open/v2`: 创建订单
   - `api/open/app/instance/renew/v2`: 续费订单
   - `api/open/app/instance/release/v2`: 释放订单

5. 资源管理
   - `api/open/app/proxy/draw/api/v2`: API提取代理
   - `api/open/app/proxy/draw/pwd/v2`: 账密提取代理
   - `api/open/app/proxy/return/v2`: 动态代理流量回收

## 注意事项

1. 所有需要认证的接口都需要在请求头中携带token：
   ```
   Authorization: Bearer <token>
   ```

2. 分页相关的接口统一使用以下参数：
   - page: 页码，从1开始
   - pageSize: 每页数量，默认10

3. 时间相关的字段使用以下格式：
   - 请求参数中的日期格式：YYYY-MM-DD
   - 响应中的日期时间格式：YYYY-MM-DD HH:mm:ss

4. 所有金额相关的字段都使用 number 类型，单位为元，精确到小数点后两位

5. 接口调用注意事项：
   - 所有接口都需要进行认证（除了登录接口）
   - 接口访问需要根据用户角色进行权限控制
   - 涉及金额的接口需要使用事务处理
   - 敏感数据传输需要加密
   - 接口调用需要做频率限制
   - 重要操作需要记录日志