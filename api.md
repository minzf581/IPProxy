# IPProxy API 文档

## IPIPV API 集成

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

### 已测试的API端点

1. 区域管理
   - `api/open/app/area/v2`: 获取区域列表
   - `api/open/app/city/list/v2`: 获取城市列表

2. 用户管理
   - `api/open/app/user/v2`: 创建用户
   - `api/open/app/user/create/v2`: 创建子用户

3. 代理信息
   - `api/open/app/proxy/info/v2`: 获取代理信息
   - `api/open/app/product/query/v2`: 查询产品信息

### 测试进展
- [x] 区域列表获取
- [x] 城市列表获取
- [x] 用户创建
- [x] 代理信息查询
- [x] IP段列表查询

## 后端 API

### 基础配置
- 基础URL: `http://localhost:8000/api`
- API版本: `v2`
- 请求超时: 30000ms
- 内容类型: `application/json`

### API调用规范
1. URL路径格式：
   - 基础URL: `http://localhost:8000/api`
   - 业务路径: `open/app/{module}/{action}/v2`
   - 完整示例: `http://localhost:8000/api/open/app/product/query/v2`

2. 认证方式：
   - 请求头携带Bearer Token
   ```
   Authorization: Bearer <token>
   ```

### 响应格式
所有API响应都遵循以下格式：
```json
{
    "code": 200/400/401/500,
    "message": "success/error message",
    "data": {}
}
```

## 路由对应关系

### 1. 认证相关 (auth.py)
前端路由：
- `/login`：登录页面
- `/register`：注册页面

后端路由：
- `POST /api/auth/login`：用户登录
- `POST /api/auth/register`：用户注册

### 2. 用户相关 (user.py)
前端路由：
- `/user/profile`：用户信息页面
- `/user/settings`：用户设置页面

后端路由：
- `GET /api/user/profile`：获取用户信息
- `PUT /api/user/profile`：更新用户信息
- `POST /api/user/{user_id}/change-password`：修改密码

### 3. 代理商相关 (agent.py)
前端路由：
- `/agent/dashboard`：代理商仪表盘
- `/agent/list`：代理商列表管理
- `/agent/detail`：代理商详情

后端路由：
- `GET /api/open/app/agent/list`：获取代理商列表
- `GET /api/open/app/agent/{agent_id}`：获取代理商详情
- `GET /api/open/app/agent/{agent_id}/statistics`：获取代理商统计信息
- `POST /api/open/app/proxy/user/v2`：创建代理商
- `PUT /api/open/app/agent/{agent_id}`：更新代理商信息
- `PUT /api/open/app/agent/{agent_id}/status`：更新代理商状态

请求参数说明：
1. 获取代理商列表：
   - page: 页码，默认1
   - pageSize: 每页数量，默认100
   - username: 可选，按用户名筛选
   - status: 可选，按状态筛选

2. 创建代理商：
   ```json
   {
       "username": "string",
       "password": "string",
       "email": "string",
       "remark": "string",
       "status": "active",
       "balance": 1000.0
   }
   ```

3. 更新代理商：
   ```json
   {
       "status": "string",
       "remark": "string",
       "balance": 0.0
   }
   ```

