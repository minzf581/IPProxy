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

export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    console.log('Starting getDashboardData');
    const response = await api.get('/api/dashboard/db');
    console.log('Dashboard data response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        code: error.code,
        config: error.config
      });
    }
    throw error;
  }
};
