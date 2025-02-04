import React, { useState, useEffect } from 'react';
import { Table, Card, Form, Input, Select, Button, Space, message } from 'antd';
import { SearchOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/lib/table';
import type { ColumnsType } from 'antd/es/table';
import { api } from '@/utils/request';
import dayjs from 'dayjs';
import styles from './DynamicOrderList.module.less';

// 调试日志函数
const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DynamicOrderList Debug]', ...args);
    }
  }
};

// 添加类型定义
type PoolType = 'pool1' | 'pool2' | 'pool3';
type OrderStatus = 'active' | 'inactive';

const POOL_TYPE_MAP: Record<PoolType, string> = {
  'pool1': '动态IP池1',
  'pool2': '动态IP池2',
  'pool3': '动态IP池3'
};

const STATUS_MAP: Record<OrderStatus, string> = {
  'active': '正常',
  'inactive': '停用'
};

interface User {
  id: string;
  username: string;
}

interface DynamicOrder {
  id: string;
  orderNo: string;
  userId: string;
  username: string;
  user?: User;  // 添加可选的 user 对象
  poolType: PoolType;
  traffic: number;
  status?: OrderStatus;
  remark?: string;
  createTime: string;
  proxyInfo?: any;
}

const DynamicOrderList: React.FC = () => {
  debug.log('Component rendering');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<DynamicOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  });

  const fetchOrders = async (params: any) => {
    try {
      debug.log('Fetching orders with params:', params);
      setLoading(true);
      const response = await api.get('/api/orders/dynamic', { 
        params: {
          page: params.current || 1,
          page_size: params.pageSize || 10,
          orderNo: params.orderNo,
          username: params.userId,  // 使用 username 参数
          poolType: params.poolType
        }
      });
      
      debug.log('API Response:', response);
      const responseData = response.data;
      debug.log('Response Data:', responseData);
      
      if (responseData && responseData.list) {
        debug.log('Processing response data');
        debug.log('List:', responseData.list);
        debug.log('Total:', responseData.total);
        
        if (Array.isArray(responseData.list)) {
          debug.log('List is an array with length:', responseData.list.length);
          if (responseData.list.length > 0) {
            debug.log('First order:', responseData.list[0]);
            debug.log('First order keys:', Object.keys(responseData.list[0]));
          }
          
          // 处理每个订单的数据
          const ordersWithDefaults = responseData.list.map((order: Partial<DynamicOrder>) => {
            const username = order.username || order.user?.username || '-';  // 尝试从 user 对象获取用户名
            return {
              ...order,
              username,
              remark: order.remark || '-',  // 确保备注有默认值
              status: (order.status as OrderStatus) || 'active'
            };
          });
          
          debug.log('Processed orders:', ordersWithDefaults);
          setOrders(ordersWithDefaults as DynamicOrder[]);
          setTotal(responseData.total || 0);
        } else {
          debug.log('List is not an array:', responseData.list);
          setOrders([]);
          setTotal(0);
        }
      } else {
        debug.log('Invalid response data structure:', responseData);
        message.error('获取订单列表失败：数据格式错误');
        setOrders([]);
        setTotal(0);
      }
    } catch (error) {
      debug.log('Fetch Error:', error);
      console.error('获取订单列表失败:', error);
      message.error('获取订单列表失败');
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    debug.log('Component mounted or pagination changed:', pagination);
    fetchOrders({
      current: pagination.current,
      pageSize: pagination.pageSize
    });
  }, [pagination]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    debug.log('Table pagination changed:', newPagination);
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10
    });
  };

  const handleSearch = () => {
    const formValues = form.getFieldsValue();
    debug.log('Search form values:', formValues);
    setPagination({ ...pagination, current: 1 });
    fetchOrders({
      ...formValues,
      current: 1,
      pageSize: pagination.pageSize
    });
  };

  const handleReset = () => {
    debug.log('Resetting form');
    form.resetFields();
    setPagination({ ...pagination, current: 1 });
    fetchOrders({
      current: 1,
      pageSize: pagination.pageSize
    });
  };

  const handleCopyOrderNo = async (orderNo: string) => {
    try {
      await navigator.clipboard.writeText(orderNo);
      message.success('订单号已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败，请手动复制');
    }
  };

  const columns: ColumnsType<DynamicOrder> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (text) => text
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '资源类型',
      dataIndex: 'poolType',
      key: 'poolType',
      width: 120,
      render: (text: PoolType) => POOL_TYPE_MAP[text] || text
    },
    {
      title: '流量(GB)',
      dataIndex: 'traffic',
      key: 'traffic',
      width: 100,
      render: (traffic: number) => `${traffic}GB`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text?: OrderStatus) => (text ? STATUS_MAP[text] : '-')
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (text) => text
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (text) => text
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<CopyOutlined />}
          onClick={() => handleCopyOrderNo(record.orderNo)}
        >
          复制订单号
        </Button>
      ),
    },
  ];

  debug.log('Current orders:', orders);
  debug.log('Current total:', total);
  debug.log('Current loading state:', loading);

  return (
    <Card bordered={false}>
      <Form
        form={form}
        layout="inline"
        className={styles.searchForm}
        onFinish={handleSearch}
      >
        <Form.Item name="orderNo">
          <Input
            placeholder="请输入订单号"
            allowClear
            style={{ width: 200 }}
          />
        </Form.Item>
        <Form.Item name="userId">
          <Input
            placeholder="请输入用户名"
            allowClear
            style={{ width: 200 }}
          />
        </Form.Item>
        <Form.Item name="poolType">
          <Select
            placeholder="请选择资源类型"
            allowClear
            style={{ width: 200 }}
            options={[
              { value: 'pool1', label: '动态IP池1' },
              { value: 'pool2', label: '动态IP池2' },
              { value: 'pool3', label: '动态IP池3' },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              查询
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{
          total,
          current: pagination.current,
          pageSize: pagination.pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />
    </Card>
  );
};

export default DynamicOrderList; 