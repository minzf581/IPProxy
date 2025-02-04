import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import router from './router/router';
import { AuthProvider } from './contexts/AuthContext';

// 配置 React Router 的 future flags
import { UNSAFE_DataRouterContext, UNSAFE_DataRouterStateContext } from 'react-router-dom';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <RouterProvider 
          router={router} 
          fallbackElement={<div>Loading...</div>}
        />
      </AuthProvider>
    </ConfigProvider>
  );
}

// 使用严格模式包装应用
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 