import { encrypt, decrypt } from './crypto';
import axios, { AxiosInstance } from 'axios';
import type { Area, Country, City, IpRange } from '@/types/api';

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

export interface AreaResponse {
  code: string;    // 地域代码
  name?: string;   // 地域名称
  cname: string;   // 地域中文名
  children?: AreaResponse[]; // 下级地域
}

export const API_ROUTES = {
  AREA: {
    LIST: '/api/open/app/area/v2',
    CITIES: '/api/open/app/city/list/v2',
    IP_RANGES: '/api/open/app/area/ip-ranges/v2'
  },
  PROXY: {
    INFO: '/api/open/app/proxy/info/v2',
    BALANCE: '/api/open/app/proxy/balance/v2',
    DRAW: '/api/open/app/proxy/draw/api/v2'
  }
};

export class IPProxyAPI {
  private baseURL: string;
  private appKey: string;
  private appId: string;
  private token: string | null;
  private axiosInstance: AxiosInstance;

  constructor() {
    // 在开发环境中使用代理
    this.baseURL = '';
    this.appKey = 'bf3ffghlt0hpc4omnvc2583jt0fag6a4';
    this.appId = 'AK20241120145620';
    this.token = null;

    // 打印所有API路由
    console.log('\n=== Frontend API Routes ===');
    Object.entries(API_ROUTES).forEach(([module, routes]) => {
      console.log(`\n[${module}]`);
      Object.entries(routes).forEach(([name, path]) => {
        console.log(`${name.padEnd(15)} ${path}`);
      });
    });
    console.log('\n=== End Frontend Routes ===\n');

    // 创建axios实例
    this.axiosInstance = axios.create({
      baseURL: '',  // 使用空的 baseURL
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // 添加请求拦截器
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // 确保URL正确
        if (config.url && !config.url.startsWith('/')) {
          config.url = `/${config.url}`;
        }

        // 调试日志
        console.log('[API Request]', {
          method: config.method,
          url: config.url,
          baseURL: config.baseURL,
          headers: config.headers,
          data: config.data
        });
        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('[API Response]', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      },
      (error) => {
        // 增强错误处理
        const errorInfo = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method,
          message: error.message,
          data: error.response?.data
        };
        console.error('[API Response Error]', errorInfo);

        // 如果是证书错误，添加更多信息
        if (error.code === 'ERR_CERT_DATE_INVALID') {
          console.warn('证书验证失败，请检查服务器证书是否有效。');
        }

        return Promise.reject(error);
      }
    );
  }

