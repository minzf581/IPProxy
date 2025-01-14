import type { StatisticsData } from '../types/statistics';

export const mockService = {
  getStatistics: async (): Promise<StatisticsData> => {
    return {
      totalRecharge: 168880,
      totalConsumption: 17780,
      balance: 151100,
      monthlyRecharge: 28660,
      monthlyConsumption: 8520,
      lastMonthConsumption: 9260
    };
  },

  getDynamicProxies: async () => {
    return {
      list: [],
      total: 0
    };
  },

  getStaticOrders: async () => {
    return {
      data: [],
      total: 0
    };
  }
}; 