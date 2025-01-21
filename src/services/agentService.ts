import type { AgentInfo, AgentStatistics } from '@/types/agent';
import { request } from '@/utils/request';

interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export async function getAgentList(params: { page: number; pageSize: number; status?: string }) {
  const response = await request.get<ApiResponse<{ list: AgentInfo[]; total: number }>>('/agent/list', { params });
  if (response.data.code !== 200) {
    throw new Error(response.data.msg);
  }
  return response.data.data;
}

export async function getAgentById(agentId: number): Promise<AgentInfo> {
  const response = await request.get<ApiResponse<AgentInfo>>(`/agent/${agentId}`);
  if (response.data.code !== 200) {
    throw new Error(response.data.msg);
  }
  if (!response.data.data) {
    throw new Error('Agent not found');
  }
  return response.data.data;
}

export async function getAgentStatistics(agentId: number): Promise<AgentStatistics> {
  const response = await request.get<ApiResponse<AgentStatistics>>(`/agent/${agentId}/statistics`);
  if (response.data.code !== 200) {
    throw new Error(response.data.msg);
  }
  return response.data.data;
}

export async function createAgent(params: {
  name: string;
  email: string;
  password: string;
}): Promise<AgentInfo> {
  const response = await request.post<ApiResponse<AgentInfo>>('/agent', params);
  if (response.data.code !== 200) {
    throw new Error(response.data.msg);
  }
  return response.data.data;
}

export async function updateAgent(agentId: number, params: Partial<AgentInfo>): Promise<void> {
  const response = await request.put<ApiResponse<void>>(`/agent/${agentId}`, params);
  if (response.data.code !== 200) {
    throw new Error(response.data.msg);
  }
}

export async function getAgentOrders(params: {
  agentId: number;
  page: number;
  pageSize: number;
  status?: string;
}) {
  const response = await request.get<ApiResponse<{ list: any[]; total: number }>>(`/agent/${params.agentId}/orders`, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
    },
  });
  if (response.data.code !== 200) {
    throw new Error(response.data.msg);
  }
  return response.data.data;
}

export async function getAgentUsers(params: {
  agentId: number;
  page: number;
  pageSize: number;
  status?: string;
}) {
  const response = await request.get<ApiResponse<{ list: any[]; total: number }>>(`/agent/${params.agentId}/users`, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
    },
  });
  if (response.data.code !== 200) {
    throw new Error(response.data.msg);
  }
  return response.data.data;
}
