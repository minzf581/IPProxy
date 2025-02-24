# IP代理管理系统 API 文档

## 1. 认证接口

### 1.1 用户登录
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

### 1.2 获取当前用户信息
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

## 2. 代理商接口

### 2.1 获取代理商列表
- **接口**: `/api/open/app/agent/list`
- **方法**: GET
- **参数**:
  - page: 页码 (默认: 1)
  - pageSize: 每页数量 (默认: 10)
  - status: 状态筛选 (可选)
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
          "balance": "number",
          "status": "string",
          "created_at": "string"
        }
      ],
      "total": "number"
    }
  }
  ```

### 2.2 获取代理商详情
- **接口**: `/api/open/app/agent/{agent_id}`
- **方法**: GET
- **响应**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "id": "number",
      "username": "string",
      "email": "string",
      "balance": "number",
      "status": "string",
      "created_at": "string"
    }
  }
  ```

### 2.3 获取代理商统计信息
- **接口**: `/api/open/app/agent/{agent_id}/statistics`
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

### 代理商相关接口

- **接口**: `/api/open/app/agent/transactions`
- **方法**: GET
- **描述**: 获取代理商额度订单记录
- **参数**:
  - page: 页码（必填，默认1）
  - page_size: 每页数量（必填，默认10）
  - order_no: 订单号（可选）
  - start_date: 开始日期（可选，格式：YYYY-MM-DD）
  - end_date: 结束日期（可选，格式：YYYY-MM-DD）
- **返回**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "total": 100,
      "items": [
        {
          "id": 1,
          "order_no": "TRX202403201234567890",
          "amount": 100.00,
          "type": "recharge",
          "status": "success",
          "created_at": "2024-03-20 12:34:56",
          "operator_name": "admin"
        }
      ],
      "page": 1,
      "page_size": 10
    }
  }
  ```

## 3. 订单接口

### 3.1 获取代理商订单列表
- **接口**: `/api/open/app/agent-orders/v2`
- **方法**: GET
- **参数**:
  - agentId: 代理商ID
  - page: 页码 (默认: 1)
  - pageSize: 每页数量 (默认: 10)
  - status: 状态筛选 (可选)
  - startDate: 开始日期 (可选)
  - endDate: 结束日期 (可选)
- **响应**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {
      "list": [
        {
          "id": "string",
          "order_no": "string",
          "amount": "number",
          "status": "string",
          "type": "string",
          "created_at": "string"
        }
      ],
      "total": "number"
    }
  }
  ```

## 4. 错误码说明

- 0: 成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 422: 请求参数验证失败
- 500: 服务器内部错误

## 5. 通用说明

### 5.1 请求头
所有需要认证的接口都需要在请求头中携带token：
```
Authorization: Bearer <token>
```

### 5.2 响应格式
所有接口的响应格式统一为：
```json
{
  "code": "number",
  "message": "string",
  "data": "object|array|null"
}
```

### 5.3 分页参数
涉及分页的接口统一使用以下参数：
- page: 页码，从1开始
- pageSize: 每页数量，默认10

### 5.4 日期格式
- 请求参数中的日期格式：YYYY-MM-DD
- 响应中的日期时间格式：YYYY-MM-DD HH:mm:ss 