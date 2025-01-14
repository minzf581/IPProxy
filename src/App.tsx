import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import router from '@/router';

console.log('[App Debug] Starting to render App component');

const App: React.FC = () => {
  console.log('[App Debug] Inside App component render function');

  useEffect(() => {
    console.log('[App Debug] App component mounted');
    console.log('[App Debug] Router:', router);
    
    return () => {
      console.log('[App Debug] App component will unmount');
    };
  }, []);

  return (
    <React.Suspense 
      fallback={
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '20px'
        }}>
          Loading...
        </div>
      }
    >
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </React.Suspense>
  );
};

console.log('[App Debug] Exporting App component');

export default App;