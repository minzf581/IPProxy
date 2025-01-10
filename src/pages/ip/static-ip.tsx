import React from 'react';
import { Card, Input, Select, Button, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface IPData {
  ipInfo: string;
  location: string;
  status: string;
  user: string;
  resourceType: string;
  expireDate: string;
}

const StaticIPManage: React.FC = () => {
  const columns: ColumnsType<IPData> = [
    {
      title: 'IP信息',
      dataIndex: 'ipInfo',
      key: 'ipInfo',
      render: (text: string, record) => (
        <div>
          <div>{text}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>{record.location}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: () => <Tag color="success">可用</Tag>,
    },
    {
      title: '使用者',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
    },
    {
      title: '过期时间',
      dataIndex: 'expireDate',
      key: 'expireDate',
    },
  ];

  const data: IPData[] = [
    {
      ipInfo: '192.168.1.1:8080',
      location: '中国 - 上海',
      status: '可用',
      user: 'user1',
      resourceType: '静态资源1',
      expireDate: '2024-12-31',
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '24px', fontWeight: 'normal' }}>静态IP管理</h2>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <Card style={{ flex: 1, borderRadius: '8px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#666', fontSize: '14px' }}>总IP数</div>
            <div style={{ fontSize: '24px', marginTop: '8px' }}>1</div>
          </div>
        </Card>
        <Card style={{ flex: 1, borderRadius: '8px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#666', fontSize: '14px' }}>可用IP数</div>
            <div style={{ fontSize: '24px', marginTop: '8px' }}>1</div>
          </div>
        </Card>
        <Card style={{ flex: 1, borderRadius: '8px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#666', fontSize: '14px' }}>已过期IP数</div>
            <div style={{ fontSize: '24px', marginTop: '8px' }}>0</div>
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Search
          placeholder="请输入IP或使用者"
          style={{ width: 200 }}
        />
        <Select
          placeholder="状态筛选"
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '状态筛选' },
          ]}
        />
        <Select
          placeholder="类型筛选"
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '类型筛选' },
          ]}
        />
        <Button type="primary">导出</Button>
      </div>

      <Card style={{ borderRadius: '8px' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="ipInfo"
          pagination={{
            current: 1,
            pageSize: 10,
            total: 1,
            showSizeChanger: false,
            showQuickJumper: false,
          }}
        />
      </Card>
    </div>
  );
};

export default StaticIPManage;