import type { AgentInfo, AgentStatistics, CreateAgentForm, UpdateAgentForm } from '@/types/agent';
import axios from 'axios';
import { debug } from '@/utils/debug';
import { API_ROUTES } from '@/shared/routes';

const { dashboard: debugAgent } = debug;

// 创建代理商服务专用的 axios 实例
const agentApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 添加认证拦截器
agentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

interface AgentOrder {
  id: string;
  order_no: string;
  amount: number;
  status: string;
  type: 'dynamic' | 'static';
  remark?: string;
  created_at: string;
  updated_at: string;
}

export async function getAgentList(params: { page: number; pageSize: number; status?: string }) {
  debugAgent.info('Getting agent list with params:', params);
  const response = await agentApi.get<ApiResponse<{ list: AgentInfo[]; total: number }>>(
    '/open/app/agent/list',
    { params }
  );
  debugAgent.info('Agent list response:', response.data);
  return response.data.data;
}

export async function getAgentById(agentId: number): Promise<AgentInfo> {
  debugAgent.info('Getting agent by id:', agentId);
  const response = await agentApi.get<ApiResponse<AgentInfo>>(
    `/open/app/agent/${agentId}`
  );
  debugAgent.info('Agent details response:', response.data);
  if (!response.data.data) {
    throw new Error('Agent not found');
  }
  return response.data.data;
}

export async function getAgentStatistics(agentId: number): Promise<AgentStatistics> {
  debugAgent.info('Getting agent statistics for id:', agentId);
  const response = await agentApi.get<ApiResponse<AgentStatistics>>(
    `/open/app/agent/${agentId}/statistics`
  );
  debugAgent.info('Agent statistics response:', response.data);
  return response.data.data;
}

export async function createAgent(params: CreateAgentForm): Promise<AgentInfo> {
  debugAgent.info('Creating new agent:', params);
  const response = await agentApi.post<ApiResponse<AgentInfo>>(API_ROUTES.AGENT.CREATE, {
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
  const response = await agentApi.put<ApiResponse<void>>(API_ROUTES.AGENT.UPDATE.replace('{id}', String(agentId)), params);
  debugAgent.info('Update agent response:', response.data);
}

export async function getAgentOrders(params: {
  agentId: number;
  page: number;
  pageSize: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<{ list: AgentOrder[]; total: number }>> {
  debugAgent.info('Getting agent orders:', params);
  const response = await agentApi.get<ApiResponse<{ list: AgentOrder[]; total: number }>>(API_ROUTES.AGENT.ORDERS, {
    params: {
      agentId: params.agentId,
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
    },
  });
  debugAgent.info('Agent orders response:', response.data);
  return response.data;
}

export async function getAgentUsers(params: {
  agentId: number;
  page: number;
  pageSize: number;
  status?: string;
}) {
  debugAgent.info('Getting agent users:', params);
  const response = await agentApi.get<ApiResponse<{ list: any[]; total: number }>>(
    `/open/app/agent/${params.agentId}/users`,
    {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
      },
    }
  );
  debugAgent.info('Agent users response:', response.data);
  return response.data.data;
}

export async function updateAgentStatus(agentId: number, status: string): Promise<ApiResponse<AgentInfo>> {
  const { data } = await agentApi.put<ApiResponse<AgentInfo>>(
    `/open/app/agent/${agentId}/status`,
    null,
    { params: { status } }
  );
  return data;
}
