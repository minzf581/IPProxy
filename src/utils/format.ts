import { 
  ORDER_STATUS_MAP, 
  USER_ROLE_MAP, 
  USER_STATUS_MAP 
} from './constants';

interface StatusMap {
  [key: string]: string;
}

const ORDER_STATUS: StatusMap = ORDER_STATUS_MAP;
const USER_ROLE: StatusMap = USER_ROLE_MAP;
const USER_STATUS: StatusMap = USER_STATUS_MAP;

/**
 * 格式化数字为千分位格式
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN');
};

/**
 * 格式化流量大小
 */
export const formatTraffic = (gb: number): string => {
  return `${gb}GB`;
};

/**
 * 格式化金额
 */
export const formatMoney = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const formatOrderStatus = (status: string): string => {
  return ORDER_STATUS[status] || status;
};

export const formatUserRole = (role: string): string => {
  return USER_ROLE[role] || role;
};

export const formatUserStatus = (status: string): string => {
  return USER_STATUS[status] || status;
};

export const formatPercent = (num: number): string => {
  return `${(num * 100).toFixed(2)}%`;
};

/**
 * 格式化字节大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
