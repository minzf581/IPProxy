import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import UserStaticOrderDetailModal from '@/components/Order/UserStaticOrderDetailModal';

interface StaticOrder {
  id: string;
  orderNo: string;
  userAccount: string;
  ipInfo: {
    subnet: string;
    port: number;
    country: string;
    city: string;
  };
  createdAt: string;
  expiredAt: string;
  status: string;
}

const UserStaticOrders: React.FC = () => {
  const [orders, setOrders] = useState<StaticOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const columns: ColumnsType<StaticOrder> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '用户账号',
      dataIndex: 'userAccount',
      key: 'userAccount',
    },
    {
      title: 'IP信息',
      key: 'ipInfo',
      render: (_, record) => `${record.ipInfo.subnet}:${record.ipInfo.port}`,
    },
    {
      title: '地区',
      key: 'location',
      render: (_, record) => `${record.ipInfo.country} - ${record.ipInfo.city}`,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '到期时间',
      dataIndex: 'expiredAt',
      key: 'expiredAt',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (status === 'active' ? '使用中' : '已过期'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => showDetail(record.id)}>
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  const showDetail = (orderId: string) => {
    setSelectedOrder(orderId);
    setDetailVisible(true);
  };

  return (
    <Card title="静态IP订单">
      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        rowKey="id"
      />
      <UserStaticOrderDetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        orderId={selectedOrder || ''}
      />
    </Card>
  );
};

export default UserStaticOrders;