import { api } from '@/utils/request';
import type { ApiResponse } from '@/types/api';

/**
 * 代理商充值
 */
export async function rechargeAgent(agentId: number, amount: number) {
  return api.post<ApiResponse<void>>(`/open/app/agent/${agentId}/recharge`, { amount });
}

/**
 * 调整代理商额度
 */
export async function adjustAgentQuota(agentId: number, quota: number) {
  return api.post<ApiResponse<void>>(`/open/app/agent/${agentId}/quota`, { quota });
}

/**
 * 获取代理商列表
 */
export async function getAgentList(params: { page: number; pageSize: number; username?: string; status?: number }) {
  return api.get<ApiResponse<any>>('/open/app/agent/list', { params });
}

/**
 * 获取代理商详情
 */
export async function getAgentDetail(agentId: number) {
  return api.get<ApiResponse<any>>(`/open/app/agent/${agentId}`);
}

/**
 * 获取代理商统计信息
 */
export async function getAgentStatistics(agentId: number) {
  return api.get<ApiResponse<any>>(`/open/app/agent/${agentId}/statistics`);
}

/**
 * 创建代理商
 */
export async function createAgent(data: any) {
  return api.post<ApiResponse<any>>('/open/app/proxy/user/v2', data);
}

/**
 * 更新代理商信息
 */
export async function updateAgent(agentId: number, data: any) {
  return api.put<ApiResponse<any>>(`/open/app/agent/${agentId}`, data);
}

/**
 * 更新代理商状态
 */
export async function updateAgentStatus(agentId: number, status: number) {
  return api.put<ApiResponse<any>>(`/open/app/agent/${agentId}/status`, { status });
} 