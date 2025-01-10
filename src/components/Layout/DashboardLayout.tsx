import React from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';

const { Header, Sider, Content } = Layout;

interface Props {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<Props> = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="bg-white px-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">IP总管理后台</h1>
      </Header>
      <Layout>
        <Sider width={200} className="bg-white">
          <Sidebar />
        </Sider>
        <Content className="bg-gray-50">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout; 