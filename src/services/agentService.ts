import type { AgentInfo, AgentStatistics, CreateAgentForm, UpdateAgentForm } from '@/types/agent';
import { api } from '@/utils/request';
import { debug } from '@/utils/debug';

const { dashboard: debugAgent } = debug;

interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export async function getAgentList(params: { page: number; pageSize: number; status?: string }) {
  debugAgent.info('Getting agent list with params:', params);
  const response = await api.get<ApiResponse<{ list: AgentInfo[]; total: number }>>('/api/open/app/agent/list', { params });
  debugAgent.info('Agent list response:', response.data);
  return response.data.data;
}

export async function getAgentById(agentId: number): Promise<AgentInfo> {
  debugAgent.info('Getting agent by id:', agentId);
  const response = await api.get<ApiResponse<AgentInfo>>(`/api/open/app/agent/${agentId}`);
  debugAgent.info('Agent details response:', response.data);
  if (!response.data.data) {
    throw new Error('Agent not found');
  }
  return response.data.data;
}

export async function getAgentStatistics(agentId: number): Promise<AgentStatistics> {
  debugAgent.info('Getting agent statistics for id:', agentId);
  const response = await api.get<ApiResponse<AgentStatistics>>(`/api/open/app/agent/${agentId}/statistics`);
  debugAgent.info('Agent statistics response:', response.data);
  return response.data.data;
}

export async function createAgent(params: CreateAgentForm): Promise<AgentInfo> {
  debugAgent.info('Creating new agent:', params);
  const response = await api.post<ApiResponse<AgentInfo>>('/api/open/app/proxy/user/v2', {
    appUsername: params.username,
    password: params.password,
    balance: params.balance,
    contact: params.contact,
    remark: params.remark,
    status: 'active',
    limitFlow: 1000
  });
  debugAgent.info('Create agent response:', response.data);
  return response.data.data;
}

export async function updateAgent(agentId: number, params: UpdateAgentForm): Promise<void> {
  debugAgent.info('Updating agent:', { agentId, params });
  const response = await api.put<ApiResponse<void>>(`/api/open/app/agent/${agentId}`, params);
  debugAgent.info('Update agent response:', response.data);
}

export async function getAgentOrders(params: {
  agentId: number;
  page: number;
  pageSize: number;
  status?: string;
}) {
  debugAgent.info('Getting agent orders:', params);
  const response = await api.get<ApiResponse<{ list: any[]; total: number }>>(`/api/open/app/agent/${params.agentId}/orders`, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
    },
  });
  debugAgent.info('Agent orders response:', response.data);
  return response.data.data;
}

export async function getAgentUsers(params: {
  agentId: number;
  page: number;
  pageSize: number;
  status?: string;
}) {
  debugAgent.info('Getting agent users:', params);
  const response = await api.get<ApiResponse<{ list: any[]; total: number }>>(`/api/open/app/agent/${params.agentId}/users`, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
    },
  });
  debugAgent.info('Agent users response:', response.data);
  return response.data.data;
}

export async function updateAgentStatus(agentId: number, status: string): Promise<ApiResponse<AgentInfo>> {
  const { data } = await api.put<ApiResponse<AgentInfo>>(`/api/open/app/agent/${agentId}/status`, null, {
    params: { status }
  });
  return data;
}
