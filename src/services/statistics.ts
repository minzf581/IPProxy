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

export const getStatistics = async (): Promise<StatisticsData> => {
  try {
    const now = dayjs();
    const startOfMonth = now.startOf('month').format('YYYY-MM-DD');
    const endOfMonth = now.endOf('month').format('YYYY-MM-DD');
    const startOfLastMonth = now.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
    const endOfLastMonth = now.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

    // 获取动态代理余额信息
    const dynamicProxyInfo = await ipProxyAPI.getProxyBalance(104, 'PROXY_DYNAMIC');
    
    // 获取本月流量使用记录
    const currentMonthUsage = await ipProxyAPI.getFlowUsage(
      startOfMonth,
      endOfMonth,
      1,
      31
    );

    // 获取上月流量使用记录
    const lastMonthUsage = await ipProxyAPI.getFlowUsage(
      startOfLastMonth,
      endOfLastMonth,
      1,
      31
    );

    // 获取订单信息
    const orders = await ipProxyAPI.getOrderInfo('', 1, 100);

    // 计算统计数据
    const totalRecharge = orders.reduce((acc, order) => acc + order.amount, 0);
    const totalConsumption = currentMonthUsage.reduce((acc, usage) => acc + usage.amount, 0) + lastMonthUsage.reduce((acc, usage) => acc + usage.amount, 0);
    const balance = dynamicProxyInfo.balance;
    const monthlyRecharge = orders.filter(order => order.date >= startOfMonth && order.date <= endOfMonth).reduce((acc, order) => acc + order.amount, 0);
    const monthlyConsumption = currentMonthUsage.reduce((acc, usage) => acc + usage.amount, 0);
    const lastMonthConsumption = lastMonthUsage.reduce((acc, usage) => acc + usage.amount, 0);

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