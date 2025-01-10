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

export class IPProxyAPI {
  private baseURL: string;
  private appKey: string;
  private appId: string;

  constructor() {
    this.baseURL = 'http://localhost:3001';
    this.appKey = 'bf3ffghlt0hpc4omnvc2583jt0fag6a4';
    this.appId = 'AK20241120145620';
  }

  private async request<T>(endpoint: string, params: Record<string, any>): Promise<T> {
    try {
      // 1. 记录原始参数
      console.log('\n=== Request Params ===');
      console.log('Original params:', params);
      
      // 2. 转换为 JSON 字符串
      const paramsStr = JSON.stringify(params);
      console.log('Params string:', paramsStr);
      
      // 3. 加密参数（使用 appKey 而不是 this.appKey）
      const encryptedParams = encrypt(paramsStr, 'bf3ffghlt0hpc4omnvc2583jt0fag6a4');
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
      const response = await axios.post<APIResponse<string>>(
        `${this.baseURL}${endpoint}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
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
      const cleanData = response.data.data.replace(/[\s"']+/g, '');
      if (!/^[A-Za-z0-9+/=]+$/.test(cleanData)) {
        throw new Error('Invalid response data format: not a valid Base64 string');
      }

      // 9. 解密和解析
      const decrypted = decrypt(cleanData, 'bf3ffghlt0hpc4omnvc2583jt0fag6a4');
      console.log('[API Response] Decrypted:', decrypted);

      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('[API Error]:', error);
      throw error;
    }
  }

  // 获取实例信息
  async getInstanceInfo(instances: string[]) {
    try {
      const response = await this.request('/api/open/app/instance/v2', {
        instances
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get instance info:', error);
      throw error;
    }
  }

  // 获取订单信息
  async getOrderInfo(orderNo: string = '', page: number = 1, pageSize: number = 10) {
    try {
      const response = await this.request('/api/open/app/order/v2', {
        orderNo,
        page,
        pageSize
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get order info:', error);
      throw error;
    }
  }

  // 获取代理余额信息
  async getProxyBalance(proxyType: number, productNo: string, username?: string, appUsername?: string) {
    try {
      const response = await this.request('/api/open/app/proxy/info/v2', {
        proxyType,
        productNo,
        ...(username && { username }),
        ...(appUsername && { appUsername })
      });
      return response.data;
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
      const response = await this.request('/api/open/app/proxy/flow/use/log/v2', {
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
}

export const ipProxyAPI = new IPProxyAPI();
export default ipProxyAPI;
