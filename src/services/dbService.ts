import { request } from '@/utils/request';
import type { User } from '@/types/user';

export interface LoginResponse {
  token: string;
  user: User;
}

export interface StatisticsData {
  totalRecharge: number;
  totalConsumption: number;
  balance: number;
  monthlyRecharge: number;
  monthlyConsumption: number;
  lastMonthConsumption: number;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await request.post('/auth/login', { username, password });
  return response as LoginResponse;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await request.get('/auth/current-user');
  return response as User;
};

export const getStatistics = async (): Promise<StatisticsData> => {
  const response = await request.get('/statistics');
  return response as StatisticsData;
};