响应格式：
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "total": 0,
        "list": [],
        "page": 1,
        "pageSize": 100
    }
}
```

### 4. 仪表盘相关 (dashboard.py)
前端路由：
- `/dashboard`：系统仪表盘

后端路由：
- `GET /api/dashboard/stats`：获取统计数据
- `GET /api/dashboard/revenue`：获取收入数据
- `GET /api/dashboard/users`：获取用户统计

### 5. 订单相关 (order.py)
前端路由：
- `/orders`：订单列表页面
- `/order/:id`：订单详情页面

后端路由：
- `GET /api/order/list`：获取订单列表
- `GET /api/order/{order_id}`：获取订单详情
- `POST /api/order/create`：创建订单

### 6. 交易相关 (transaction.py)
前端路由：
- `/transactions`：交易记录页面

后端路由：
- `GET /api/transaction/list`：获取交易记录
- `POST /api/transaction/create`：创建交易记录

### 7. 设置相关 (settings.py)
前端路由：
- `/settings`：系统设置页面

后端路由：
- `GET /api/settings`：获取系统设置
- `PUT /api/settings`：更新系统设置

### 8. 区域和IP管理 (location.py)

前端路由：
- `/regions`：区域管理页面
- `/ip-ranges`：IP段管理页面

后端路由：
- 前缀：`/api/open/app`
- 区域管理：
  - `POST /area/v2`：获取区域列表，返回预定义的6个区域
  - `POST /city/list/v2`：获取指定国家的城市列表
  - `POST /product/query/v2`：获取IP段列表

请求参数说明：
1. 区域列表：无需参数，返回预定义的6个区域
   ```json
   {
       "code": 200,
       "msg": "success",
       "data": [
           {"code": "EU", "name": "欧洲"},
           {"code": "AS", "name": "亚洲"},
           {"code": "NA", "name": "北美"},
           {"code": "SA", "name": "南美"},
           {"code": "AF", "name": "非洲"},
           {"code": "OC", "name": "大洋洲"}
       ]
   }
   ```

2. 城市列表：
   - 参数：
     ```json
     {
         "countryCode": "string"  // 国家代码
     }
     ```
   - 响应：
     ```json
     {
         "code": 200,
         "msg": "success",
         "data": [
             {
                 "code": "string",
                 "name": "string",
                 "cname": "string"
             }
         ]
     }
     ```

3. IP段列表：
   - 参数：
     ```json
     {
         "proxyType": [103],  // 静态国外家庭
         "countryCode": "string",  // 国家代码
         "cityCode": "string",     // 城市代码
         "unit": "string",         // 时长单位
         "duration": "string",     // 时长
         "supplierCode": "string", // 供应商代码
         "ispType": "string"       // isp类型
     }
     ```
   - 响应：
     ```json
     {
         "code": 200,
         "msg": "success",
         "data": {
             "ranges": [
                 {
                     "ipStart": "string",
                     "ipEnd": "string",
                     "ipCount": 0,
                     "stock": 0,
                     "staticType": "string"
                 }
             ]
         }
     }
     ```

注意事项：
1. 所有API都需要认证，使用 `get_current_user` 依赖
2. 错误响应统一使用 HTTP 状态码和详细的错误信息
3. IP段查询支持按国家、城市和静态类型筛选
4. 所有响应数据都包含状态码和消息

### 9. IPIPV API相关 (api.py)
前端路由：
- 无独立页面，后端服务间调用

后端路由：
- 前缀：`/api/ipipv/`
- 区域管理：
  - `GET /api/ipipv/regions/sync`：同步区域数据
  - `POST /api/ipipv/open/app/area/v2`：获取区域列表
- 国家管理：
  - `GET /api/ipipv/regions/{region_code}/countries/sync`：同步指定区域的国家数据
  - `GET /api/ipipv/regions/{region_code}/countries`：获取区域下的国家列表
- 城市管理：
  - `GET /api/ipipv/countries/{country_code}/cities/sync`：同步指定国家的城市数据
  - `GET /api/ipipv/countries/{country_code}/cities`：获取国家下的城市列表

请求参数说明：
1. 区域代码 (region_code)：
   - EU：欧洲
   - AS：亚洲
   - NA：北美
   - SA：南美
   - AF：非洲
   - OC：大洋洲

2. 国家代码 (country_code)：
   - 遵循ISO 3166-1标准的两字母国家代码
   - 例如：CN（中国）、US（美国）、JP（日本）等

3. 城市代码：
   - 使用城市的英文名称或代码
   - 例如：Shanghai、Beijing、Tokyo等

响应数据格式：
```json
{
    "code": 0,
    "msg": "success",
    "data": [
        {
            "code": "string",
            "name": "string",
            "region_code": "string"  // 仅在国家列表中返回
        }
    ]
}
```

特别说明：
1. 所有同步接口都需要认证
2. 同步操作会先检查本地数据库，如果数据不存在则从IPIPV服务获取
3. 支持数据缓存和定时更新机制
4. 所有接口都有完整的错误处理和日志记录

### 10. 实例相关 (instance.py)
前端路由：
- `/instances`：实例管理页面

后端路由：
- `GET /api/instance/list`：获取实例列表
- `POST /api/instance/sync`：同步实例信息

## 特别说明

1. 所有后端API路由都有统一的错误处理和认证中间件
2. 在 `main.py` 中统一注册路由
3. 除了 `location.router` 外，其他路由都添加了 `/api` 前缀
4. `location.py` 的路由前缀是 `/api/open/app`
5. `api.py` 的路由前缀是 `/api/ipipv`
6. 其他路由都是 `/api/[module-name]` 的形式

## 请求处理流程

1. 请求预处理：
   - 生成请求ID (MD5加密时间戳)
   - 准备基础参数 (version, encrypt, appKey等)
   - 添加认证头 (如果有token)

2. 参数处理：
   - 业务参数JSON序列化
   - AES加密业务参数
   - 生成签名

3. URL处理：
   - 基础URL: `http://localhost:8000/api`
   - 移除URL开头的斜杠（如果存在）
   - 拼接完整URL

