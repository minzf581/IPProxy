import type { AgentInfo, AgentStatistics, CreateAgentForm, UpdateAgentForm, AgentUser } from '@/types/agent';
import type { BusinessResponse } from '@/types/business';
import axios from 'axios';
import { debug } from '@/utils/debug';
import { API_ROUTES, API_PREFIX } from '@/shared/routes';
import request from '@/utils/request';

const { dashboard: debugAgent } = debug;

// 创建代理商服务专用的 axios 实例
const agentApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 添加请求拦截器，用于调试
agentApi.interceptors.request.use((config) => {
  // 添加token
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // 调试日志
  debugAgent.info('Request:', {
    url: config.url,
    baseURL: config.baseURL,
    method: config.method,
    params: config.params,
    data: config.data
  });
  
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

export interface AgentListParams {
  page?: number;
  pageSize?: number;
  status?: 1 | 0;  // 使用数字类型
}

export interface AgentListResponse {
  total: number;
  list: AgentInfo[];
}

export async function getAgentList(params: AgentListParams = { page: 1, pageSize: 20 }): Promise<ApiResponse<AgentListResponse>> {
  try {
    console.log('获取代理商列表, 参数:', params);
    const response = await request.get<ApiResponse<AgentListResponse>>('/api/open/app/agent/list', { 
      params: {
        page: params.page || 1,
        pageSize: Math.min(params.pageSize || 20, 100),  // 限制最大为100条
        status: 1  // 固定为1，表示获取激活状态的代理商
      }
    });
    
    if (!response.data) {
      throw new Error('获取代理商列表失败');
    }
    
    return response.data;
  } catch (error) {
    console.error('获取代理商列表失败:', error);
    throw error;
  }
}

export async function getAgentById(agentId: number): Promise<AgentInfo> {
  debugAgent.info('Getting agent by id:', agentId);
  const response = await agentApi.get<ApiResponse<AgentInfo>>(
    API_ROUTES.AGENT.UPDATE.replace('{id}', String(agentId))
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
    API_ROUTES.AGENT.STATISTICS.replace('{id}', String(agentId))
  );
  debugAgent.info('Agent statistics response:', response.data);
  return response.data.data;
}

export async function createAgent(params: CreateAgentForm): Promise<ApiResponse<AgentInfo>> {
  try {
    debugAgent.info('Creating agent with params:', {
      ...params,
      password: '******' // 隐藏密码
    });

    const requestData = {
      username: params.username,
      password: params.password,
      ...(params.email ? { email: params.email } : {}),
      ...(params.remark ? { remark: params.remark } : {}),
      ...(params.balance ? { balance: params.balance } : { balance: 1000.0 }),
      ...(params.phone ? { phone: params.phone } : {}),
      status: params.status ? (params.status === 'active' ? 1 : 0) : 1
    };
    
    debugAgent.info('Sending create agent request:', {
      ...requestData,
      password: '******'
    });

    const response = await agentApi.post<ApiResponse<AgentInfo>>(
      '/api/open/app/proxy/user/v2',  // 使用新的API路径
      requestData
    );
    
    debugAgent.info('Create agent response:', response.data);

    if (!response.data) {
      throw new Error('API返回数据格式错误');
    }

    return response.data;
  } catch (error: any) {
    debugAgent.error('Failed to create agent:', error);
    if (error.response?.data) {
      debugAgent.error('API error response:', error.response.data);
      throw new Error(error.response.data.msg || '创建代理商失败');
    }
    throw error;
  }
}

export async function updateAgent(agentId: number, params: UpdateAgentForm): Promise<void> {
  debugAgent.info('Updating agent:', { agentId, params });
  const response = await agentApi.put<ApiResponse<void>>(
    API_ROUTES.AGENT.UPDATE.replace('{id}', String(agentId)),
    params
  );
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
  const response = await agentApi.get<ApiResponse<{ list: AgentOrder[]; total: number }>>(
    API_ROUTES.AGENT.ORDERS,
    {
      params: {
        agentId: params.agentId,
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        startDate: params.startDate,
        endDate: params.endDate
      }
    }
  );
  debugAgent.info('Agent orders response:', response.data);
  return response.data;
}

export async function getAgentUsers(params: {
  agentId: number;
  page: number;
  pageSize: number;
  status?: string;
}): Promise<{ list: AgentUser[]; total: number }> {
  debugAgent.info('Getting agent users:', params);
  const response = await agentApi.get<ApiResponse<{ list: AgentUser[]; total: number }>>(
    API_ROUTES.AGENT.USERS.replace('{id}', String(params.agentId)),
    {
      params: {
        page: params.page || 1,
        pageSize: Math.min(params.pageSize || 10, 100),  // 限制最大为100
        status: params.status
      }
    }
  );
  debugAgent.info('Agent users response:', response.data);
  if (response.data.code === 0 && response.data.data) {
    return response.data.data;
  }
  debugAgent.warn('Invalid response format or error:', response.data);
  return { list: [], total: 0 };
}

export async function updateAgentStatus(agentId: string, status: string): Promise<ApiResponse<AgentInfo>> {
  try {
    const response = await request.put<ApiResponse<AgentInfo>>(
      `${API_PREFIX.OPEN}/app/agent/${agentId}/status`,
      null,
      { params: { status } }
    );
    return response.data;
  } catch (error) {
    console.error('更新代理商状态失败:', error);
    throw error;
  }
}

export async function rechargeAgent(agentId: number, amount: number): Promise<ApiResponse<void>> {
  debugAgent.info('Recharging agent:', { agentId, amount });
  const response = await agentApi.post<ApiResponse<void>>(
    `/api/open/app/agent/${agentId}/recharge`,
    { amount }
  );
  debugAgent.info('Recharge response:', response.data);
  return response.data;
}

export async function adjustAgentQuota(agentId: number, quota: number): Promise<ApiResponse<void>> {
  debugAgent.info('Adjusting agent quota:', { agentId, quota });
  const response = await agentApi.post<ApiResponse<void>>(
    `/api/open/app/agent/${agentId}/quota`,
    { quota }
  );
  debugAgent.info('Adjust quota response:', response.data);
  return response.data;
}

export async function adjustAgentBalance(agentId: number, amount: number, remark: string): Promise<ApiResponse<void>> {
  try {
    debugAgent.info('调整代理商额度:', { agentId, amount, remark });
    const response = await request.post<ApiResponse<void>>(
      `/api/open/app/agent/${agentId}/balance`,
      { amount, remark }
    );
    debugAgent.info('调整额度响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('调整代理商额度失败:', error);
    throw error;
  }
}

export async function createProxyUser(data: {
  appUsername: string;
  limitFlow: number;
  remark: string;
}): Promise<BusinessResponse> {
  return request(`${API_PREFIX.BUSINESS}/dynamic-proxy/create-user`, {
    method: 'POST',
    data
  });
}
