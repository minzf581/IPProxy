import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { initializeMainUser } from './services/mainUser';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  useEffect(() => {
    // 应用启动时初始化主账号
    initializeMainUser().catch(error => {
      console.error('Failed to initialize main user:', error);
    });
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;