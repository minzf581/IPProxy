import { encrypt, decrypt } from './crypto';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { Area, Country, City, IpRange, ApiResponse } from '@/types/api';
import type { DynamicProxyParams, DynamicProxyPool } from '@/types/instance';
import type { DynamicOrder } from '@/types/order';
import { api } from './request';
import { message } from 'antd';

const DEBUG = import.meta.env.DEV;

function logDebug(methodName: string, ...args: any[]) {
  if (DEBUG) {
    console.log(`[IPProxyAPI][${methodName}]`, ...args);
  }
}

function logError(methodName: string, error: any) {
  console.error(`[IPProxyAPI][${methodName}] Error:`, error);
  if (error.response) {
    console.error(`[IPProxyAPI][${methodName}] Response data:`, error.response.data);
    console.error(`[IPProxyAPI][${methodName}] Response status:`, error.response.status);
    console.error(`[IPProxyAPI][${methodName}] Response headers:`, error.response.headers);
  } else if (error.request) {
    console.error(`[IPProxyAPI][${methodName}] No response received:`, error.request);
  } else {
    console.error(`[IPProxyAPI][${methodName}] Error setting up request:`, error.message);
  }
  console.error(`[IPProxyAPI][${methodName}] Stack trace:`, error.stack);
}

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
    LIST: '/open/app/area/v2',
    CITIES: '/open/app/city/list/v2',
    IP_RANGES: '/open/app/product/query/v2'
  },
  PROXY: {
    INFO: '/open/app/proxy/info/v2',
    BALANCE: '/open/app/proxy/balance/v2',
    DRAW: '/open/app/proxy/draw/api/v2',
    DYNAMIC: {
      OPEN: '/open/app/instance/open/v2',
      CALCULATE_PRICE: '/open/app/proxy/price/calculate/v2',
      REFRESH: '/open/app/instance/refresh/v2',
      LIST: '/open/app/instance/list/v2',
      POOLS: '/open/app/pool/list/v2'
    }
  },
  DASHBOARD: {
    INFO: '/open/app/dashboard/info/v2'
  },
  AGENT: {
    LIST: '/open/app/agent/list',
    USERS: '/api/open/app/agent/{id}/users'
  },
  USER: {
    LIST: '/open/app/user/list',
    CREATE: '/open/app/user/create',
    UPDATE: '/open/app/user/update',
    DELETE: '/open/app/user/delete',
    STATUS: '/open/app/user/status'
  }
};

interface CidrBlock {
  startIp: string;
  endIp: string;
  count: number;
}

interface RawArea {
  code?: string;
  name?: string;
  cname?: string;
  children?: RawArea[];
  countryList?: RawCountry[];
}

interface RawCountry {
  countryCode?: string;
  countryName?: string;
  cityList?: RawCity[];
}

interface RawCity {
  cityCode?: string;
  cityName?: string;
}

interface CityResponse {
  cityCode: string;
  cityName: string;
}

interface CityApiResponse {
  code: number;
  msg: string;
  data: Array<{
    cityCode: string;
    cityName: string;
    countryCode: string;
  }>;
}

export class IPProxyAPI {
  private baseURL: string;
  private appKey: string;
  private appId: string;
  private token: string | null;
  private axiosInstance: AxiosInstance;

