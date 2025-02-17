# 路由不匹配问题处理原则

## 一、问题分类

### 1. 前后端路由不匹配类型
- 前缀不匹配（如：`/api` 前缀缺失或多余）
- 路径不匹配（如：路径大小写、单复数形式不一致）
- 版本号不匹配（如：`/v1` vs `/v2`）
- 参数格式不匹配（如：`snake_case` vs `camelCase`）

### 2. 常见原因
- 前端路由配置与后端实际路由不一致
- 多个模块共用相同的路由前缀配置
- 历史遗留问题（如API版本升级）
- 开发环境与生产环境配置差异

## 二、修改原则

### 1. 最小影响原则
- 优先在出问题的模块内部解决
- 避免修改公共配置文件
- 不影响其他正常工作的模块

### 2. 分层处理原则
1. 模块级解决方案：
   ```typescript
   // 在具体的服务模块中处理
   export async function getAgentList(params) {
     return api.get(`/api${API_ROUTES.AGENT.LIST}`, { params });
   }
   ```

2. 服务级解决方案：
   ```typescript
   // 在特定服务的请求实例中处理
   const agentApi = axios.create({
     baseURL: `${BASE_URL}/api`,
     // ... other configs
   });
   ```

3. 全局级解决方案（需谨慎）：
   ```typescript
   // 仅在确认影响范围后使用全局拦截器
   api.interceptors.request.use(config => {
     if (config.url?.startsWith('/specific/path')) {
       // 处理特定路径
     }
     return config;
   });
   ```

### 3. 优先级顺序
1. 模块内部修改（优先考虑）
2. 服务层修改（其次考虑）
3. 全局配置修改（最后考虑）

## 三、具体实施流程

### 1. 问题定位
1. 检查后端实际路由配置
2. 检查前端路由配置
3. 对比请求日志中的实际URL
4. 确认是否存在环境差异

### 2. 方案选择
1. 评估影响范围
   - 仅影响单个接口
   - 影响特定模块
   - 影响多个模块

2. 选择对应层级的解决方案
   - 单接口问题：在服务方法中直接修正
   - 模块级问题：创建模块专用的请求实例
   - 多模块问题：考虑服务层或配置层解决

### 3. 实施步骤
1. 单接口修改：
   ```typescript
   // agentService.ts
   export const getAgentList = async (params) => {
     // 直接在方法中处理路由
     const url = `/api/open/app/agent/list`;
     return api.get(url, { params });
   };
   ```

2. 模块级修改：
   ```typescript
   // agentService.ts
   const agentApi = axios.create({
     baseURL: `${BASE_URL}/api/open/app`,
     // ... other configs
   });
   
   export const getAgentList = async (params) => {
     return agentApi.get('/agent/list', { params });
   };
   ```

3. 配置级修改（需要充分评估）：
   ```typescript
   // routes.ts
   export const API_ROUTES = {
     AGENT: {
       LIST: process.env.NODE_ENV === 'development' 
         ? '/api/open/app/agent/list'
         : '/open/app/agent/list'
     }
   };
   ```

## 四、测试验证

### 1. 测试范围
- 修改的具体接口
- 同模块其他接口
- 使用相似路由的其他模块
- 全局路由配置（如果修改）

### 2. 测试环境
- 本地开发环境
- 测试环境
- 预发布环境
- 生产环境

### 3. 回归测试
- 相关功能的完整流程测试
- 错误处理测试
- 边界条件测试

## 五、文档维护

### 1. 记录修改
- 修改的具体内容
- 修改原因
- 影响范围
- 测试结果

### 2. 更新相关文档
- API文档
- 路由配置文档
- 开发规范文档

## 六、预防措施

### 1. 开发规范
- 统一的路由命名规则
- 明确的版本控制策略
- 规范的参数命名规则

### 2. 工具支持
- 路由检查脚本
- API文档自动生成
- 测试用例自动生成

### 3. 代码审查
- 路由配置变更的重点审查
- 公共组件修改的影响评估
- 测试用例的完整性检查

### 代理商用户列表路由 (`/open/app/agent/{id}/users`)

#### 基本原则
1. 严格的权限控制
   - 管理员可以查看所有代理商的用户列表
   - 代理商只能查看自己名下的用户列表
   - 未授权访问返回 403 错误

2. 参数验证
   - 必须验证代理商 ID 的有效性
   - 分页参数必须在合理范围内
   - 状态参数必须是有效值

3. 数据过滤
   - 根据状态参数过滤用户列表
   - 按创建时间倒序排序
   - 返回标准化的用户信息

4. 错误处理
   - 代理商不存在时返回 404
   - 参数错误时返回 400
   - 服务器错误时返回 500

5. 性能优化
   - 使用适当的数据库索引
   - 实现分页查询
   - 限制单页数据量

#### 实现注意事项
1. 数据库查询
   ```python
   query = db.query(User).filter(User.agent_id == agent_id)
   if status:
       query = query.filter(User.status == status)
   ```

2. 响应格式
   ```json
   {
     "code": 0,
     "message": "获取用户列表成功",
     "data": {
       "list": [...],
       "total": number
     }
   }
   ```

3. 日志记录
   - 记录请求参数
   - 记录响应结果
   - 记录错误信息

4. 缓存策略
   - 考虑实现结果缓存
   - 设置合理的缓存过期时间
   - 在用户数据更新时清除缓存 