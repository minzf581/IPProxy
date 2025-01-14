export type Status = 'active' | 'disabled';

export type Role = 'admin' | 'agent' | 'user';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface MenuItem {
  key: string;
  icon?: React.ReactNode;
  label: string;
  children?: MenuItem[];
  hidden?: boolean;
} 