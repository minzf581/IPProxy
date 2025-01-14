import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import UserDynamicOrderDetailModal from '@/components/Order/UserDynamicOrderDetailModal';

interface DynamicOrder {
  id: string;
  orderNo: string;
  userAccount: string;
  duration: number;
  createdAt: string;
  status: string;
}

const UserDynamicOrders: React.FC = () => {
  const [orders, setOrders] = useState<DynamicOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const columns: ColumnsType<DynamicOrder> = [
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
      title: '时长(分钟)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
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
    <Card title="动态IP订单">
      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        rowKey="id"
      />
      <UserDynamicOrderDetailModal
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        orderId={selectedOrder || ''}
      />
    </Card>
  );
};

export default UserDynamicOrders;