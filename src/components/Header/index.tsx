import React from 'react';
import { Layout, Button, Dropdown } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '@/contexts/AuthContext';

const { Header: AntHeader } = Layout;

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const menuItems: MenuProps['items'] = [
    {
      key: 'logout',
      label: '退出登录',
      onClick: logout
    }
  ];

  return (
    <AntHeader style={{ 
      background: '#fff', 
      padding: '0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 1px 4px rgba(0,21,41,.08)'
    }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
        IP代理管理系统
      </div>
      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Button type="link" icon={<UserOutlined />}>
          {user?.username}
        </Button>
      </Dropdown>
    </AntHeader>
  );
};

export default Header; 