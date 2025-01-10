import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import Dashboard from './pages/dashboard';
import AgentManagement from './pages/account/agents';
import UserManagement from './pages/account/users';
import AgentOrders from './pages/orders/agent';
import UserDynamicOrders from './pages/orders/user/dynamic';
import UserStaticOrders from './pages/orders/user/static';
import IPManagement from './pages/static-ip/manage';
import SystemSettings from './pages/settings/system';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
          <Route path="account">
            <Route path="agents" element={<AgentManagement />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
          <Route path="orders">
            <Route path="agent" element={<AgentOrders />} />
            <Route path="user">
              <Route path="dynamic" element={<UserDynamicOrders />} />
              <Route path="static" element={<UserStaticOrders />} />
            </Route>
          </Route>
          <Route path="static-ip">
            <Route path="manage" element={<IPManagement />} />
          </Route>
          <Route path="settings">
            <Route path="system" element={<SystemSettings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();