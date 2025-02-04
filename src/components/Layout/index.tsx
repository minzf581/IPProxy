import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, theme } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  OrderedListOutlined,
  GlobalOutlined,
  SettingOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  CloudServerOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { adminMenuConfig, agentMenuConfig } from '@/config/menu';
import styles from './index.module.less';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    console.log('[Layout Debug]', ...args);
  }
};

const LayoutComponent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    debug.log('User info:', user);
    debug.log('Is agent:', user?.is_agent);
  }, [user]);

  useEffect(() => {
    const path = location.pathname.split('/').filter(Boolean);
    debug.log('Current path:', path);
    if (path.length > 0) {
      setSelectedKeys([path.join('/')]);
      setOpenKeys([path[0]]);
      debug.log('Setting selected keys:', [path.join('/')]);
      debug.log('Setting open keys:', [path[0]]);
    } else {
      setSelectedKeys(['dashboard']);
      debug.log('Setting default selected key: dashboard');
    }
  }, [location.pathname]);

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    debug.log('Menu item clicked:', key);
    navigate(`/${key}`);
  };

  // 处理子菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    debug.log('Menu open keys changed:', keys);
    setOpenKeys(keys);
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'settings',
      label: '系统设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      onClick: logout,
    },
  ];

  debug.log('Selected keys:', selectedKeys);
  debug.log('Open keys:', openKeys);

  // 获取菜单配置
  const getMenuConfig = () => {
    const isAgent = user?.is_agent ?? false;
    debug.log('Getting menu config for role:', isAgent ? 'agent' : 'admin');
    return isAgent ? agentMenuConfig : adminMenuConfig;
  };

  const menuItems = getMenuConfig();
  debug.log('Menu items:', menuItems);

  return (
    <Layout className={styles.layout}>
      <Sider 
        className={styles.sider}
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
      >
        <div className={styles.logo}>
          {!collapsed && (user?.agent_id === null ? 'IP管理后台' : 'IP代理商后台')}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems}
          onClick={handleMenuClick}
          className={styles.menu}
        />
      </Sider>
      <Layout>
        <Header className={styles.header}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className={styles.trigger}
          />
          <div className={styles.headerRight}>
            <Button
              type="text"
              icon={<BellOutlined />}
              className={styles.action}
            />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <span className={styles.account}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span className={styles.username}>{user?.username}</span>
              </span>
            </Dropdown>
          </div>
        </Header>
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutComponent;
