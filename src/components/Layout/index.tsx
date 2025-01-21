import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  OrderedListOutlined,
  GlobalOutlined,
  SettingOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import styles from './index.module.less';

const { Header, Sider, Content } = Layout;

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    console.log('[Layout Debug]', ...args);
  }
};

// 菜单配置
const menuConfig = [
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
        key: 'account/agent',
        label: '代理商管理',
      },
      {
        key: 'account/user',
        label: '用户管理',
      }
    ]
  },
  {
    key: 'order',
    icon: <OrderedListOutlined />,
    label: '订单管理',
    children: [
      {
        key: 'order/agent',
        label: '代理商订单',
      },
      {
        key: 'order/dynamic',
        label: '用户动态订单',
      },
      {
        key: 'order/static',
        label: '用户静态订单',
      }
    ]
  },
  {
    key: 'ip',
    icon: <GlobalOutlined />,
    label: 'IP资源',
    children: [
      {
        key: 'ip/dynamic',
        label: '动态IP',
      },
      {
        key: 'ip/static',
        label: '静态IP',
      }
    ]
  },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: '系统设置',
  }
];

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // 获取当前路径对应的菜单项 key
  const getSelectedKey = () => {
    const path = location.pathname === '/' ? '/' : location.pathname.substring(1);
    return path;
  };

  // 获取当前路径的父级菜单 key
  const getParentKey = (path: string) => {
    const parts = path.split('/');
    return parts[0];
  };

  // 初始化展开的菜单
  React.useEffect(() => {
    const currentPath = location.pathname.substring(1);
    if (currentPath) {
      const parentKey = getParentKey(currentPath);
      setOpenKeys(prev => {
        if (!prev.includes(parentKey)) {
          return [...prev, parentKey];
        }
        return prev;
      });
    }
    debug.log('Open keys:', openKeys);
  }, [location.pathname]);

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 处理子菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: '个人信息',
    },
    {
      key: 'settings',
      label: '账户设置',
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

  const selectedKeys = [getSelectedKey()];
  debug.log('Selected keys:', selectedKeys);
  debug.log('Open keys:', openKeys);

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
          {!collapsed && 'IP管理后台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={menuConfig}
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

export default AppLayout;
