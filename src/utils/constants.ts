export const ORDER_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
} as const;

export const ORDER_STATUS_MAP = {
  [ORDER_STATUS.ACTIVE]: '使用中',
  [ORDER_STATUS.EXPIRED]: '已过期',
} as const;

export const ORDER_STATUS_COLOR = {
  [ORDER_STATUS.ACTIVE]: '#52c41a',
  [ORDER_STATUS.EXPIRED]: '#d9d9d9',
} as const;

export const USER_ROLE = {
  ADMIN: 'admin',
  AGENT: 'agent',
  USER: 'user',
} as const;

export const USER_ROLE_MAP = {
  [USER_ROLE.ADMIN]: '管理员',
  [USER_ROLE.AGENT]: '代理商',
  [USER_ROLE.USER]: '用户',
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
} as const;

export const USER_STATUS_MAP = {
  [USER_STATUS.ACTIVE]: '正常',
  [USER_STATUS.DISABLED]: '禁用',
} as const;

export const USER_STATUS_COLOR = {
  [USER_STATUS.ACTIVE]: '#52c41a',
  [USER_STATUS.DISABLED]: '#ff4d4f',
} as const; 