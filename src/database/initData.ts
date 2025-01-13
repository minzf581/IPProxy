import db from './index';
import { hashPassword } from '@/utils/crypto';

export async function initializeDatabase() {
  // 检查是否已经初始化
  const userCount = await db.users.count();
  if (userCount > 0) {
    console.log('Database already initialized');
    return;
  }

  console.log('Initializing database...');

  const now = new Date();
  const hashedPassword = await hashPassword('admin123');

  // 创建默认管理员用户
  const adminUserId = await db.users.add({
    username: 'admin',
    password: hashedPassword,
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    balance: 1000,
    createdAt: now,
    updatedAt: now
  });

  // 创建默认代理商
  const defaultAgentId = await db.agents.add({
    name: 'Default Agent',
    email: 'agent@example.com',
    password: hashedPassword,
    status: 'active',
    balance: 1000,
    createdAt: now,
    updatedAt: now
  });

  // 创建示例用户
  const demoUserId = await db.users.add({
    username: 'demo',
    password: hashedPassword,
    email: 'demo@example.com',
    role: 'user',
    agentId: defaultAgentId,
    status: 'active',
    balance: 500,
    createdAt: now,
    updatedAt: now
  });

  // 创建默认系统设置
  await db.settings.bulkAdd([
    {
      key: 'system.name',
      value: 'IP Proxy System',
      createdAt: now,
      updatedAt: now
    },
    {
      key: 'system.logo',
      value: '/logo.png',
      createdAt: now,
      updatedAt: now
    },
    {
      key: 'system.description',
      value: 'IP Proxy Management System',
      createdAt: now,
      updatedAt: now
    }
  ]);

  // 创建示例资源
  const dynamicResourceId = await db.resources.add({
    type: 'dynamic',
    name: 'Dynamic Proxy',
    description: 'Dynamic IP proxy service',
    price: 10,
    status: 'active',
    createdAt: now,
    updatedAt: now
  });

  const staticResourceId = await db.resources.add({
    type: 'static',
    name: 'Static Proxy',
    description: 'Static IP proxy service',
    price: 5,
    status: 'active',
    createdAt: now,
    updatedAt: now
  });

  // 创建示例订单
  await db.orders.bulkAdd([
    {
      userId: demoUserId,
      agentId: defaultAgentId,
      resourceId: dynamicResourceId,
      type: 'dynamic',
      status: 'active',
      duration: 30,
      price: 10,
      createdAt: now,
      updatedAt: now
    },
    {
      userId: demoUserId,
      agentId: defaultAgentId,
      resourceId: staticResourceId,
      type: 'static',
      status: 'active',
      quantity: 5,
      price: 25,
      createdAt: now,
      updatedAt: now
    }
  ]);

  // 创建示例交易记录
  await db.transactions.bulkAdd([
    {
      userId: demoUserId,
      agentId: defaultAgentId,
      type: 'recharge',
      amount: 700,
      balance: 700,
      description: 'Initial recharge',
      createdAt: now
    },
    {
      userId: demoUserId,
      agentId: defaultAgentId,
      type: 'consumption',
      amount: -150,
      balance: 550,
      description: 'Order payment',
      createdAt: now
    }
  ]);

  console.log('Database initialized successfully');
}
