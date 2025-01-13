import React from 'react';
import { Card, Table, Tabs, Tag, Button, Space, message } from 'antd';
import { getDynamicOrderList, getStaticOrderList, updateOrder } from '@/services/orderService';
import { getUserById } from '@/services/userService';
import { getResourceById } from '@/services/resourceService';
import type { DynamicOrder, StaticOrder } from '@/types/order';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

const OrderListPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('dynamic');
  const [loading, setLoading] = React.useState(false);
  const [dynamicOrders, setDynamicOrders] = React.useState<{ list: DynamicOrder[]; total: number }>({ list: [], total: 0 });
  const [staticOrders, setStaticOrders] = React.useState<{ list: StaticOrder[]; total: number }>({ list: [], total: 0 });
  const [pagination, setPagination] = React.useState({ current: 1, pageSize: 10 });

  React.useEffect(() => {
    loadOrders();
  }, [activeTab, pagination.current, pagination.pageSize]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      if (activeTab === 'dynamic') {
        const result = await getDynamicOrderList({
          page: pagination.current,
          pageSize: pagination.pageSize
        });
        setDynamicOrders(result);
      } else {
        const result = await getStaticOrderList({
          page: pagination.current,
          pageSize: pagination.pageSize
        });
        setStaticOrders(result);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      message.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (order: DynamicOrder | StaticOrder, newStatus: string) => {
    try {
      await updateOrder(order.id, { status: newStatus });
      message.success('状态更新成功');
      loadOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      message.error('更新订单状态失败');
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPagination({ ...pagination, current: 1 });
  };

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const dynamicColumns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '用户',
      dataIndex: 'userId',
      key: 'userId',
      render: async (userId: number) => {
        const user = await getUserById(userId);
        return user?.username || userId;
      },
    },
    {
      title: '资源',
      dataIndex: 'resourceId',
      key: 'resourceId',
      render: async (resourceId: number) => {
        const resource = await getResourceById(resourceId);
        return resource?.name || resourceId;
      },
    },
    {
      title: '时长（分钟）',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'completed' ? 'blue' : 'red'}>
          {status === 'active' ? '使用中' : status === 'completed' ? '已完成' : '已取消'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: DynamicOrder) => (
        <Space>
          {record.status === 'active' && (
            <Button
              size="small"
              onClick={() => handleUpdateStatus(record, 'cancelled')}
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const staticColumns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '用户',
      dataIndex: 'userId',
      key: 'userId',
      render: async (userId: number) => {
        const user = await getUserById(userId);
        return user?.username || userId;
      },
    },
    {
      title: '资源',
      dataIndex: 'resourceId',
      key: 'resourceId',
      render: async (resourceId: number) => {
        const resource = await getResourceById(resourceId);
        return resource?.name || resourceId;
      },
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'completed' ? 'blue' : 'red'}>
          {status === 'active' ? '使用中' : status === 'completed' ? '已完成' : '已取消'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: StaticOrder) => (
        <Space>
          {record.status === 'active' && (
            <Button
              size="small"
              onClick={() => handleUpdateStatus(record, 'cancelled')}
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="订单管理">
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="动态订单" key="dynamic">
          <Table
            columns={dynamicColumns}
            dataSource={dynamicOrders.list}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              total: dynamicOrders.total,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            onChange={handleTableChange}
          />
        </TabPane>
        <TabPane tab="静态订单" key="static">
          <Table
            columns={staticColumns}
            dataSource={staticOrders.list}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              total: staticOrders.total,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            onChange={handleTableChange}
          />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default OrderListPage;
