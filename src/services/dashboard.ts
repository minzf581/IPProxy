import axios from 'axios';

const api = axios.create({
  baseURL: '',  // 使用相对路径，让 Vite 代理处理
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json;charset=UTF-8'
  }
});

export interface DashboardData {
  total_consumption: number;
  total_recharge: number;
  balance: number;
  month_recharge: number;
  month_consumption: number;
  last_month_consumption: number;
  dynamic_resources: Array<{
    title: string;
    total: string;
    used: string;
    today: string;
    lastMonth: string;
    percentage: number;
  }>;
  static_resources: Array<{
    title: string;
    total: string;
    used: string;
    today: string;
    lastMonth: string;
    available: string;
    percentage: number;
  }>;
}

export const getDashboardData = async (signal?: AbortSignal): Promise<DashboardData> => {
  try {
    const response = await api.get('/statistics', {
      signal
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.name === 'CanceledError') {
      // 请求被取消，不需要处理
      return Promise.reject(error);
    }
    console.error('Error in getDashboardData:', error);
    throw error;
  }
};
