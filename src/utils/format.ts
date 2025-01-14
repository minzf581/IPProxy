import { 
  ORDER_STATUS_MAP, 
  USER_ROLE_MAP, 
  USER_STATUS_MAP 
} from './constants';

export const formatMoney = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const formatOrderStatus = (status: string): string => {
  return ORDER_STATUS_MAP[status] || status;
};

export const formatUserRole = (role: string): string => {
  return USER_ROLE_MAP[role] || role;
};

export const formatUserStatus = (status: string): string => {
  return USER_STATUS_MAP[status] || status;
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

export const formatPercent = (num: number): string => {
  return `${(num * 100).toFixed(2)}%`;
};
