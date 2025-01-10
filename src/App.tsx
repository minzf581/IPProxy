import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { initializeMainUser } from './services/mainUser';

const App: React.FC = () => {
  useEffect(() => {
    // 应用启动时初始化主账号
    initializeMainUser().catch(error => {
      console.error('Failed to initialize main user:', error);
    });
  }, []);

  return <RouterProvider router={router} />;
};

export default App;