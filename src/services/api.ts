import { api } from '@/utils/request';
import type { User, UserProfile } from '@/types/user';
import type { DynamicOrder, StaticOrder, OrderSearchParams } from '@/types/order';
import type { StatisticsData } from '@/types/statistics';
import type { PaginatedData, PaginationParams, ProductPriceParams } from '@/types/api';
import type { ProxyResource } from '@/types/resource';
import type { ApiResponse } from '@/types/api';

// 用户相关
export const getUserProfile = () => api.get<UserProfile>('/user/profile');

// 订单相关
export const getDynamicOrders = (params: OrderSearchParams & PaginationParams) => 
  api.get<PaginatedData<DynamicOrder>>('/orders/dynamic', { params });

export const getStaticOrders = (params: OrderSearchParams & PaginationParams) => 
  api.get<PaginatedData<StaticOrder>>('/orders/static', { params });

export const getDynamicOrderDetail = (id: string) => 
  api.get<DynamicOrder>(`/orders/dynamic/${id}`);

export const getStaticOrderDetail = (id: string) => 
  api.get<StaticOrder>(`/orders/static/${id}`);

// 统计相关
export const getStatistics = () => api.get<StatisticsData>('/statistics');

// 价格相关
export async function getProductPrices(params: ProductPriceParams) {
  return api.get('/api/product/prices', { params });
}

export async function syncProductPrices() {
  return api.post('/api/product/prices/sync');
}

// 代理资源相关
export const getProxyResources = async () => {
  const requestId = new Date().getTime().toString();
  try {
    console.log('[API] [请求ID:%s] 开始获取代理资源', requestId, {
      timestamp: new Date().toISOString(),
      callStack: new Error().stack
    });
    
    const response = await api.get<ApiResponse<ProxyResource[]>>('/api/resources', { 
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('[API] [请求ID:%s] 原始响应数据:', requestId, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      timestamp: new Date().toISOString()
    });

    // 检查响应对象
    if (!response || !response.data) {
      console.error('[API] [请求ID:%s] 无效的响应:', requestId, {
        response,
        responseType: typeof response,
        hasData: Boolean(response?.data),
        stack: new Error().stack
      });
      throw new Error('服务器返回了无效的响应');
    }

    const { data, code, message } = response.data;
    console.log('[API] [请求ID:%s] 解析后的响应:', requestId, { 
      data, 
      code, 
      message,
      dataType: typeof data,
      isArray: Array.isArray(data),
      dataLength: Array.isArray(data) ? data.length : 0,
      timestamp: new Date().toISOString()
    });

    // 检查业务状态码
    if (code !== 0) {
      console.error('[API] [请求ID:%s] 业务错误:', requestId, { 
        code, 
        message, 
        data,
        expectedCode: 0,
        stack: new Error().stack
      });
      throw new Error(message || '获取代理资源失败');
    }

    // 检查数据格式
    if (!data) {
      console.error('[API] [请求ID:%s] 响应中没有数据字段:', requestId, {
        responseData: response.data,
        dataField: data,
        stack: new Error().stack
      });
      throw new Error('响应中没有数据字段');
    }

    // 确保数据是数组
    const resources = Array.isArray(data) ? data : [];
    console.log('[API] [请求ID:%s] 处理后的资源列表:', requestId, {
      originalData: data,
      processedResources: resources,
      resourceCount: resources.length,
      firstResource: resources[0],
      timestamp: new Date().toISOString()
    });

    const result = {
      data: {
        code: 0,
        message: 'success',
        data: resources
      }
    };

    console.log('[API] [请求ID:%s] 返回结果:', requestId, {
      result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error: any) {
    console.error('[API] [请求ID:%s] 获取代理资源异常:', requestId, {
      error,
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      timestamp: new Date().toISOString()
    });

    // 处理特定错误
    if (error.response?.status === 403) {
      throw new Error('您没有权限访问这些资源');
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error.message || '获取代理资源时发生错误');
  }
};

export const createProxyUser = (params: {
  appUsername: string;
  limitFlow: number;
  remark?: string;
  user_id?: number;
  agent_id?: number;
  password?: string;
}) => api.post<{ code: number; msg: string; data: any }>('/api/proxy/user', params);
