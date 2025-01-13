import ipProxyAPI from '../utils/ipProxyAPI';
import { ProxyBalanceInfo } from '../utils/ipProxyAPI';
import { initializeMainUser, getMainUser } from './mainUser';
import dayjs from 'dayjs';
import pool from '../utils/db';

export interface StatisticsData {
  totalRecharge: number;
  totalConsumption: number;
  balance: number;
  monthlyRecharge: number;
  monthlyConsumption: number;
  lastMonthConsumption: number;
}

export interface OrderInstance {
  amount: number;
  createTime: string;
}

export interface FlowUsageRecord {
  usedFlow: number;
}

async function createMainUser() {
  try {
    const mainUser = await ipProxyAPI.createMainUser({
      phone: '13800138000',
      email: 'admin@example.com',
      authType: 2, // 个人实名
      authName: 'Admin User',
      no: 'ADMIN001',
      status: 1  // 正常状态
    });
    console.log('Main user created:', mainUser);
    return mainUser;
  } catch (error) {
    console.error('Failed to create main user:', error);
    throw error;
  }
}

export async function getStatistics(): Promise<StatisticsData> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 获取总充值金额
    const [totalRecharge] = await conn.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM recharge_records WHERE status = "SUCCESS"'
    );

    // 获取总消费金额
    const [totalConsumption] = await conn.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM consumption_records'
    );

    // 获取当前余额
    const [balance] = await conn.query(
      'SELECT COALESCE(SUM(balance), 0) as total FROM users'
    );

    // 获取本月充值
    const [monthlyRecharge] = await conn.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM recharge_records WHERE status = "SUCCESS" AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())'
    );

    // 获取本月消费
    const [monthlyConsumption] = await conn.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM consumption_records WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())'
    );

    // 获取上月消费
    const [lastMonthConsumption] = await conn.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM consumption_records WHERE MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))'
    );

    await conn.commit();

    return {
      totalRecharge: totalRecharge[0].total,
      totalConsumption: totalConsumption[0].total,
      balance: balance[0].total,
      monthlyRecharge: monthlyRecharge[0].total,
      monthlyConsumption: monthlyConsumption[0].total,
      lastMonthConsumption: lastMonthConsumption[0].total
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

// 保留API调用的代码，但暂时不使用
export async function getStatisticsFromAPI(): Promise<StatisticsData> {
  try {
    // 确保主账号已初始化
    const mainUser = await initializeMainUser();

    const now = dayjs();
    const startOfMonth = now.startOf('month').format('YYYY-MM-DD');
    const endOfMonth = now.endOf('month').format('YYYY-MM-DD');
    const startOfLastMonth = now.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
    const endOfLastMonth = now.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

    // 获取动态代理余额信息
    const dynamicProxyInfo = await ipProxyAPI.getProxyBalance(
      104,
      'PROXY_DYNAMIC',
      mainUser.username,
      mainUser.appUsername
    );

    // 获取本月流量使用记录
    const currentMonthUsage = await ipProxyAPI.getFlowUsage({
      appUsername: mainUser.appUsername,
      username: mainUser.username,
      startTime: startOfMonth,
      endTime: endOfMonth,
      page: 1,
      pageSize: 31
    });

    // 获取上月流量使用记录
    const lastMonthUsage = await ipProxyAPI.getFlowUsage({
      appUsername: mainUser.appUsername,
      username: mainUser.username,
      startTime: startOfLastMonth,
      endTime: endOfLastMonth,
      page: 1,
      pageSize: 31
    });

    // 获取订单信息
    const orders = await ipProxyAPI.getOrderInfo('', 1, 100);

    // 计算统计数据
    const totalRecharge = orders?.instances?.reduce((acc: number, order: OrderInstance) => acc + (order.amount || 0), 0) || 0;
    const totalConsumption = (currentMonthUsage?.list || []).reduce((acc: number, usage: FlowUsageRecord) => acc + (usage.usedFlow || 0), 0) + 
                           (lastMonthUsage?.list || []).reduce((acc: number, usage: FlowUsageRecord) => acc + (usage.usedFlow || 0), 0);
    const balance = dynamicProxyInfo?.balance || 0;
    
    const monthlyRecharge = orders?.instances
      ?.filter((order: OrderInstance) => {
        const orderDate = order.createTime;
        return orderDate >= startOfMonth && orderDate <= endOfMonth;
      })
      .reduce((acc: number, order: OrderInstance) => acc + (order.amount || 0), 0) || 0;
      
    const monthlyConsumption = (currentMonthUsage?.list || []).reduce((acc: number, usage: FlowUsageRecord) => acc + (usage.usedFlow || 0), 0);
    const lastMonthConsumption = (lastMonthUsage?.list || []).reduce((acc: number, usage: FlowUsageRecord) => acc + (usage.usedFlow || 0), 0);

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
}