import request from '@/utils/request';
import type { DynamicProxyArea, DynamicProxyResponse } from '@/types/dynamicProxy';
import type { AxiosResponse } from 'axios';

export async function getDynamicProxyAreas(params: {
  productNo: string;
  proxyType: number;
}): Promise<DynamicProxyResponse> {
  const requestId = new Date().getTime().toString();
  console.log('[动态代理服务] [请求ID:%s] 开始获取区域列表', requestId, {
    url: '/api/open/app/product/area/v2',
    method: 'GET',
    params,
    timestamp: new Date().toISOString()
  });

  try {
    const response = await request<DynamicProxyResponse>('/api/open/app/product/area/v2', {
      method: 'GET',
      params,
    });
    
    const responseData = response.data as DynamicProxyResponse;
    console.log('[动态代理服务] [请求ID:%s] 获取区域列表成功', requestId, {
      code: responseData.code,
      message: responseData.message,
      dataLength: Array.isArray(responseData.data) ? responseData.data.length : 1,
      timestamp: new Date().toISOString()
    });
    
    return responseData;
  } catch (error) {
    console.error('[动态代理服务] [请求ID:%s] 获取区域列表失败', requestId, {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export async function saveDynamicProxyAreas(data: {
  areas: DynamicProxyArea[];
}): Promise<DynamicProxyResponse> {
  const requestId = new Date().getTime().toString();
  console.log('[动态代理服务] [请求ID:%s] 开始保存区域列表', requestId, {
    url: '/api/business/dynamic-proxy/areas',
    method: 'POST',
    areasCount: data.areas.length,
    timestamp: new Date().toISOString()
  });

  try {
    const response = await request<DynamicProxyResponse>('/api/business/dynamic-proxy/areas', {
      method: 'POST',
      data,
    });
    
    const responseData = response.data as DynamicProxyResponse;
    console.log('[动态代理服务] [请求ID:%s] 保存区域列表成功', requestId, {
      code: responseData.code,
      message: responseData.message,
      timestamp: new Date().toISOString()
    });
    
    return responseData;
  } catch (error) {
    console.error('[动态代理服务] [请求ID:%s] 保存区域列表失败', requestId, {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
} 