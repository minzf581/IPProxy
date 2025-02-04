import { api } from '@/utils/request';
import type { ApiResponse } from '@/types/api';

/**
 * 代理商充值
 */
export async function rechargeAgent(agentId: number, amount: number) {
  return api.post<ApiResponse<void>>(`/api/open/app/agent/${agentId}/recharge`, { amount });
}

/**
 * 调整代理商额度
 */
export async function adjustAgentQuota(agentId: number, quota: number) {
  return api.post<ApiResponse<void>>(`/api/open/app/agent/${agentId}/quota`, { quota });
} 