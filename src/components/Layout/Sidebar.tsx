import React from 'react';
import { Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  OrderedListOutlined,
  GlobalOutlined,
  SettingOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const items: MenuProps['items'] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: <Link to="/">仪表盘</Link>,
  },
  {
    key: 'agent',
    icon: <TeamOutlined />,
    label: '账户管理',
    children: [
      {
        key: 'agent-list',
        label: <Link to="/agent">代理商管理</Link>,
      },
      {
        key: 'user-list',
        label: <Link to="/user">用户管理</Link>,
      },
    ],
  },
  {
    key: 'order',
    icon: <OrderedListOutlined />,
    label: '订单管理',
    children: [
      {
        key: 'agent-orders',
        label: <Link to="/order/agent-orders">代理商订单</Link>,
      },
      {
        key: 'user-dynamic-orders',
        label: <Link to="/order/user-dynamic-orders">用户动态订单</Link>,
      },
      {
        key: 'user-static-orders',
        label: <Link to="/order/user-static-orders">用户静态订单</Link>,
      },
    ],
  },
  {
    key: 'ip',
    icon: <GlobalOutlined />,
    label: '静态IP管理',
    children: [
      {
        key: 'static-ip',
        label: <Link to="/ip/static-ip">IP管理</Link>,
      },
    ],
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: '系统设置',
    children: [
      {
        key: 'system-settings',
        label: <Link to="/settings">系统设置</Link>,
      },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const selectedKey = location.pathname.split('/')[1] || 'dashboard';

  return (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      defaultOpenKeys={['agent', 'order', 'ip', 'settings']}
      items={items}
      style={{ height: '100%', borderRight: 0 }}
    />
  );
};

export default Sidebar; 