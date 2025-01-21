import { message } from 'antd';

// 模拟数据
const mockUsers = Array(100).fill(null).map((_, index) => ({
  id: `${index + 1}`,
  username: `user${index + 1}`,
  email: `user${index + 1}@example.com`,
  status: Math.random() > 0.3 ? 'active' : 'inactive',
  role: ['普通用户', 'VIP用户'][Math.floor(Math.random() * 2)],
  balance: Math.floor(Math.random() * 10000) / 100,
  lastLoginTime: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
  createTime: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString(),
}));

export async function getUserList(params: any) {
  const { current = 1, pageSize = 10, username, email, status, role, dateRange } = params;
  
  // 过滤数据
  let filteredUsers = [...mockUsers];
  
  if (username) {
    filteredUsers = filteredUsers.filter(user => user.username.includes(username));
  }
  
  if (email) {
    filteredUsers = filteredUsers.filter(user => user.email.includes(email));
  }
  
  if (status) {
    filteredUsers = filteredUsers.filter(user => user.status === status);
  }
  
  if (role) {
    filteredUsers = filteredUsers.filter(user => user.role === role);
  }
  
  if (dateRange) {
    const [start, end] = dateRange;
    filteredUsers = filteredUsers.filter(user => {
      const createTime = new Date(user.createTime);
      return createTime >= start && createTime <= end;
    });
  }
  
  // 分页
  const total = filteredUsers.length;
  const data = filteredUsers.slice((current - 1) * pageSize, current * pageSize);
  
  return {
    data,
    total,
    current,
    pageSize,
  };
}

export async function createUser(userData: any) {
  const newUser = {
    id: `${mockUsers.length + 1}`,
    ...userData,
    createTime: new Date().toISOString(),
    lastLoginTime: null,
  };
  mockUsers.push(newUser);
  return newUser;
}

export async function updateUser(userId: string, userData: any) {
  const index = mockUsers.findIndex(user => user.id === userId);
  if (index === -1) {
    throw new Error('用户不存在');
  }
  mockUsers[index] = { ...mockUsers[index], ...userData };
  return mockUsers[index];
}

export async function deleteUser(userId: string) {
  const index = mockUsers.findIndex(user => user.id === userId);
  if (index === -1) {
    throw new Error('用户不存在');
  }
  mockUsers.splice(index, 1);
  return true;
}

export async function updateUserBalance(userId: string, amount: number) {
  const user = mockUsers.find(user => user.id === userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  user.balance = Number((user.balance + amount).toFixed(2));
  return user;
}

export async function updateUserPassword(userId: string, oldPassword: string, newPassword: string) {
  const user = mockUsers.find(user => user.id === userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  // 在实际应用中，这里需要验证旧密码
  return true;
} 