import React from 'react';
import { createHashRouter } from 'react-router-dom';
import Dashboard from '../pages/dashboard';
import MainLayout from '../components/MainLayout';
import ErrorPage from '../pages/error';

// 懒加载其他页面组件
const AgentManagement = React.lazy(() => import('../pages/account/agents'));
const UserManagement = React.lazy(() => import('../pages/account/users'));
const AgentOrders = React.lazy(() => import('../pages/orders/agent'));
const UserDynamicOrders = React.lazy(() => import('../pages/orders/user/dynamic'));
const UserStaticOrders = React.lazy(() => import('../pages/orders/user/static'));
const IPManagement = React.lazy(() => import('../pages/static-ip/manage'));
const SystemSettings = React.lazy(() => import('../pages/settings/system'));

const router = createHashRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'account',
        children: [
          {
            path: 'agents',
            element: (
              <React.Suspense fallback={<div>Loading...</div>}>
                <AgentManagement />
              </React.Suspense>
            ),
          },
          {
            path: 'users',
            element: (
              <React.Suspense fallback={<div>Loading...</div>}>
                <UserManagement />
              </React.Suspense>
            ),
          },
        ],
      },
      {
        path: 'orders',
        children: [
          {
            path: 'agent',
            element: (
              <React.Suspense fallback={<div>Loading...</div>}>
                <AgentOrders />
              </React.Suspense>
            ),
          },
          {
            path: 'user/dynamic',
            element: (
              <React.Suspense fallback={<div>Loading...</div>}>
                <UserDynamicOrders />
              </React.Suspense>
            ),
          },
          {
            path: 'user/static',
            element: (
              <React.Suspense fallback={<div>Loading...</div>}>
                <UserStaticOrders />
              </React.Suspense>
            ),
          },
        ],
      },
      {
        path: 'static-ip/manage',
        element: (
          <React.Suspense fallback={<div>Loading...</div>}>
            <IPManagement />
          </React.Suspense>
        ),
      },
      {
        path: 'settings/system',
        element: (
          <React.Suspense fallback={<div>Loading...</div>}>
            <SystemSettings />
          </React.Suspense>
        ),
      },
    ],
  },
]);

export default router;