4. 响应处理：
   - 验证响应状态码
   - 解析响应数据
   - 处理错误情况

5. 错误处理：
   - HTTP错误 (404, 500等)
   - 业务错误 (code !== 0)
   - 网络错误
   - 超时处理

## 调用示例

### 产品查询API
```typescript
// 接口说明：查询指定地区和类型的代理产品信息
// 请求URL: http://localhost:8000/api/open/app/product/query/v2
// 请求方法: POST

// 完整请求示例:
const requestConfig = {
  method: 'post',
  url: 'http://localhost:8000/api/open/app/product/query/v2',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>' // 如果需要认证
  },
  data: {
    version: "v2",
    encrypt: "AES",
    appKey: "AK20241120145620",
    reqId: "md5生成的请求ID",
    timestamp: "1234567890",
    params: "AES加密后的业务参数", // 下面参数的加密结果
    sign: "md5签名"
  }
}

// 业务参数(加密前):
{
  "proxyType": [103],  // 静态国外家庭
  "countryCode": "JP", // 国家代码
  "cityCode": "TYO",   // 城市代码
  "unit": 3,           // 可选，时长单位：1=天 2=周 3=月
  "duration": 1,       // 可选，时长
  "supplierCode": "",  // 可选，供应商代码
  "ispType": 1        // 可选，ISP类型：1=单ISP 2=双ISP
}

// 成功响应示例:
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "productNo": "jp_static_103",     // 产品编号
      "productName": "日本静态IP",      // 产品名称
      "inventory": 100,                 // 库存数量
      "price": 100.00,                 // 价格
      "cidrBlocks": [                  // IP网段信息
        {
          "startIp": "1.1.1.1",        // 起始IP
          "endIp": "1.1.1.255",        // 结束IP
          "count": 255                  // IP数量
        }
      ],
      "unit": 3,                       // 时长单位
      "duration": 1,                   // 时长
      "ispType": 1,                    // ISP类型
      "status": 1                      // 状态：1=正常 0=下架
    }
  ]
}

// 错误响应示例:
{
  "code": 404,
  "msg": "Product not found",
  "data": null
}

// 请求参数说明:
1. proxyType: 代理类型
   - 101 = 静态云平台
   - 102 = 静态国内家庭
   - 103 = 静态国外家庭
   - 104 = 动态国外
   - 105 = 动态国内

2. countryCode: 国家代码
   - 使用ISO 3166-1标准的两字母代码
   - JP = 日本
   - US = 美国
   - GB = 英国
   等

3. cityCode: 城市代码
   - TYO = 东京
   - OSA = 大阪
   - NYC = 纽约
   等

4. unit: 时长单位
   - 1 = 天
   - 2 = 周(7天)
   - 3 = 月(自然月)
   - 4 = 年(365/366天)
   - 10 = 无限制

5. ispType: ISP类型
   - 1 = 单ISP
   - 2 = 双ISP

// 错误处理:
1. 404: 产品不存在
2. 400: 参数错误
3. 401: 未授权
4. 500: 服务器错误

// 注意事项:
1. 所有请求必须包含完整的认证信息
2. 业务参数必须经过AES加密
3. 时间戳使用秒级时间戳
4. 签名算法必须严格按照规范生成
```

server.js：ipipv api 参数修改
ippr

## 路由配置

为了确保前后端路由的一致性，我们采用了共享路由配置的方案。主要包含以下几个部分：

### 1. 前端路由配置

位置：`src/shared/routes.ts`

使用 TypeScript 定义的路由配置，包含了所有 API 端点的定义：

```typescript
export const API_ROUTES = {
  AREA: {
    /** 获取区域列表 */
    LIST: 'open/app/area/v2',
    /** 获取区域库存 */
    STOCK: 'open/app/area/stock/v2'
  },
  COUNTRY: {
    /** 获取国家列表 */
    LIST: 'open/app/country/list/v2'
  },
  CITY: {
    /** 获取城市列表 */
    LIST: 'open/app/city/list/v2'
  },
  PRODUCT: {
    /** 查询产品列表 */
    QUERY: 'open/app/product/query/v2',
    /** 查询产品库存 */
    STOCK: 'open/app/product/stock/v2'
  },
  AUTH: {
    /** 登录 */
    LOGIN: 'auth/login',
    /** 登出 */
    LOGOUT: 'auth/logout'
  },
  USER: {
    /** 获取用户信息 */
    INFO: 'user/info',
    /** 更新用户信息 */
    UPDATE: 'user/update'
  },
  PROXY: {
    /** 获取代理信息 */
    INFO: 'proxy/info',
    /** 获取代理余额 */
    BALANCE: 'proxy/balance',
    /** 获取流量使用记录 */
    FLOW_USE_LOG: 'proxy/flow/use/log'
  }
} as const;
```

