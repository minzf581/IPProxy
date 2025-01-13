import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, message } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  GlobalOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/user',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/order',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
      children: [
        {
          key: '/order/dynamic',
          label: '动态订单',
        },
        {
          key: '/order/static',
          label: '静态订单',
        },
      ],
    },
    {
      key: '/proxy',
      icon: <GlobalOutlined />,
      label: '代理管理',
      children: [
        {
          key: '/proxy/dynamic',
          label: '动态代理',
        },
        {
          key: '/proxy/static',
          label: '静态代理',
        },
      ],
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
      >
        <div className="p-4 text-center">
          <h1 className="text-gray-800 text-lg font-bold">IP总管理后台</h1>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/order', '/proxy']}
          onClick={handleMenuClick}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Dropdown overlay={userMenu} placement="bottomRight">
            <span className="cursor-pointer flex items-center">
              <Avatar icon={<UserOutlined />} />
              <span className="ml-2 text-gray-800">{userInfo?.username}</span>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
