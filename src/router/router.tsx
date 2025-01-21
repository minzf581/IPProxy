import React from 'react';
import { RouteObject, createBrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import DynamicIP from '@/pages/IP/Dynamic';
import StaticIP from '@/pages/IP/Static';
import DynamicOrders from '@/pages/Order/dynamic';
import StaticOrders from '@/pages/Order/static';
import AgentOrders from '@/pages/Order/agent-orders';
import AgentManagement from '@/pages/agents';
import UserManagement from '@/pages/users';
import Settings from '@/pages/Settings';
import ChangePassword from '@/pages/Settings/ChangePassword';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
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
        path: 'ip',
        children: [
          {
            path: 'dynamic',
            element: <DynamicIP />,
          },
          {
            path: 'static',
            element: <StaticIP />,
          },
        ],
      },
      {
        path: 'order',
        children: [
          {
            path: 'dynamic',
            element: <DynamicOrders />,
          },
          {
            path: 'static',
            element: <StaticOrders />,
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
            path: 'user',
            element: <UserManagement />,
          },
        ],
      },
      {
        path: 'system',
        element: <Settings />,
      },
      {
        path: 'settings/change-password',
        element: <ChangePassword />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
];

const router = createBrowserRouter(routes);

export default router;