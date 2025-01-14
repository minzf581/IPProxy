export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  USER = 'user'
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface UserProfile extends User {
  balance: number;
  totalRecharge: number;
  totalConsumption: number;
}