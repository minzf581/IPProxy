import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, message } from 'antd';
import { orderService } from '@/services/dbService';
import { formatDateTime } from '@/utils/dateUtils';
import UserDynamicOrderDetailModal from '@/components/Order/UserDynamicOrderDetailModal';

interface OrderData {
  id: number;
  orderNumber: string;
  duration: number;
  amount: number;
  status: string;
  ipAddress: string;
  location: string;
  createdAt: string;
}

const UserDynamicOrders: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const fetchOrders = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await orderService.getDynamicOrders({
        page,
        pageSize,
        userId: 'current' // 获取当前用户的订单
      });
      setOrders(response.data);
      setPagination({
        ...pagination,
        current: page,
        total: response.total
      });
    } catch (error) {
      console.error('获取订单列表失败:', error);
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchOrders(pagination.current, pagination.pageSize);
  };

  const handleViewDetail = (orderId: number) => {
    setSelectedOrder(orderId);
    setShowDetailModal(true);
  };

  const handleRenew = async (orderId: number) => {
    try {
      await orderService.renewDynamicOrder(orderId);
      message.success('续期成功');
      fetchOrders(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('续期失败:', error);
      message.error('续期失败');
    }
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration}分钟`
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: '地区',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => status === 'active' ? '使用中' : '已过期'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date)
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: OrderData) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleViewDetail(record.id)}>
            查看详情
          </Button>
          {record.status === 'active' && (
            <Button type="link" onClick={() => handleRenew(record.id)}>
              续期
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="动态IP订单">
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />

      {selectedOrder && (
        <UserDynamicOrderDetailModal
          visible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          orderId={selectedOrder}
        />
      )}
    </Card>
  );
};

export default UserDynamicOrders;