### 2. 后端路由配置

位置：`backend/app/core/routes.py`

使用 Python 字典定义的路由配置，与前端保持一致：

```python
API_ROUTES: Dict[str, Dict[str, str]] = {
    "AREA": {
        "LIST": "open/app/area/v2",
        "STOCK": "open/app/area/stock/v2"
    },
    "COUNTRY": {
        "LIST": "open/app/country/list/v2"
    },
    "CITY": {
        "LIST": "open/app/city/list/v2"
    },
    "PRODUCT": {
        "QUERY": "open/app/product/query/v2",
        "STOCK": "open/app/product/stock/v2"
    },
    "AUTH": {
        "LOGIN": "auth/login",
        "LOGOUT": "auth/logout"
    },
    "USER": {
        "INFO": "user/info",
        "UPDATE": "user/update"
    },
    "PROXY": {
        "INFO": "proxy/info",
        "BALANCE": "proxy/balance",
        "FLOW_USE_LOG": "proxy/flow/use/log"
    }
}
```

同时提供了两个辅助函数：

```python
def get_route(module: str, action: str) -> str:
    """获取指定模块和动作的路由"""
    return API_ROUTES[module][action]

def get_full_route(module: str, action: str) -> str:
    """获取完整的路由路径（包含 /api 前缀）"""
    return f"/api/{get_route(module, action)}"
```

### 3. 使用方式

#### 前端使用示例

```typescript
// 在 API 调用中使用
const response = await this.request<ApiResponseData<ApiArea[]>>(
  API_ROUTES.AREA.LIST, 
  requestParams
);
```

#### 后端使用示例

```python
@router.post("/" + API_ROUTES["AREA"]["LIST"])
async def get_areas_v2(params: Dict[str, Any] = Body(...)):
    """获取区域列表"""
    # ... 处理逻辑 ...

# 或者使用辅助函数
@router.post(get_full_route("AREA", "LIST"))
async def get_areas_v2(params: Dict[str, Any] = Body(...)):
    """获取区域列表"""
    # ... 处理逻辑 ...
```

### 4. 优点

1. **路由定义集中管理**：避免前后端不一致
2. **类型安全**：TypeScript 提供类型检查，减少拼写错误
3. **易于维护和更新**：修改一处即可同步更新
4. **清晰的文档**：路由定义即文档
5. **IDE 支持**：支持自动完成功能

### 5. 维护方式

当需要添加新的路由或修改现有路由时：

1. 在 `src/shared/routes.ts` 中添加或修改路由定义
2. 更新 `backend/app/core/routes.py` 中的路由配置
3. 前后端代码中使用 `API_ROUTES` 或 `get_route()` 来引用路由

这样可以确保前后端的路由始终保持同步。

## 新架构设计

### 系统架构

1. 前端层
- 只与后端 API 通信
- 通过定义好的路由访问后端服务
- 不直接与 IPIPV API 通信

2. 后端层
- 提供 RESTful API 接口给前端
- 管理数据库的读写操作
- 封装 IPIPV API 的调用
- 实现数据同步逻辑

3. 数据库层
- 存储区域、国家、城市等基础数据
- 记录数据同步时间
- 缓存 IPIPV API 的响应数据

4. IPIPV API 层
- 作为外部服务提供数据源
- 通过后端服务异步调用
- 数据定期同步到数据库

### 数据流向
```
前端 <-> 后端 API <-> 数据库
                  ↑
                  |
              IPIPV API
```

### 主要功能模块

1. 数据同步模块
```typescript
class DataSyncService {
  // 同步区域列表
  async syncAreas(): Promise<void>;
  
  // 同步指定区域的国家列表
  async syncCountries(regionCode: string): Promise<void>;
  
  // 同步指定国家的城市列表
  async syncCities(countryCode: string): Promise<void>;
  
  // 同步IP范围数据
  async syncIpRanges(params: IpRangeParams): Promise<void>;
}
```

