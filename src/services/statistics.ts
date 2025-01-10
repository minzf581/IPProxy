import { ipProxyAPI } from '@/utils/ipProxyAPI';
import dayjs from 'dayjs';

export interface StatisticsData {
  totalRecharge: number;
  totalConsumption: number;
  balance: number;
  monthlyRecharge: number;
  monthlyConsumption: number;
  lastMonthConsumption: number;
}

export const createMainUser = async () => {
  try {
    const response = await ipProxyAPI.createUser({
      appUsername: 'admin',
      password: 'admin123',  // Using a stronger password
      authName: 'admin',     // Using admin as authName
      no: 'ADMIN001'         // Using a unique identifier
    });
    console.log('Main user created successfully:', response);
    return response;
  } catch (error: any) {
    // Check if error is due to user already existing
    if (error?.message?.includes('already exists')) {
      console.log('Main user already exists');
      return;
    }
    console.error('Failed to create main user:', error);
    throw error;
  }
};

export const getStatistics = async (): Promise<StatisticsData> => {
  try {
    const now = dayjs();
    const startOfMonth = now.startOf('month').format('YYYY-MM-DD');
    const endOfMonth = now.endOf('month').format('YYYY-MM-DD');
    const startOfLastMonth = now.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
    const endOfLastMonth = now.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

    // Try to create main user if not exists
    try {
      await createMainUser();
    } catch (error) {
      console.log('Error creating main user:', error);
      // Continue execution even if user creation fails
    }

    // 获取动态代理余额信息
    const dynamicProxyInfo = await ipProxyAPI.getProxyBalance(104, 'PROXY_DYNAMIC', 'admin', 'admin');
    
    // 获取本月流量使用记录
    const currentMonthUsage = await ipProxyAPI.getFlowUsage({
      appUsername: 'admin',
      username: 'admin',
      startTime: startOfMonth,
      endTime: endOfMonth,
      page: 1,
      pageSize: 31
    });

    // 获取上月流量使用记录
    const lastMonthUsage = await ipProxyAPI.getFlowUsage({
      appUsername: 'admin',
      username: 'admin',
      startTime: startOfLastMonth,
      endTime: endOfLastMonth,
      page: 1,
      pageSize: 31
    });

    // 获取订单信息
    const orders = await ipProxyAPI.getOrderInfo('', 1, 100);

    // 计算统计数据
    const totalRecharge = orders?.instances?.reduce((acc, order) => acc + (order.amount || 0), 0) || 0;
    const totalConsumption = (currentMonthUsage?.list || []).reduce((acc, usage) => acc + (usage.usedFlow || 0), 0) + 
                           (lastMonthUsage?.list || []).reduce((acc, usage) => acc + (usage.usedFlow || 0), 0);
    const balance = dynamicProxyInfo?.balance || 0;
    
    const monthlyRecharge = orders?.instances
      ?.filter(order => {
        const orderDate = order.createTime;
        return orderDate >= startOfMonth && orderDate <= endOfMonth;
      })
      .reduce((acc, order) => acc + (order.amount || 0), 0) || 0;
      
    const monthlyConsumption = (currentMonthUsage?.list || []).reduce((acc, usage) => acc + (usage.usedFlow || 0), 0);
    const lastMonthConsumption = (lastMonthUsage?.list || []).reduce((acc, usage) => acc + (usage.usedFlow || 0), 0);

    // 返回统计数据
    return {
      totalRecharge,
      totalConsumption,
      balance,
      monthlyRecharge,
      monthlyConsumption,
      lastMonthConsumption
    };
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    throw error;
  }
};