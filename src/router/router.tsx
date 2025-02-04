import React from 'react';
import { RouteObject, createBrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import StaticOrderPage from '@/pages/order/static';
import AgentOrders from '@/pages/order/agent-orders';
import AgentManagement from '@/pages/agents';
import UserManagement from '@/pages/users';
import AuthGuard, { PublicRoute } from '@/components/AuthGuard';
import AgentTransactions from '@/pages/agent/transactions';
import { Spin } from 'antd';
import ErrorBoundary from '@/components/ErrorBoundary';
import SettingsPage from '@/pages/settings.tsx';
import StaticRenewalPage from '@/pages/static-renewal';
import DynamicOrderList from '@/pages/orders/components/DynamicOrderList';

// 路由配置选项
const routerOptions = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

// 加载中组件
const LoadingComponent = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: '20px' 
  }}>
    <Spin size="large" tip="加载中..." />
  </div>
);

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Router Debug]', ...args);
    }
  }
};

// 创建路由配置
const createRoutes = () => {
  // 管理员路由
  const adminRoutes: RouteObject[] = [
    {
      path: '',
      element: <Dashboard />,
    },
    {
      path: 'dashboard',
      element: <Dashboard />,
    },
    {
      path: 'account',
      children: [
        {
          path: 'agent',
          element: <AgentManagement />,
        },
        {
          path: 'users',
          element: <UserManagement />,
        },
      ],
    },
    {
      path: 'order',
      children: [
        {
          path: 'dynamic',
          element: <DynamicOrderList />,
        },
        {
          path: 'static',
          element: <StaticOrderPage />,
        },
        {
          path: 'agent',
          element: <AgentOrders />,
        },
      ],
    },
    {
      path: 'static-renewal',
      element: (
        <ErrorBoundary>
          <StaticRenewalPage />
        </ErrorBoundary>
      ),
    },
    {
      path: 'settings',
      element: (
        <ErrorBoundary>
          <SettingsPage />
        </ErrorBoundary>
      ),
    },
  ];

  // 代理商路由
  const agentRoutes: RouteObject[] = [
    {
      path: '',
      element: <Dashboard />,
    },
    {
      path: 'dashboard',
      element: <Dashboard />,
    },
    {
      path: 'users',
      element: <UserManagement />,
    },
    {
      path: 'order',
      children: [
        {
          path: 'dynamic',
          element: <DynamicOrderList />,
        },
        {
          path: 'static',
          element: <StaticOrderPage />,
        },
        {
          path: 'balance',
          element: <AgentTransactions />,
        },
      ],
    },
    {
      path: 'static-renewal',
      element: (
        <ErrorBoundary>
          <StaticRenewalPage />
        </ErrorBoundary>
      ),
    },
    {
      path: 'settings',
      element: (
        <ErrorBoundary>
          <SettingsPage />
        </ErrorBoundary>
      ),
    },
  ];

  return { adminRoutes, agentRoutes };
};

// 创建路由器
const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthGuard><Layout /></AuthGuard>,
    children: [...createRoutes().adminRoutes, ...createRoutes().agentRoutes],
    errorElement: <ErrorBoundary><div>页面加载失败</div></ErrorBoundary>,
  },
  {
    path: '/login',
    element: <PublicRoute><Login /></PublicRoute>,
  },
], routerOptions);

export default router;