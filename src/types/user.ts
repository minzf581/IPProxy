export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  USER = 'user'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  status: 'active' | 'disabled';
  email?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile extends User {
  balance: number;
  totalRecharge: number;
  totalConsumption: number;
}