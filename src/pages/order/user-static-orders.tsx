import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, message } from 'antd';
import { orderService } from '@/services/dbService';
import { formatDateTime } from '@/utils/dateUtils';
import UserStaticOrderDetailModal from '@/components/Order/UserStaticOrderDetailModal';

interface OrderData {
  id: number;
  orderNumber: string;
  ipAddress: string;
  location: string;
  amount: number;
  status: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

const UserStaticOrders: React.FC = () => {
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
      const response = await orderService.getStaticOrders({
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
      await orderService.renewStaticOrder(orderId);
      message.success('续期成功');
      fetchOrders(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('续期失败:', error);
      message.error('续期失败');
    }
  };

  const handleRelease = async (orderId: number) => {
    try {
      await orderService.releaseStaticOrder(orderId);
      message.success('IP已释放');
      fetchOrders(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('释放IP失败:', error);
      message.error('释放IP失败');
    }
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
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
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => status === 'active' ? '使用中' : '已过期'
    },
    {
      title: '到期时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (date: string) => formatDateTime(date)
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
            <>
              <Button type="link" onClick={() => handleRenew(record.id)}>
                续期
              </Button>
              <Button type="link" danger onClick={() => handleRelease(record.id)}>
                释放IP
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="静态IP订单">
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />

      {selectedOrder && (
        <UserStaticOrderDetailModal
          visible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          orderId={selectedOrder}
        />
      )}
    </Card>
  );
};

export default UserStaticOrders;