2. 数据访问模块
```typescript
class ProxyService {
  // 获取区域列表
  async getAreaList(): Promise<Area[]>;
  
  // 获取国家列表
  async getCountryList(regionCode: string): Promise<Country[]>;
  
  // 获取城市列表
  async getCityList(countryCode: string): Promise<City[]>;
  
  // 获取IP范围
  async getIpRanges(params: IpRangeParams): Promise<IpRange[]>;
}
```

3. 数据模型
```typescript
interface Area {
  code: string;
  name: string;
  lastSync?: Date;
}

interface Country {
  code: string;
  name: string;
  regionCode: string;
  lastSync?: Date;
}

interface City {
  code: string;
  name: string;
  countryCode: string;
  lastSync?: Date;
}

interface IpRange {
  ipStart: string;
  ipEnd: string;
  ipCount: number;
  stock: number;
  type: string;
}
```

### API 路由

1. 区域管理
- `GET /api/areas`：获取所有区域
- `GET /api/areas/sync`：触发区域数据同步

2. 国家管理
- `GET /api/regions/:regionCode/countries`：获取区域下的国家
- `GET /api/regions/:regionCode/countries/sync`：触发国家数据同步

3. 城市管理
- `GET /api/countries/:countryCode/cities`：获取国家下的城市
- `GET /api/countries/:countryCode/cities/sync`：触发城市数据同步

4. IP范围管理
- `GET /api/ip-ranges`：获取IP范围列表
- `GET /api/ip-ranges/sync`：触发IP范围数据同步

### 优点

1. 解耦
- 前端只需要关心与后端的通信
- 后端负责数据的存储和同步
- IPIPV API 的复杂性被封装在后端

2. 性能
- 前端可以快速从后端获取数据
- 数据同步在后台异步进行
- 可以实现数据缓存

3. 可维护性
- API 密钥等敏感信息保存在后端
- 可以统一管理数据同步策略
- 便于监控和错误处理

4. 可扩展性
- 可以轻松添加新的数据源
- 可以实现数据转换和清洗
- 可以添加缓存层

## 前端代码结构

前端代码主要位于 `src` 目录下，关键文件和目录如下：

1. API 配置相关：
   - `src/config/api.ts`: API 基础配置，包含基础URL、版本、超时等
   - `src/services/`: API 服务实现目录
   - `src/utils/request.ts`: 封装的 axios 请求工具

2. API 配置示例 (src/config/api.ts):
```typescript
export const API_BASE_URL = 'http://localhost:8000/api';
export const API_VERSION = 'v2';

export const API_PATHS = {
  AUTH: {
    LOGIN: 'auth/login',
    LOGOUT: 'auth/logout'
  },
  APP: {
    INFO: 'open/app/info/v2',
    PRODUCT: 'open/app/product/v2'
  },
  PROXY: {
    INFO: 'settings/proxy/info',
    BALANCE: 'settings/proxy/balance'
  }
  // ... 其他路径配置
};

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json'
  },
  APP_KEY: 'AK20241120145620',
  APP_SECRET: 'bf3ffghlt0hpc4omnvc2583jt0fag6a4',
  version: 'v2',
  encrypt: 'AES'
};
```

3. 目录结构：
```
src/
├── api/          # API 类型定义
├── config/       # 配置文件
│   └── api.ts    # API 配置
├── services/     # API 服务实现
│   ├── auth.ts
│   ├── user.ts
│   └── ...
├── types/        # TypeScript 类型定义
├── utils/
│   └── request.ts # 请求工具
└── ...
```

## 获取产品信息 (GetOrder)

#### 请求路径
```
POST /api/open/app/product/query/v2
```

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| proxyType | []int | 是 | 代理类型数组，可选值：[101: 静态住宅代理, 102: 静态数据中心代理, 103: 静态手机代理] |
| productNo | string | 否 | 产品编号，如果指定则只返回该产品信息 |
| countryCode | string | 否 | 国家代码 |
| cityCode | string | 否 | 城市代码 |
| supplierCode | string | 否 | 供应商代码 |
| unit | int | 否 | 时长单位，详见字典 |
| ispType | int | 否 | ISP类型，4=数据中心 |
| duration | int | 否 | 相对于时长单位的最小购买时长 |

#### 请求示例

```json
{
    "version": "v2",
    "encrypt": "AES",
    "proxyType": [101],
    "productNo": "test_product_1"
}
```

#### 响应格式

响应数据为列表或字典格式，包含产品信息。