import { useState, useEffect } from 'react';
import { statisticsAPI } from '../services/api';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ResourceUsageStats {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  peakUsage: number;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: {
    [key: string]: number;
  };
}

export interface SystemStats {
  cpuUsage: number;
  memoryUsage: number;
  networkBandwidth: number;
  activeConnections: number;
}

export function useResourceUsage(dateRange: DateRange, resourceType: 'dynamic' | 'static') {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ResourceUsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await statisticsAPI.getResourceUsage({
          ...dateRange,
          resourceType
        });
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange.startDate, dateRange.endDate, resourceType]);

  return { stats, loading, error };
}

export function useOrderStatistics(dateRange: DateRange, orderType: 'dynamic' | 'static') {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await statisticsAPI.getOrderStats({
          ...dateRange,
          orderType
        });
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange.startDate, dateRange.endDate, orderType]);

  return { stats, loading, error };
}

export function useSystemStats() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await statisticsAPI.getSystemStats();
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // 每30秒更新一次系统状态
    fetchStats();
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
}
