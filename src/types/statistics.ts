export interface StatisticsData {
  totalRecharge: number;
  totalConsumption: number;
  balance: number;
  monthlyRecharge: number;
  monthlyConsumption: number;
  lastMonthConsumption: number;
}

export interface AgentStatistics extends StatisticsData {
  userCount: number;
  activeUserCount: number;
}

export interface UserStatistics extends StatisticsData {
  dynamicOrderCount: number;
  staticOrderCount: number;
  activeOrderCount: number;
} 