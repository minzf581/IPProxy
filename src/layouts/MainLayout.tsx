import React from 'react';
import { Layout, Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { adminMenuConfig, businessMenuConfig } from '@/config/menu';
import './MainLayout.less';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isBusinessUser = user?.role === 'agent' || user?.role === 'user';

  // 根据用户角色选择菜单配置
  const menuConfig = isBusinessUser ? businessMenuConfig : adminMenuConfig;

  console.log('[Layout Debug] User info:', user);
  console.log('[Layout Debug] Is business user:', isBusinessUser);
  console.log('[Layout Debug] Menu config:', menuConfig);

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const pathname = location.pathname;
    const menuItem = menuConfig.find(item => {
      if (item.children) {
        return item.children.some(child => child.path === pathname);
      }
      return item.path === pathname;
    });

    if (menuItem) {
      if (menuItem.children) {
        const child = menuItem.children.find(child => child.path === pathname);
        return child ? [child.key] : [menuItem.key];
      }
      return [menuItem.key];
    }
    return [];
  };

  // 获取展开的子菜单
  const getOpenKeys = () => {
    const pathname = location.pathname;
    const menuItem = menuConfig.find(item => {
      if (item.children) {
        return item.children.some(child => child.path === pathname);
      }
      return false;
    });
    return menuItem ? [menuItem.key] : [];
  };

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    const menuItem = menuConfig.find(item => {
      if (item.children) {
        return item.children.some(child => child.key === key);
      }
      return item.key === key;
    });

    if (menuItem) {
      if (menuItem.children) {
        const child = menuItem.children.find(child => child.key === key);
        if (child) {
          navigate(child.path);
        }
      } else {
        navigate(menuItem.path);
      }
    }
  };

  return (
    <Layout className="main-layout">
      <Sider width={200} className="main-sider">
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          onClick={handleMenuClick}
          items={menuConfig}
          className="main-menu"
        />
      </Sider>
      <Layout>
        <Content className="main-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 