import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

console.log('[PrivateRoute Debug] Importing PrivateRoute component');

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    console.log('[PrivateRoute Debug]', ...args);
    // 添加到 DOM
    const debugDiv = document.getElementById('debug-output');
    if (debugDiv) {
      const p = document.createElement('p');
      p.textContent = `[PrivateRoute] ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : arg
      ).join(' ')}`;
      debugDiv.appendChild(p);
    }
  },
  error: (...args: any[]) => {
    console.error('[PrivateRoute Error]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[PrivateRoute Warning]', ...args);
  }
};

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  console.log('[PrivateRoute Debug] Rendering PrivateRoute');
  debug.log('Rendering PrivateRoute');
  
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('[PrivateRoute Debug] PrivateRoute mounted');
    console.log('[PrivateRoute Debug] Auth state:', { user, loading });
    console.log('[PrivateRoute Debug] Current location:', location);
    debug.log('PrivateRoute mounted', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      user: user ? { ...user, password: '[REDACTED]' } : null,
      loading
    });
    
    return () => {
      console.log('[PrivateRoute Debug] PrivateRoute will unmount');
      debug.log('PrivateRoute will unmount');
    };
  }, [user, loading, location]);

  useEffect(() => {
    console.log('[PrivateRoute Debug] Auth state changed');
    console.log('[PrivateRoute Debug] Auth state:', { user, loading });
    debug.log('Auth state changed', {
      user: user ? { ...user, password: '[REDACTED]' } : null,
      loading
    });
  }, [user, loading]);

  if (loading) {
    console.log('[PrivateRoute Debug] Auth loading...');
    debug.log('Auth state is loading');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '20px'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    console.log('[PrivateRoute Debug] No user found, redirecting to login');
    debug.warn('No user found, redirecting to login', {
      from: location.pathname
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('[PrivateRoute Debug] User authenticated, rendering children');
  debug.log('User is authenticated, rendering protected content');
  return <>{children}</>;
};

console.log('[PrivateRoute Debug] Exporting PrivateRoute component');

export default PrivateRoute;