  initToken() {
    const token = localStorage.getItem('token');
    if (token) {
      this.token = token;
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  // 构建完整的 URL
  private buildUrl(endpoint: string): string {
    // 确保endpoint以/开头
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    console.log('[buildUrl] URL construction:', {
      original: endpoint,
      normalized: normalizedEndpoint,
      complete: normalizedEndpoint
    });
    
    return normalizedEndpoint;
  }

  private async request<T>(endpoint: string, params: Record<string, any>): Promise<T> {
    try {
      // 1. 添加必要的参数
      const fullParams = {
        ...params,
        appUsername: 'test_user',
      };

      // 2. 转换为 JSON 字符串
      const paramsStr = JSON.stringify(fullParams);
      
      // 3. 加密参数
      const encryptedParams = encrypt(paramsStr, this.appKey);
      
      // 4. 构建请求数据
      const requestData = {
        version: 'v2',
        encrypt: 'AES',
        appKey: this.appId,
        reqId: `reqId_${Date.now()}`,
        params: encryptedParams
      };

      // 5. 构建请求路径
      const apiPath = endpoint.startsWith('/api/') ? endpoint : `/api/open/app/${endpoint}`;
      console.log('[request] Using API path:', apiPath);

      // 6. 发送请求
      const response = await this.axiosInstance.post(apiPath, requestData);

      // 7. 检查响应
      if (!response.data) {
        throw new Error('No response data received');
      }

      if (response.data.code !== 200) {
        throw new Error(`API Error (${response.data.code}): ${response.data.msg || response.data.message}`);
      }

      // 8. 解密响应数据
      if (response.data.data && typeof response.data.data === 'string') {
        try {
          const decryptedData = decrypt(response.data.data, this.appKey);
          return JSON.parse(decryptedData);
        } catch (decryptError) {
          console.error('[Decrypt Error]:', decryptError);
          throw new Error('Failed to decrypt response data');
        }
      }

      return response.data.data;
    } catch (error) {
      console.error('[API Error]:', error);
      throw error;
    }
  }

  // 获取实例信息
  async getInstanceInfo(instances: string[]): Promise<any> {
    try {
      const response = await this.request<any>('open/app/instance/v2', {
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
      const response = await this.request<any>('open/app/order/v2', {
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
      const response = await this.request<ProxyBalanceInfo>('open/app/proxy/info/v2', {
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
      const response = await this.request<FlowUsageResponse>('open/app/flow/usage/v2', {
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
    
    return this.request('open/app/proxy/info/v2', params);
  }

  // 原有的方法保持不变
  async getAppInfo() {
    return this.request('open/app/info/v2', { type: 'info' });
  }

  async getProductStock(proxyType: number[]) {
    return this.request('open/app/product/query/v2', {
      proxyType
    });
  }

  // 获取区域列表
  async getAreaList(codes?: string[]): Promise<AreaResponse[]> {
    console.log('[getAreaList] Starting request with codes:', codes);
    try {
      const params: Record<string, any> = {};
      if (codes && codes.length > 0) {
        params.codes = codes;
      }
      return this.request<AreaResponse[]>(API_ROUTES.AREA.LIST, params);
    } catch (error) {
      console.error('[getAreaList] Error:', error);
      throw error;
    }
  }

  async getInstanceList() {
    return this.request('open/app/instance/v2', {});
  }

  // 创建用户
  async createUser(params: { appUsername: string; password: string; authName: string; no: string }) {
    try {
      const response = await this.request('open/app/user/create/v2', params);
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
      }>('open/app/user/v2', {
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
      await this.request('open/app/product/create/v2', {
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
    return this.request('open/app/user/list/v2', params);
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
    return this.request('open/app/agent/list/v2', params);
  }

  // 获取用户详细信息
  async getUserInfo(userId: string): Promise<UserInfo> {
    return this.request('open/app/user/info/v2', { userId });
  }

  // 获取代理商详细信息
  async getAgentInfo(agentId: string): Promise<AgentInfo> {
    return this.request('open/app/agent/info/v2', { agentId });
  }

  // 修改用户状态
  async updateUserStatus(userId: string, status: string): Promise<void> {
    return this.request('open/app/user/status/v2', { userId, status });
  }

  // 修改代理商状态
  async updateAgentStatus(agentId: string, status: string): Promise<void> {
    return this.request('open/app/agent/status/v2', { agentId, status });
  }

  // 修改用户密码
  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    return this.request('open/app/user/password/v2', { userId, newPassword });
  }

  // 修改代理商密码
  async updateAgentPassword(agentId: string, newPassword: string): Promise<void> {
    return this.request('open/app/agent/password/v2', { agentId, newPassword });
  }

  // 获取产品列表
  async getProductList(): Promise<ProductInfo[]> {
    return this.request('open/app/product/list/v2', {});
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
    return this.request('open/app/user/statistics/v2', { userId });
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
    return this.request('open/app/agent/statistics/v2', { agentId });
  }

  // 登录
  async login(username: string, password: string): Promise<{ access_token: string }> {
    try {
      const response = await axios.post('auth/login', {
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
      await this.request('admin/password/v2', {
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
      return await this.request('admin/settings/v2', {});
    } catch (error) {
      console.error('Failed to get system settings:', error);
      throw error;
    }
  }

  // 更新系统设置
  async updateSystemSettings(settings: Record<string, any>): Promise<void> {
    try {
      await this.request('admin/settings/system/v2', settings);
    } catch (error) {
      console.error('Failed to update system settings:', error);
      throw error;
    }
  }

  // 更新代理设置
  async updateProxySettings(settings: Record<string, any>): Promise<void> {
    try {
      await this.request('admin/settings/proxy/v2', settings);
    } catch (error) {
      console.error('Failed to update proxy settings:', error);
      throw error;
    }
  }

  // 重置系统设置
  async resetSystemSettings(): Promise<void> {
    try {
      await this.request('admin/settings/reset/v2', {});
    } catch (error) {
      console.error('Failed to reset system settings:', error);
      throw error;
    }
  }

  async getDynamicProxies(params: any) {
    try {
      const response = await this.request<any>('proxies/dynamic', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get dynamic proxies:', error);
      return { list: [], total: 0 };
    }
  }

  async getStaticOrders(params: any) {
    try {
      const response = await this.request<any>('orders/static', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get static orders:', error);
      return { data: [], total: 0 };
    }
  }

  // 根据区域获取国家列表
  async getCountriesByRegion(regionCode: string): Promise<AreaResponse[]> {
    try {
      const params = {
        codes: regionCode
      };
      return this.request<AreaResponse[]>(API_ROUTES.AREA.LIST, params);
    } catch (error) {
      console.error('[getCountriesByRegion] Error:', error);
      throw error;
    }
  }

  // 根据国家获取城市列表
  async getCitiesByCountry(countryCode: string): Promise<City[]> {
    try {
      const params = {
        countryCode
      };
      return this.request<City[]>(API_ROUTES.AREA.CITIES, params);
    } catch (error) {
      console.error('[getCitiesByCountry] Error:', error);
      throw error;
    }
  }

  // 获取IP段列表
  async getIpRanges(params: {
    regionCode: string;
    countryCode: string;
    cityCode: string;
    staticType: string;
  }): Promise<IpRange[]> {
    try {
      return this.request<IpRange[]>(API_ROUTES.AREA.IP_RANGES, params);
    } catch (error) {
      console.error('[getIpRanges] Error:', error);
      throw error;
    }
  }
}

export const ipProxyAPI = new IPProxyAPI();
export default ipProxyAPI;
