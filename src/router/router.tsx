import { createHashRouter, RouteObject } from 'react-router-dom';
import AppLayout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import ErrorPage from '@/pages/error';
import AgentManagement from '@/pages/account/agents';

console.log('[Router Debug] Starting router configuration');
console.log('[Router Debug] Imported AgentManagement:', AgentManagement);

const AgentManagementWithDebug = () => {
  console.log('[Router Debug] Rendering AgentManagement component');
  return <AgentManagement />;
};

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorPage />
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'account/agent',
        element: <AgentManagementWithDebug />
      },
      {
        path: 'account/user',
        element: <div>用户管理</div>
      },
      {
        path: 'order/agent',
        element: <div>代理商订单</div>
      },
      {
        path: 'order/dynamic',
        element: <div>用户动态订单</div>
      },
      {
        path: 'order/static',
        element: <div>用户静态订单</div>
      },
      {
        path: 'ip/dynamic',
        element: <div>IP管理</div>
      },
      {
        path: 'ip/static',
        element: <div>静态IP管理</div>
      },
      {
        path: 'system',
        element: <div>系统设置</div>
      }
    ]
  }
];

console.log('[Router Debug] Routes configuration:', JSON.stringify(routes, null, 2));
console.log('[Router Debug] Creating hash router');

const router = createHashRouter(routes);

console.log('[Router Debug] Router configuration complete');
export default router;