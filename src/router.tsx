import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import UserDynamicOrders from '@/pages/order/user-dynamic-orders';
import UserStaticOrders from '@/pages/order/user-static-orders';
import ErrorPage from '@/pages/error';
import PrivateRoute from '@/components/PrivateRoute';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorPage />
  },
  {
    path: '/',
    element: <PrivateRoute><Layout /></PrivateRoute>,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <Dashboard />
      },
      {
        path: '/order/user/dynamic',
        element: <UserDynamicOrders />
      },
      {
        path: '/order/user/static',
        element: <UserStaticOrders />
      }
    ]
  }
]);

export default router; 