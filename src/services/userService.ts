/**
 * 用户服务模块
 * 
 * 此模块处理所有与用户相关的API请求，包括：
 * - 用户列表获取
 * - 用户状态管理
 * - 用户业务激活
 * 
 * 依赖说明：
 * - API基础配置：src/config/api.ts
 * - 类型定义：src/types/user.ts
 * - 工具函数：src/utils/request.ts
 * 
 * 后端对应：
 * - 路由：backend/app/routers/user.py
 * - 模型：backend/app/models/user.py
 */

import { api } from '@/utils/request';
import type { User, UserRole } from '@/types/user';
import type { ApiResponse } from '@/types/api';
import axios from 'axios';
import { API_ROUTES } from '@/shared/routes';

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[User Service Debug]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[User Service Error]', ...args);
  }
};

// 扩展 ApiResponse 接口
interface ExtendedApiResponse<T> extends ApiResponse<T> {
  msg?: string;
}

// 创建用户服务专用的 axios 实例
const userApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 添加认证拦截器
userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: UserRole;
  status?: string;
}

export interface UserListResponse {
  list: User[];
  total: number;
}

export async function getUserList(params: UserListParams): Promise<ApiResponse<UserListResponse>> {
  try {
    debug.log('Getting user list with params:', params);
    const response = await userApi.get<ApiResponse<UserListResponse>>('/user/list', { params });
    debug.log('User list response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

export interface CreateUserParams {
  username: string;
  password: string;
  email?: string;  // 可选字段
  remark?: string;  // 可选字段
  authType?: number;  // 可选字段，用于区分用户类型
  status?: string;  // 可选字段
  is_agent?: boolean;  // 是否是代理商
  agent_id?: number;  // 代理商ID
}

export async function createUser(data: CreateUserParams): Promise<ExtendedApiResponse<User>> {
  try {
    debug.log('Creating user with data:', {
      ...data,
      password: '******' // 隐藏密码
    });

    // 获取当前用户信息
    const token = localStorage.getItem('token');
    const currentUser = token ? JSON.parse(atob(token.split('.')[1])) : null;

    // 移除空值参数
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v != null && v !== '')
    );

    // 如果当前用户是代理商，自动添加代理商ID
    if (currentUser?.is_agent) {
      cleanData.agent_id = currentUser.id;
      cleanData.is_agent = false; // 代理商创建的用户默认不是代理商
    }

    debug.log('Cleaned data:', {
      ...cleanData,
      password: '******' // 隐藏密码
    });

    const response = await userApi.post<ExtendedApiResponse<User>>('/api/open/app/user/v2', cleanData);
    debug.log('Create user API response:', response.data);

    if (response.data.code !== 0) {
      debug.error('API error:', response.data.msg);
      throw new Error(response.data.msg || '创建用户失败');
    }

    return response.data;
  } catch (error: any) {
    debug.error('Failed to create user:', error);
    if (error.response) {
      debug.error('API error response:', error.response.data);
    }
    throw error;
  }
}

export async function updateUser(id: number, data: any): Promise<ApiResponse<User>> {
  try {
    debug.log('Updating user:', { id, data });
    const response = await userApi.put<ApiResponse<User>>(`/open/app/user/${id}`, data);
    debug.log('Update user response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

export async function updateUserStatus(id: number, status: string): Promise<ApiResponse<User>> {
  try {
    debug.log('Updating user status:', { id, status });
    const response = await userApi.put<ApiResponse<User>>(`/open/app/user/${id}/status`, { status });
    debug.log('Update user status response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

export async function deleteUser(id: number): Promise<ApiResponse<void>> {
  try {
    debug.log('Deleting user:', id);
    const response = await userApi.delete<ApiResponse<void>>(`/open/app/user/${id}`);
    debug.log('Delete user response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

export async function changeUserPassword(id: number, newPassword: string): Promise<ApiResponse<void>> {
  try {
    debug.log('Changing user password:', { id });
    const response = await userApi.post<ApiResponse<void>>(`/open/app/user/${id}/password`, {
      password: newPassword
    });
    debug.log('Change password response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

// 为了向后兼容，导出一个别名
export const updateUserPassword = changeUserPassword;

export async function activateBusinessUser(id: number): Promise<ApiResponse<void>> {
  try {
    debug.log('Activating business user:', id);
    const response = await userApi.post<ApiResponse<void>>(`/open/app/user/${id}/activate-business`);
    debug.log('Activate business response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

export async function deactivateBusinessUser(id: number): Promise<ApiResponse<void>> {
  try {
    debug.log('Deactivating business user:', id);
    const response = await userApi.post<ApiResponse<void>>(`/open/app/user/${id}/deactivate-business`);
    debug.log('Deactivate business response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

/**
 * 获取当前用户信息
 * 
 * 依赖说明：
 * - API路径: /auth/current-user
 * - 后端函数: get_user_profile (user.py)
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<ExtendedApiResponse<User>>('/auth/current-user');
  if (!response.data || response.data.code !== 0) {
    throw new Error(response.data?.msg || '获取用户信息失败');
  }
  return response.data.data;
}

// 获取代理商列表
export async function getAgentList(): Promise<User[]> {
  const response = await api.get<ApiResponse<User[]>>('/api/agent/list');
  return response.data.data;
}

// 搜索用户
export async function searchUsers(params: any): Promise<ApiResponse<UserListResponse>> {
  const response = await api.get<ApiResponse<UserListResponse>>('/open/app/user/list', { params });
  return response.data;
}

// 格式化数字为千分位格式
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

// 格式化流量大小
export function formatTraffic(gb: number): string {
  return `${gb}Gb`;
}

// 格式化数量
export function formatCount(count: number): string {
  return `${count}条`;
}

// 格式化百分比
export function formatPercent(percent: number): string {
  return `${percent}%`;
}

export interface AdjustBalanceParams {
  amount: number;
  remark: string;
}

export async function adjustUserBalance(userId: number, amount: number, remark: string): Promise<ApiResponse<User>> {
  try {
    debug.log('Adjusting user balance:', { userId, amount, remark });
    const response = await userApi.post<ApiResponse<User>>(`/open/app/user/${userId}/balance`, {
      amount,
      remark
    });
    debug.log('Adjust balance response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}
