import React from 'react';
import { RouteObject, createBrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import DynamicOrderPage from '@/pages/Order/dynamic';
import StaticOrderPage from '@/pages/Order/static';
import AgentOrders from '@/pages/Order/agent-orders';
import AgentManagement from '@/pages/agents';
import UserManagement from '@/pages/users';
import SettingsPage from '@/pages/Settings/index';
import AuthGuard, { PublicRoute } from '@/components/AuthGuard';

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    console.log('[Router Debug]', ...args);
  }
};

const routes: RouteObject[] = [
  {
    path: '/',
    element: <AuthGuard><Layout /></AuthGuard>,
    children: [
      {
        path: '',
        element: <Dashboard />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'order',
        children: [
          {
            path: 'dynamic',
            element: <DynamicOrderPage />,
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
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <PublicRoute><Login /></PublicRoute>,
  },
];

debug.log('Creating router with routes:', routes);
const router = createBrowserRouter(routes);

export default router;