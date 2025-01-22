import { encrypt, decrypt } from './crypto';
import axios from 'axios';

export interface APIResponse<T> {
  reqId: string;
  code: number;
  msg: string;
  data: T;
}

// 代理余额信息接口
export interface ProxyBalanceInfo {
  used: number;      // 已使用流量（MB）
  total: number;     // 总流量（MB）
  balance: number;   // 剩余流量（MB）
  productNo: string; // 产品编号
  ipWhiteList: string[];  // IP白名单
  ipUsed: number;    // 已使用IP数量
  ipTotal: number;   // 总IP数量
}

// 订单信息接口
export interface OrderInstance {
  instanceNo: string;    // 实例编号
  proxyType: number;     // 代理类型
  protocolType: number;  // 协议类型
  proxyIp: string;      // 代理IP地址
  proxyPort: number;     // 代理端口
  areaAddress: string;   // 区域地址
  countryCode: string;   // 国家代码
  cityCode: string;      // 城市代码
  useType: number;       // 使用方式
  username: string;      // 账户名或UUID
  password: string;      // 密码
  orderNo: string;      // 订单号
  expireTime: string;   // 到期时间
  totalFlow: number;    // 总流量
  balanceFlow: number;  // 剩余流量
  status: number;       // 状态
  autoRenew: number;    // 自动续费
  bridgeList: string[]; // 桥地址列表
  createTime: string;   // 开通时间
  lastRenewTime: string; // 最后成功续费时间
  releaseTime: string;   // 释放成功时间
  productNo: string;     // 产品编号
}

export interface OrderInfo {
  orderNo: string;      // 平台订单号
  appOrderNo: string;   // 渠道商订单号
  type: number;         // 订单类型
  status: number;       // 订单状态
  count: number;        // 购买数量
  amount: number;       // 总价
  refund: number;       // 是否有退费
  page: number;         // 页码
  pageSize: number;     // 每页显示数量
  total: number;        // 订单对应实例总数量
  instances: OrderInstance[]; // 订单对应实例列表
}

// 流量使用记录接口
export interface FlowUsageRecord {
  date: string;        // 日期
  usedFlow: number;    // 已使用流量（MB）
  balanceFlow: number; // 剩余流量（MB）
  totalFlow: number;   // 总流量（MB）
  productNo: string;   // 产品编号
}

export interface FlowUsageResponse {
  list: FlowUsageRecord[];
  page: number;
  pageSize: number;
  total: number;
}

// 用户信息接口
export interface UserInfo {
  id: string;
  account: string;
  agentId: string;
  agentName: string;
  status: string;
  createdAt: string;
  remark: string;
  balance: number;
  totalRecharge: number;
  totalConsumption: number;
}

// 代理商信息接口
export interface AgentInfo {
  id: string;
  name: string;
  account: string;
  status: string;
  createdAt: string;
  remark: string;
  balance: number;
  totalRecharge: number;
  totalConsumption: number;
}

// 产品信息接口
export interface ProductInfo {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  status: string;
}

export class IPProxyAPI {
  private baseURL: string;
  private appKey: string;
  private appId: string;
  private token: string | null = null;