  constructor() {
    // 在开发环境中使用代理
    this.baseURL = 'http://localhost:8000';
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
      baseURL: this.baseURL,
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
          config.url = `/api/${config.url}`;
        } else if (config.url && !config.url.startsWith('/api/')) {
          config.url = `/api${config.url}`;
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

  private async request<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      // 1. 添加必要的参数
      const fullParams = {
        ...(params || {}),
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
      const apiPath = endpoint.startsWith('/api/') ? endpoint : 
                     endpoint.startsWith('/') ? `/api${endpoint}` : 
                     `/api/${endpoint}`;
      
      console.log('[request] Using API path:', apiPath);

      // 6. 发送请求
      const response = await this.axiosInstance.post(apiPath, requestData);

      // 7. 检查响应
      if (!response.data) {
        throw new Error('未收到响应数据');
      }

      // 8. 解密响应数据
      if (response.data.data && typeof response.data.data === 'string') {
        try {
          const decryptedData = decrypt(response.data.data, this.appKey);
          return JSON.parse(decryptedData);
        } catch (decryptError) {
          console.error('[解密错误]:', decryptError);
          throw new Error('解密响应数据失败');
        }
      }

      // 9. 如果响应数据不需要解密，直接返回
      if (response.data.data) {
        return response.data.data;
      }

      // 10. 如果响应本身就是数组或对象，直接返回
      if (Array.isArray(response.data) || typeof response.data === 'object') {
        return response.data as T;
      }

      throw new Error('无效的响应数据格式');
    } catch (error: any) {
      if (error.message?.includes('API Error')) {
        throw error;
      }
      console.error('[IPProxyAPI] 请求异常:', {
        url: endpoint,
        params,
        error
      });
      if (error.response?.status === 404) {
        throw new Error('API接口不存在');
      } else if (error.response?.status === 403) {
        throw new Error('没有权限访问该API');
      } else if (error.response?.status === 401) {
        throw new Error('用户未登录或登录已过期');
      } else {
        throw new Error(`请求失败: ${error.message || '未知错误'}`);
      }
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
  async getAreaList(): Promise<AreaResponse[]> {
    try {
      console.log('[getAreaList] 开始获取区域列表');
      
      const response = await this.request<RawArea[] | { data: RawArea[] }>('open/app/area/v2', {
        appUsername: 'test_user'
      });
      
      console.log('[getAreaList] 原始响应:', response);
      
      // 处理响应数据
      let areaList: AreaResponse[] = [];
      
      if (Array.isArray(response)) {
        areaList = response.map((area: RawArea) => ({
          code: area.code || '',
          name: area.name || '',
          cname: area.cname || area.name || '',
          children: Array.isArray(area.children) ? area.children.map((child: RawArea) => ({
            code: child.code || '',
            name: child.name || '',
            cname: child.cname || child.name || '',
            children: Array.isArray(child.children) ? child.children.map((grandChild: RawArea) => ({
              code: grandChild.code || '',
              name: grandChild.name || '',
              cname: grandChild.cname || grandChild.name || ''
            })) : undefined
          })) : undefined,
          countryList: Array.isArray(area.countryList) ? area.countryList.map((country: RawCountry) => ({
            countryCode: country.countryCode || '',
            countryName: country.countryName || '',
            cityList: Array.isArray(country.cityList) ? country.cityList.map((city: RawCity) => ({
              cityCode: city.cityCode || '',
              cityName: city.cityName || ''
            })) : []
          })) : undefined
        }));
      } else if (response && typeof response === 'object' && 'data' in response) {
        const data = response.data;
        if (Array.isArray(data)) {
          areaList = data.map((area: RawArea) => ({
            code: area.code || '',
            name: area.name || '',
            cname: area.cname || area.name || '',
            children: Array.isArray(area.children) ? area.children.map((child: RawArea) => ({
              code: child.code || '',
              name: child.name || '',
              cname: child.cname || child.name || '',
              children: Array.isArray(child.children) ? child.children.map((grandChild: RawArea) => ({
                code: grandChild.code || '',
                name: grandChild.name || '',
                cname: grandChild.cname || grandChild.name || ''
              })) : undefined
            })) : undefined,
            countryList: Array.isArray(area.countryList) ? area.countryList.map((country: RawCountry) => ({
              countryCode: country.countryCode || '',
              countryName: country.countryName || '',
              cityList: Array.isArray(country.cityList) ? country.cityList.map((city: RawCity) => ({
                cityCode: city.cityCode || '',
                cityName: city.cityName || ''
              })) : []
            })) : undefined
          }));
        }
      }
      
      console.log('[getAreaList] 处理后的区域列表:', areaList);
      return areaList;
      
    } catch (error) {
      console.error('[getAreaList] 获取区域列表失败:', error);
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
    try {
      console.log('[IPProxyAPI Debug] Getting user list with params:', params);
      const queryParams = {
        page: params.page,
        pageSize: params.pageSize,
        ...(params.searchAccount && { username: params.searchAccount }),
        ...(params.agentId && { agentId: params.agentId }),
        ...(params.status && { status: params.status })
      };

      console.log('[IPProxyAPI Debug] Formatted params:', queryParams);
      const response = await this.request<{
        list: UserInfo[];
        total: number;
      }>(API_ROUTES.USER.LIST, queryParams);

      console.log('[IPProxyAPI Debug] User list response:', response);
      return response;
    } catch (error) {
      console.error('[IPProxyAPI Debug] Failed to get user list:', error);
      return { list: [], total: 0 };
    }
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

  // 刷新动态代理
  async refreshDynamicProxy(instanceId: string): Promise<ApiResponse<DynamicOrder>> {
    try {
      const response = await this.axiosInstance.post(API_ROUTES.PROXY.DYNAMIC.REFRESH, { instanceId });
      return response.data;
    } catch (error) {
      console.error('刷新动态代理失败:', error);
      throw error;
    }
  }

  // 获取动态代理列表
  async getDynamicProxies(params: {
    page: number;
    pageSize: number;
    status?: string;
    sortField?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<{
    list: DynamicOrder[];
    total: number;
  }>> {
    const methodName = 'getDynamicProxies';
    try {
      logDebug(methodName, 'Request params:', params);
      const response = await this.axiosInstance.get(API_ROUTES.PROXY.DYNAMIC.LIST, { params });
      logDebug(methodName, 'Response:', response.data);
      return response.data;
    } catch (error) {
      logError(methodName, error);
      throw error;
    }
  }

  // 根据区域获取国家列表
  async getCountriesByRegion(regionCode: string): Promise<AreaResponse[]> {
    try {
      console.log('[getCountriesByRegion] Starting request with region code:', regionCode);
      
      // 获取区域列表
      const response = await this.request<ApiResponse<AreaResponse[]>>(API_ROUTES.AREA.LIST, {
        appUsername: 'test_user'
      });
      
      if (!response || !response.data || !Array.isArray(response.data)) {
        console.warn('[getCountriesByRegion] Invalid response format:', response);
        return [];
      }

      // 找到指定区域的数据
      const region = response.data.find(area => area.code === regionCode);
      
      if (!region || !Array.isArray(region.children)) {
        console.warn('[getCountriesByRegion] No countries found for region:', regionCode);
        return [];
      }
      
      console.log('[getCountriesByRegion] Found countries:', region.children);
      return region.children.map(country => ({
        code: country.code || '',
        name: country.name || country.cname || '',
        cname: country.cname || country.name || '',
        children: Array.isArray(country.children)
          ? country.children.map(city => ({
              code: city.code || '',
              name: city.name || city.cname || '',
              cname: city.cname || city.name || ''
            }))
          : []
      }));
    } catch (error) {
      console.error('[getCountriesByRegion] Error:', error);
      throw error;
    }
  }

  // 根据国家获取城市列表
  async getCitiesByCountry(countryCode: string): Promise<CityApiResponse> {
    try {
      console.log('[IPProxyAPI] getCitiesByCountry - 开始获取城市列表，国家代码:', countryCode);
      
      const response = await this.request<CityApiResponse>('open/app/city/list/v2', {
        countryCode: countryCode.toUpperCase(),
        appUsername: 'test_user'
      });
      
      console.log('[IPProxyAPI] getCitiesByCountry - 原始响应:', response);
      
      return response;
    } catch (error) {
      console.error('[IPProxyAPI] getCitiesByCountry - 错误:', error);
      throw error;
    }
  }

  // 获取IP段列表
  async getIpRanges(params: {
    proxyType: number;
    regionCode?: string;
    countryCode?: string;
    cityCode?: string;
    staticType?: string;
  }): Promise<IpRange[]> {
    try {
      console.log('[getIpRanges] 开始请求，参数:', params);
      
      // 构建请求参数
      const requestParams = {
        proxyType: params.proxyType,
        appUsername: 'test_user',
        ...(params.regionCode && { regionCode: params.regionCode.toUpperCase() }),
        ...(params.countryCode && { countryCode: params.countryCode.toUpperCase() }),
        ...(params.cityCode && { cityCode: params.cityCode.toUpperCase() }),
        ...(params.staticType && { staticType: params.staticType })
      };

      console.log('[getIpRanges] 处理后的请求参数:', requestParams);
      
      const response = await this.request<any[]>('open/app/product/query/v2', requestParams);
      
      if (!Array.isArray(response)) {
        console.warn('[getIpRanges] 响应不是数组:', response);
        return [];
      }
      
      // 转换响应数据
      const ipRanges = response.map(item => ({
        ipStart: item.ipStart || '',
        ipEnd: item.ipEnd || '',
        ipCount: Number(item.ipCount) || 0,
        stock: Number(item.inventory) || 0,
        staticType: String(item.staticType || ''),
        countryCode: String(item.countryCode || ''),
        cityCode: String(item.cityCode || ''),
        regionCode: String(item.areaCode || ''),
        price: Number(item.costPrice) || 0,
        status: Number(item.enable) || 0
      }));

      console.log('[getIpRanges] 处理后的IP段列表:', ipRanges);
      return ipRanges;
      
    } catch (error) {
      console.error('[getIpRanges] 查询IP段失败:', error);
      throw new Error('查询IP段失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  // 计算动态代理价格
  async calculateDynamicProxyPrice(params: { poolId: string; trafficAmount: number }): Promise<APIResponse<{ price: number }>> {
    try {
      console.log('[calculateDynamicProxyPrice] 开始计算价格, 参数:', {
        poolId: params.poolId,
        trafficAmount: params.trafficAmount,
        trafficAmountType: typeof params.trafficAmount
      });

      // 参数验证
      if (!params.poolId) {
        throw new Error('代理池ID不能为空');
      }
      if (!params.trafficAmount || params.trafficAmount <= 0) {
        throw new Error('流量值必须大于0');
      }

      // 直接调用本地价格计算API
      const response = await this.axiosInstance.post('/api/proxy/price/calculate', {
        poolId: params.poolId,
        trafficAmount: Number(params.trafficAmount)
      });

      console.log('[calculateDynamicProxyPrice] 价格计算响应:', response.data);

      if (response.data.code === 0) {
        return {
          code: 0,
          msg: 'success',
          reqId: response.data.reqId || this.generateReqId(),
          data: { price: response.data.data.price }
        };
      }

      throw new Error(response.data.msg || '价格计算失败');
    } catch (error) {
      console.error('[calculateDynamicProxyPrice] 计算价格失败:', error);
      if (error instanceof Error) {
        throw new Error(`计算动态代理价格失败: ${error.message}`);
      } else {
        throw new Error('计算动态代理价格失败');
      }
    }
  }

  // 开通动态代理
  async openDynamicProxy(params: DynamicProxyParams): Promise<ApiResponse<DynamicOrder>> {
    const methodName = 'openDynamicProxy';
    try {
      logDebug(methodName, 'Request params:', params);
      const response = await this.axiosInstance.post(API_ROUTES.PROXY.DYNAMIC.OPEN, params);
      logDebug(methodName, 'Response:', response.data);
      return response.data;
    } catch (error) {
      logError(methodName, error);
      throw error;
    }
  }

  // 获取代理池列表
  async getProxyPools(): Promise<ApiResponse<DynamicProxyPool[]>> {
    const methodName = 'getProxyPools';
    try {
      logDebug(methodName, 'Fetching proxy pools');
      const response = await this.axiosInstance.get(API_ROUTES.PROXY.DYNAMIC.POOLS);
      logDebug(methodName, 'Response:', response.data);
      return response.data;
    } catch (error) {
      logError(methodName, error);
      throw error;
    }
  }

  // 同步库存
  async syncInventory(): Promise<void> {
    try {
      logDebug('syncInventory', '开始同步库存');
      const response = await this.axiosInstance.post('/api/proxy/inventory/sync');
      
      if (response.data.code === 0) {
        logDebug('syncInventory', '库存同步成功');
      } else {
        logError('syncInventory', new Error(response.data.msg || '同步库存失败'));
        throw new Error(response.data.msg || '同步库存失败');
      }
    } catch (error) {
      logError('syncInventory', error);
      throw error;
    }
  }

  private generateReqId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // 简单API调用方法
  async getAreaListSimple(): Promise<ApiResponse<AreaResponse[]>> {
    return api.get('/api/area/list');
  }

  async getCountriesByRegionSimple(regionCode: string): Promise<ApiResponse<AreaResponse[]>> {
    return api.post('/api/area/countries', {
      data: { regionCode }
    });
  }

  async getCitiesByCountrySimple(countryCode: string): Promise<ApiResponse<AreaResponse[]>> {
    return api.post('/api/area/cities', {
      data: { countryCode }
    });
  }

  async getIpRangesSimple(params: {
    region_code: string;
    country_code: string;
    city_code: string;
  }): Promise<ApiResponse<IpRange[]>> {
    const requestParams = {
      regionCode: params.region_code,
      countryCode: params.country_code,
      cityCode: params.city_code,
      proxyType: 103  // 静态国外家庭
    };
    return api.post('/api/open/app/product/query/v2', {
      data: requestParams
    });
  }
}

export const ipProxyAPI = new IPProxyAPI();
export default ipProxyAPI;
