import request from '@/utils/request';
import type { ProxyResourceResponse } from '@/types/proxy';

/**
 * @deprecated 此服务将被合并到 businessService.ts 中
 * 获取代理资源列表
 */
export async function getProxyResources() {
  return request<ProxyResourceResponse>('/api/resources', {
    method: 'GET',
  });
} 