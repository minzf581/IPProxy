import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  GlobalOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/account',
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
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
      children: [
        {
          key: '/orders/agent',
          label: '代理商订单',
        },
        {
          key: '/orders/user/dynamic',
          label: '动态代理订单',
        },
        {
          key: '/orders/user/static',
          label: '静态代理订单',
        },
      ],
    },
    {
      key: '/static-ip/manage',
      icon: <GlobalOutlined />,
      label: '静态IP管理',
    },
    {
      key: '/settings/system',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const getSelectedKeys = () => {
    const pathname = location.pathname;
    return [pathname];
  };

  const getOpenKeys = () => {
    const pathname = location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      return ['/' + parts[0]];
    }
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          backgroundColor: '#fff',
          borderRight: '1px solid #f0f0f0'
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 24px',
          color: '#1890ff',
          fontSize: '18px',
          fontWeight: 'bold',
          borderBottom: '1px solid #f0f0f0'
        }}>
          {collapsed ? 'IP' : 'IP总管理后台'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 16px', 
          background: '#fff', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center'
        }}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: () => setCollapsed(!collapsed),
            style: { fontSize: '18px', cursor: 'pointer' },
          })}
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
