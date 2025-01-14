import React, { useEffect, useState } from 'react';
import { Layout, Menu } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  OrderedListOutlined,
  GlobalOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Sider, Content } = Layout;

const AppLayout: React.FC = () => {
  console.log('[Layout Debug] Rendering Layout component');
  
  const navigate = useNavigate();
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['/']);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘'
    },
    {
      key: 'account',
      icon: <TeamOutlined />,
      label: '账户管理',
      children: [
        {
          key: '/account/agent',
          label: '代理商管理'
        },
        {
          key: '/account/user',
          label: '用户管理'
        }
      ]
    },
    {
      key: 'order',
      icon: <OrderedListOutlined />,
      label: '订单管理',
      children: [
        {
          key: '/order/agent',
          label: '代理商订单'
        },
        {
          key: '/order/dynamic',
          label: '用户动态订单'
        },
        {
          key: '/order/static',
          label: '用户静态订单'
        }
      ]
    },
    {
      key: 'ip',
      icon: <GlobalOutlined />,
      label: 'IP资源',
      children: [
        {
          key: '/ip/dynamic',
          label: '动态IP'
        },
        {
          key: '/ip/static',
          label: '静态IP'
        }
      ]
    },
    {
      key: '/system',
      icon: <SettingOutlined />,
      label: '系统设置'
    }
  ];

  useEffect(() => {
    const pathname = location.pathname;
    console.log('[Layout Debug] Current pathname:', pathname);

    // 找到当前选中的菜单项
    const findSelectedKey = (items: any[]): string | null => {
      for (const item of items) {
        if (item.children) {
          const found = findSelectedKey(item.children);
          if (found) return found;
        }
        if (pathname === item.key || (pathname === '/' && item.key === '/')) {
          return item.key;
        }
      }
      return null;
    };

    // 找到父菜单项
    const findParentKey = (items: any[], targetKey: string): string | null => {
      for (const item of items) {
        if (item.children) {
          if (item.children.some((child: any) => child.key === targetKey)) {
            return item.key;
          }
          const found = findParentKey(item.children, targetKey);
          if (found) return found;
        }
      }
      return null;
    };

    const selectedKey = findSelectedKey(menuItems);
    console.log('[Layout Debug] Found selected key:', selectedKey);
    
    if (selectedKey) {
      setSelectedKeys([selectedKey]);
      const parentKey = findParentKey(menuItems, selectedKey);
      if (parentKey) {
        console.log('[Layout Debug] Found parent key:', parentKey);
        setOpenKeys([parentKey]);
      }
    }
  }, [location.pathname]);

  const handleMenuClick = ({ key }: { key: string }) => {
    console.log('[Layout Debug] Menu item clicked:', key);
    navigate(key);
  };

  const handleOpenChange = (keys: string[]) => {
    console.log('[Layout Debug] Menu opened:', keys);
    setOpenKeys(keys);
  };

  console.log('[Layout Debug] Current pathname:', location.pathname);
  console.log('[Layout Debug] Selected keys:', selectedKeys);
  console.log('[Layout Debug] Open keys:', openKeys);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} style={{ background: '#001529' }}>
        <div style={{ 
          height: '64px', 
          lineHeight: '64px', 
          textAlign: 'center', 
          color: '#fff', 
          fontSize: '18px', 
          fontWeight: 'bold',
          background: '#002140'
        }}>
          IP总管理后台
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ 
            height: 'calc(100% - 64px)', 
            borderRight: 0 
          }}
        />
      </Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          background: '#fff',
          borderRadius: '4px',
          minHeight: 280
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

console.log('[Layout Debug] Exporting Layout component');

export default AppLayout;
