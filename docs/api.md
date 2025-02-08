# IP代理管理系统 API 文档

## 基础配置

### 请求处理

所有 API 请求通过统一的 request 工具处理:

```typescript
// src/utils/request.ts

// 创建 axios 实例的工厂函数
const createAxiosInstance = (config: CreateAxiosDefaults = {}): AxiosInstance => {
  const instance = axios.create({
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config
  });

  // 请求拦截器处理
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 处理 URL
      if (config.url && !config.url.startsWith('/')) {
        config.url = `/${config.url}`;
      }
      
      // 添加 token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 响应拦截器处理
  instance.interceptors.response.use(
    (response) => {
      const { data } = response;
      if (data.code !== 0 && data.code !== 200) {
        // 处理特定错误码
        if (data.code === 401) {
          // 处理未授权
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(new Error('登录已过期'));
        }
        return Promise.reject(new Error(data.msg || '请求失败'));
      }
      return response;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

// 创建实例
const api = createAxiosInstance({ baseURL: '/api' });
const client = createAxiosInstance();

// 创建请求方法
const createRequestMethods = (instance: AxiosInstance) => ({
  get: <T = any>(url: string, config?: any) => instance.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) => instance.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => instance.put<T>(url, data, config),
  delete: <T = any>(url: string, config?: any) => instance.delete<T>(url, config),
  patch: <T = any>(url: string, data?: any, config?: any) => instance.patch<T>(url, data, config)
});

// 导出请求方法
const request = createRequestMethods(client);
const apiRequest = createRequestMethods(api);

export { api, client, apiRequest };
export default request;
```

### 路由配置

所有 API 路由在 `shared/routes.ts` 中统一管理:

```typescript
// src/shared/routes.ts

export const API_VERSION = 'v2';
export const API_PREFIX = {
  OPEN: 'open/app',
  AUTH: 'auth',
  USER: 'user',
  ADMIN: 'admin',
  PROXY: 'proxy'
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${API_PREFIX.AUTH}/login`,
    LOGOUT: `${API_PREFIX.AUTH}/logout`,
    REFRESH: `${API_PREFIX.AUTH}/refresh`,
    PROFILE: `${API_PREFIX.AUTH}/profile`
  },
  USER: {
    CREATE: `${API_PREFIX.OPEN}/user/create/v2`,
    LIST: `${API_PREFIX.USER}/list`,
    UPDATE: `${API_PREFIX.USER}/{id}`,
    DELETE: `${API_PREFIX.USER}/{id}`
  },
  // ... 其他路由配置
};
```

## 使用说明

### 1. API 请求

使用 `apiRequest` 发送带 `/api` 前缀的请求:

```typescript
// 服务层示例
import { apiRequest } from '@/utils/request';

export const login = async (username: string, password: string) => {
  const response = await apiRequest.post('/auth/login', { username, password });
  return response.data;
};
```

### 2. 普通请求

使用 `request` 发送不带前缀的请求:

```typescript
import request from '@/utils/request';

const response = await request.get('/external/api');
```

### 3. 路由使用

使用 `API_ROUTES` 常量获取路由:

```typescript
import { API_ROUTES } from '@/shared/routes';

const loginUrl = API_ROUTES.AUTH.LOGIN;
const createUserUrl = API_ROUTES.USER.CREATE;
```

## 最佳实践

1. 使用类型安全:
   - 为所有请求和响应定义 TypeScript 接口
   - 使用泛型指定响应类型

2. 错误处理:
   - 在拦截器中统一处理常见错误
   - 在服务层处理业务相关错误
   - 使用 message 组件显示错误信息

3. 调试:
   - 开发环境打印详细日志
   - 使用 debug 对象统一管理日志

4. 安全:
   - 自动添加 token
   - 处理 401 未授权
   - 安全存储敏感信息

5. 维护性:
   - 路由集中管理
   - 请求方法统一封装
   - 配置易于扩展

## 注意事项

1. 不要在组件中直接使用 axios,使用封装的 request 方法
2. 使用 API_ROUTES 常量而不是硬编码 URL
3. 请求错误要在合适的层级处理
4. 保持接口文档同步更新 