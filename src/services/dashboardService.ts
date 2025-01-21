// 统计数据接口
export interface Statistics {
  totalRecharge: number;    // 累计充值
  totalConsumption: number; // 累计消费
  balance: number;          // 剩余金额
  monthRecharge: number;    // 本月充值
  monthConsumption: number; // 本月消费
  lastMonthConsumption: number; // 上月消费
}

// 动态资源接口
export interface DynamicResource {
  id: string;
  name: string;           // 资源名称
  usageRate: number;      // 使用率
  total: number;          // 累计使用量(GB)
  monthly: number;        // 本月使用量(GB)
  today: number;          // 今日使用量(GB)
  lastMonth: number;      // 上月使用量(GB)
}

// 静态资源接口
export interface StaticResource {
  id: string;
  name: string;           // 资源名称
  usageRate: number;      // 使用率
  total: number;          // 累计开通数量
  monthly: number;        // 本月开通数量
  lastMonth: number;      // 上月开通数量
  available: number;      // 剩余可用数量
  expired: number;        // 已过期数量
}

// 仪表盘数据接口
export interface DashboardData {
  statistics: Statistics;
  dynamicResources: DynamicResource[];
  staticResources: StaticResource[];
}

// 获取仪表盘数据
export async function getDashboardData(): Promise<DashboardData> {
  try {
    const response = await fetch('/api/dashboard');
    if (!response.ok) {
      throw new Error('获取仪表盘数据失败');
    }
    return await response.json();
  } catch (error) {
    console.error('获取仪表盘数据错误:', error);
    throw error;
  }
}

// 格式化数字为千分位格式
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

// 格式化流量大小
export function formatTraffic(gb: number): string {
  return `${gb}G`;
}

// 格式化数量
export function formatCount(count: number): string {
  return `${count}条`;
}

// 格式化百分比
export function formatPercent(percent: number): string {
  return `${percent}%`;
} 