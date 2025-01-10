export interface StatCardData {
  title: string;
  amount: number;
  icon?: React.ReactNode;
}

export interface ResourceUsageData {
  title: string;
  percentage: number;
  total: string;
  current: string;
  lastMonth: string;
  today: string;
}

export interface StaticResourceData {
  title: string;
  percentage: number;
  total: number;
  currentMonth: number;
  lastMonth: number;
  available: number;
  expired: number;
} 