  constructor() {
    // Check if we're running on GitHub Pages
    const isGitHubPages = window.location.hostname === 'minzf581.github.io';
    this.baseURL = isGitHubPages ? 'https://sandbox.ipipv.com' : 'http://localhost:8000';
    this.appKey = 'bf3ffghlt0hpc4omnvc2583jt0fag6a4';
    this.appId = 'AK20241120145620';
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(endpoint: string, params: Record<string, any>): Promise<T> {
    try {
      // 1. 记录原始参数
      console.log('\n=== Request Params ===');
      console.log('Original params:', params);
      
      // 2. 转换为 JSON 字符串
      const paramsStr = JSON.stringify(params);
      console.log('Params string:', paramsStr);
      
      // 3. 加密参数
      const encryptedParams = encrypt(paramsStr, this.appKey);
      console.log('Encrypted params:', encryptedParams);
      
      // 4. 构建请求体
      const requestBody = {
        version: 'v2',
        encrypt: 'AES',
        appKey: this.appId,
        reqId: `reqId_${Date.now()}`,
        params: encryptedParams
      };
      
      console.log('Request body:', requestBody);
      console.log('=== End Request Params ===\n');

      // 5. 发送请求
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // 添加认证头
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await axios.post<APIResponse<T>>(
        `${this.baseURL}${endpoint}`,
        requestBody,
        { headers }
      );

      // 6. 检查响应
      if (response.data.code !== 200) {
        throw new Error(`API Error (${response.data.code}): ${response.data.msg}`);
      }

      // 7. 解密响应
      if (!response.data.data) {
        console.log('[API Response] No data to decrypt');
        return null as T;
      }

      // 8. 清理和验证响应数据
      const cleanData = (response.data.data as string).replace(/[\s"']+/g, '');
      if (!/^[A-Za-z0-9+/=]+$/.test(cleanData)) {
        throw new Error('Invalid response data format: not a valid Base64 string');
      }

      // 9. 解密和解析
      const decrypted = decrypt(cleanData, this.appKey);
      console.log('[API Response] Decrypted:', decrypted);

      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('[API Error]:', error);
      throw error;
    }
  }

  // 获取实例信息
  async getInstanceInfo(instances: string[]): Promise<any> {
    try {
      const response = await this.request<any>('/api/open/app/instance/v2', {
        instances
      });
      return response;
    } catch (error) {
      console.error('Failed to get instance info:', error);
      throw error;
    }
  }

  // 获取订单信息
  async getOrderInfo(orderNo: string = '', page: number = 1, pageSize: number = 10): Promise<any> {
    try {
      const response = await this.request<any>('/api/open/app/order/v2', {
        orderNo,
        page,
        pageSize
      });
      return response;
    } catch (error) {
      console.error('Failed to get order info:', error);
      throw error;
    }
  }

  // 获取代理余额信息
  async getProxyBalance(proxyType: number, productNo: string, username?: string, appUsername?: string): Promise<ProxyBalanceInfo> {
    try {
      const response = await this.request<ProxyBalanceInfo>('/api/open/app/proxy/info/v2', {
        proxyType,
        productNo,
        ...(username && { username }),
        ...(appUsername && { appUsername })
      });
      return response;
    } catch (error) {
      console.error('Failed to get proxy balance:', error);
      throw error;
    }
  }

  // 获取流量使用记录
  async getFlowUsage(params: {
    startTime: string;
    endTime: string;
    page?: number;
    pageSize?: number;
    username?: string;
    appUsername?: string;
  }): Promise<FlowUsageResponse> {
    try {
      const { startTime, endTime, page = 1, pageSize = 10, username, appUsername } = params;
      const response = await this.request<FlowUsageResponse>('/api/open/app/flow/usage/v2', {
        startTime,
        endTime,
        page,
        pageSize,
        ...(username && { username }),
        ...(appUsername && { appUsername })
      });
      return response;
    } catch (error) {
      console.error('Failed to get flow usage:', error);
      throw error;
    }
  }

  // 获取代理信息
  async getProxyInfo(): Promise<any> {
    const params = {
      type: 'info',
      timestamp: Math.floor(Date.now() / 1000),
      appUsername: 'test_user',
      username: 'test_user', 
      proxyType: ['http', 'https'] 
    };

    console.log('\n=== getProxyInfo Request ===');
    console.log('Request params:', JSON.stringify(params, null, 2));
    console.log('=== End getProxyInfo Request ===\n');
    
    return this.request('/api/open/app/proxy/info/v2', params);
  }

  // 原有的方法保持不变
  async getAppInfo() {
    return this.request('/api/open/app/info/v2', { type: 'info' });
  }

  async getProductStock(proxyType: number[]) {
    return this.request('/api/open/app/product/query/v2', {
      proxyType
    });
  }

  async getAreaList() {
    return this.request('/api/open/app/area/v2', {});
  }

  async getInstanceList() {
    return this.request('/api/open/app/instance/v2', {});
  }

  // 创建用户
  async createUser(params: { appUsername: string; password: string; authName: string; no: string }) {
    try {
      const response = await this.request('/api/open/app/user/create/v2', params);
      return response;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  // 创建主账号
  async createMainUser(params: {
    phone: string;
    email: string;
    authType: number;
    authName: string;
    no: string;
    status: number;
  }): Promise<{
    appUsername: string;
    username: string;
    password: string;
    status: number;
    authStatus: number;
  }> {
    try {
      const response = await this.request<{
        appUsername: string;
        username: string;
        password: string;
        status: number;
        authStatus: number;
      }>('/api/open/app/user/v2', {
        ...params,
        authType: 2,  // 个人实名
        status: 1     // 正常状态
      });
      return response;
    } catch (error) {
      console.error('Failed to create main user:', error);
      throw error;
    }
  }

  // 创建主账号的产品
  async createMainUserProduct(username: string, appUsername: string): Promise<void> {
    try {
      await this.request('/api/open/app/product/create/v2', {
        proxyType: 104,
        productNo: 'PROXY_DYNAMIC',
        username,
        appUsername,
        count: 1,
        autoRenew: 0
      });
    } catch (error) {
      console.error('Failed to create product for main user:', error);
      throw error;
    }
  }

  // 获取用户列表
  async getUserList(params: {
    page: number;
    pageSize: number;
    searchAccount?: string;
    agentId?: string;
    status?: string;
  }): Promise<{
    list: UserInfo[];
    total: number;
  }> {
    return this.request('/api/open/app/user/list/v2', params);
  }

  // 获取代理商列表
  async getAgentList(params: {
    page: number;
    pageSize: number;
    searchAccount?: string;
    status?: string;
  }): Promise<{
    list: AgentInfo[];
    total: number;
  }> {
    return this.request('/api/open/app/agent/list/v2', params);
  }

  // 获取用户详细信息
  async getUserInfo(userId: string): Promise<UserInfo> {
    return this.request('/api/open/app/user/info/v2', { userId });
  }

  // 获取代理商详细信息
  async getAgentInfo(agentId: string): Promise<AgentInfo> {
    return this.request('/api/open/app/agent/info/v2', { agentId });
  }

  // 修改用户状态
  async updateUserStatus(userId: string, status: string): Promise<void> {
    return this.request('/api/open/app/user/status/v2', { userId, status });
  }

  // 修改代理商状态
  async updateAgentStatus(agentId: string, status: string): Promise<void> {
    return this.request('/api/open/app/agent/status/v2', { agentId, status });
  }

  // 修改用户密码
  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    return this.request('/api/open/app/user/password/v2', { userId, newPassword });
  }

  // 修改代理商密码
  async updateAgentPassword(agentId: string, newPassword: string): Promise<void> {
    return this.request('/api/open/app/agent/password/v2', { agentId, newPassword });
  }

  // 获取产品列表
  async getProductList(): Promise<ProductInfo[]> {
    return this.request('/api/open/app/product/list/v2', {});
  }

  // 获取用户统计信息
  async getUserStatistics(userId: string): Promise<{
    balance: number;
    totalRecharge: number;
    totalConsumption: number;
    monthlyRecharge: number;
    monthlyConsumption: number;
    lastMonthConsumption: number;
  }> {
    return this.request('/api/open/app/user/statistics/v2', { userId });
  }

  // 获取代理商统计信息
  async getAgentStatistics(agentId: string): Promise<{
    balance: number;
    totalRecharge: number;
    totalConsumption: number;
    monthlyRecharge: number;
    monthlyConsumption: number;
    lastMonthConsumption: number;
  }> {
    return this.request('/api/open/app/agent/statistics/v2', { agentId });
  }

  // 登录
  async login(username: string, password: string): Promise<{ access_token: string }> {
    try {
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        username,
        password
      });
      
      if (response?.data?.data?.access_token) {
        this.setToken(response.data.data.access_token);
        return { access_token: response.data.data.access_token };
      }
      throw new Error(response?.data?.msg || '登录失败');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // 获取当前用户信息
  async getCurrentUser(): Promise<UserInfo> {
    try {
      // 由于是本地验证，直接返回模拟的用户信息
      return {
        id: 'admin',
        account: 'ipadmin',
        agentId: 'admin',
        agentName: '管理员',
        status: 'active',
        createdAt: new Date().toISOString(),
        remark: '',
        balance: 0,
        totalRecharge: 0,
        totalConsumption: 0
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  // 更新管理员密码
  async updateAdminPassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await this.request('/api/admin/password/v2', {
        oldPassword,
        newPassword
      });
    } catch (error) {
      console.error('Failed to update admin password:', error);
      throw error;
    }
  }

  // 获取系统设置
  async getSystemSettings(): Promise<{
    system: Record<string, any>;
    proxy: Record<string, any>;
  }> {
    try {
      return await this.request('/api/admin/settings/v2', {});
    } catch (error) {
      console.error('Failed to get system settings:', error);
      throw error;
    }
  }

  // 更新系统设置
  async updateSystemSettings(settings: Record<string, any>): Promise<void> {
    try {
      await this.request('/api/admin/settings/system/v2', settings);
    } catch (error) {
      console.error('Failed to update system settings:', error);
      throw error;
    }
  }

  // 更新代理设置
  async updateProxySettings(settings: Record<string, any>): Promise<void> {
    try {
      await this.request('/api/admin/settings/proxy/v2', settings);
    } catch (error) {
      console.error('Failed to update proxy settings:', error);
      throw error;
    }
  }

  // 重置系统设置
  async resetSystemSettings(): Promise<void> {
    try {
      await this.request('/api/admin/settings/reset/v2', {});
    } catch (error) {
      console.error('Failed to reset system settings:', error);
      throw error;
    }
  }

  async getDynamicProxies(params: any) {
    try {
      const response = await this.request<any>('/api/proxies/dynamic', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get dynamic proxies:', error);
      return { list: [], total: 0 };
    }
  }

  async getStaticOrders(params: any) {
    try {
      const response = await this.request<any>('/api/orders/static', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get static orders:', error);
      return { data: [], total: 0 };
    }
  }
}

export const ipProxyAPI = new IPProxyAPI();
export default ipProxyAPI;
