import React from 'react';
import { createHashRouter } from 'react-router-dom';
import AuthGuard, { PublicRoute } from '@/components/AuthGuard';
import Login from '@/pages/login/index';
import MainLayout from '@/layouts/MainLayout';
import ErrorPage from '@/pages/error';
import Dashboard from '@/pages/dashboard/index';

// 懒加载其他页面组件
const UserManagement = React.lazy(() => import('@/pages/user/index'));
const UserDynamicOrders = React.lazy(() => import('@/pages/order/user-dynamic-orders'));
const UserStaticOrders = React.lazy(() => import('@/pages/order/user-static-orders'));
const AgentOrders = React.lazy(() => import('@/pages/order/agent-orders'));
const DynamicProxy = React.lazy(() => import('@/pages/proxy/dynamic/index'));
const StaticProxy = React.lazy(() => import('@/pages/proxy/static/index'));
const Settings = React.lazy(() => import('@/pages/settings/index'));

const router = createHashRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: '',
        element: <Dashboard />,
      },
      {
        path: 'dashboard',
        children: [
          {
            path: '',
            element: <Dashboard />,
          },
          {
            path: 'dynamic',
            element: <Dashboard />,
          },
          {
            path: 'static',
            element: <Dashboard />,
          },
        ],
      },
      {
        path: 'user',
        element: (
          <React.Suspense fallback={<div>Loading...</div>}>
            <UserManagement />
          </React.Suspense>
        ),
      },
      {
        path: 'order',
        children: [
          {
            path: 'dynamic',
            element: (
              <React.Suspense fallback={<div>Loading...</div>}>
                <UserDynamicOrders />
              </React.Suspense>
            ),
          },
          {
            path: 'static',
            element: (
              <React.Suspense fallback={<div>Loading...</div>}>
                <UserStaticOrders />
              </React.Suspense>
            ),
          },
          {
            path: 'agent',
            element: (
              <React.Suspense fallback={<div>Loading...</div>}>
                <AgentOrders />
              </React.Suspense>
            ),
          },
        ],
      },
      {
        path: 'proxy',
        children: [
          {
            path: 'dynamic',
            element: (
              <React.Suspense fallback={<div>Loading...</div>}>
                <DynamicProxy />
              </React.Suspense>
            ),
          },
          {
            path: 'static',
            element: (
              <React.Suspense fallback={<div>Loading...</div>}>
                <StaticProxy />
              </React.Suspense>
            ),
          },
        ],
      },
      {
        path: 'settings',
        element: (
          <React.Suspense fallback={<div>Loading...</div>}>
            <Settings />
          </React.Suspense>
        ),
      },
    ],
  },
]);

export default router;
