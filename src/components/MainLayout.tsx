import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  GlobalOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: 'account',
      icon: <TeamOutlined />,
      label: '账户管理',
      children: [
        {
          key: '/account/agents',
          label: '代理商管理',
        },
        {
          key: '/account/users',
          label: '用户管理',
        },
      ],
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
      children: [
        {
          key: '/orders/agent',
          label: '代理商订单',
        },
        {
          key: '/orders/user/dynamic',
          label: '用户动态订单',
        },
        {
          key: '/orders/user/static',
          label: '用户静态订单',
        },
      ],
    },
    {
      key: 'static-ip',
      icon: <GlobalOutlined />,
      label: '静态IP管理',
      children: [
        {
          key: '/static-ip/manage',
          label: 'IP管理',
        },
      ],
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      children: [
        {
          key: '/settings/system',
          label: '系统设置',
        },
      ],
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const getSelectedKeys = () => {
    return [location.pathname];
  };

  const getOpenKeys = () => {
    const pathParts = location.pathname.split('/');
    if (pathParts.length > 1) {
      return [pathParts[1]];
    }
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          backgroundColor: '#fff',
          borderRight: '1px solid #f0f0f0'
        }}
        theme="light"
      >
        <div style={{ height: '64px', margin: '16px', fontSize: '18px', textAlign: 'center' }}>
          IP总管理后台
        </div>
        <Menu
          theme="light"
          defaultSelectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 'none' }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
