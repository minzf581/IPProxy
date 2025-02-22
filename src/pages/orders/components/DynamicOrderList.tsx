import React, { useState, useEffect } from 'react';
import { Table, Card, Form, Input, Select, Button, Space, message, Modal, InputNumber, Tag, Spin } from 'antd';
import { SearchOutlined, ReloadOutlined, CopyOutlined, PlusOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/lib/table';
import type { ColumnsType } from 'antd/es/table';
import { api } from '@/utils/request';
import dayjs from 'dayjs';
import styles from './DynamicOrderList.module.less';
import { API_ROUTES } from '@/shared/routes';

// 调试日志函数
const debug = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log('[DynamicOrderList Debug]', ...args);
    }
  }
};

// 添加类型定义
type PoolType = 'pool1' | 'pool2' | 'pool3';
type OrderStatus = 1 | 2 | 3 | 4 | 5;  // 1=待处理 2=处理中 3=处理成功 4=处理失败 5=部分完成

const POOL_TYPE_MAP: Record<PoolType, string> = {
  'pool1': '动态IP池1',
  'pool2': '动态IP池2',
  'pool3': '动态IP池3'
};

const STATUS_MAP: Record<OrderStatus, string> = {
  1: '待处理',
  2: '处理中',
  3: '处理成功',
  4: '处理失败',
  5: '部分完成'
};

interface User {
  id: string;
  username: string;
}

interface DynamicOrder {
  id: string;
  orderNo: string;
  order_no?: string;  // 后端字段
  userId: string;
  user_id?: string;  // 后端字段
  username: string;
  agent_username?: string;  // 添加代理商用户名字段
  user?: User;
  poolType: PoolType;
  pool_type?: string;  // 后端字段
  traffic: number;
  status: OrderStatus;
  flowTotal?: number;  // 总流量(MB)
  flowBalance?: number;  // 剩余流量(MB)
  remark?: string;
  createTime: string;
  created_at?: string;  // 后端字段
  proxyInfo?: any;
  proxy_info?: any;  // 后端字段
}

interface AddTrafficModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (traffic: number) => Promise<void>;
  loading: boolean;
  orderNo: string;  // 添加订单号属性
}

const AddTrafficModal: React.FC<AddTrafficModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  loading,
  orderNo
}) => {
  const [form] = Form.useForm();
  const [orderInfo, setOrderInfo] = useState<{
    status: number;
    flowTotal: number;
    flowBalance: number;
  } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // 获取订单信息
  const fetchOrderInfo = async () => {
    if (!orderNo) return;
    
    setLoadingInfo(true);
    try {
      const response = await api.get(`/api/dynamic/order-info/${orderNo}`);
      if (response.data.code === 0) {
        setOrderInfo(response.data.data);
      } else {
        message.error('获取订单信息失败');
      }
    } catch (error) {
      console.error('获取订单信息失败:', error);
      message.error('获取订单信息失败');
    } finally {
      setLoadingInfo(false);
    }
  };

  // 当对话框显示时获取订单信息
  useEffect(() => {
    if (visible && orderNo) {
      fetchOrderInfo();
    }
  }, [visible, orderNo]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onConfirm(values.traffic);
      form.resetFields();
    } catch (error) {
      console.error('验证表单失败:', error);
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1:
        return '待处理';
      case 2:
        return '处理中';
      case 3:
        return '处理成功';
      case 4:
        return '处理失败';
      case 5:
        return '部分完成';
      default:
        return '未知状态';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'warning';
      case 2:
        return 'processing';
      case 3:
        return 'success';
      case 4:
        return 'error';
      case 5:
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Modal
      title="增加流量"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      {loadingInfo ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip="加载订单信息..." />
        </div>
      ) : orderInfo ? (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <span>订单状态：</span>
            <Tag color={getStatusColor(orderInfo.status)}>
              {getStatusText(orderInfo.status)}
            </Tag>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <span>总流量：</span>
            <span>{orderInfo.flowTotal}MB</span>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <span>剩余流量：</span>
            <span>{orderInfo.flowBalance}MB</span>
          </div>
        </div>
      ) : null}
      <Form form={form}>
        <Form.Item
          name="traffic"
          label="流量大小"
          rules={[
            { required: true, message: '请输入流量大小' },
            { type: 'number', min: 1, message: '流量必须大于0' },
            { 
              validator: (_, value) => {
                if (value && !Number.isInteger(value)) {
                  return Promise.reject('流量必须为整数');
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入流量大小(MB)"
            min={1}
            precision={0}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

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
  const [selectedOrder, setSelectedOrder] = useState<DynamicOrder | null>(null);
  const [addTrafficVisible, setAddTrafficVisible] = useState(false);
  const [addTrafficLoading, setAddTrafficLoading] = useState(false);

  const fetchOrders = async (params: any) => {
    setLoading(true);
    try {
      debug.log('Fetching orders with params:', params);
      const response = await api.get('/api/dynamic', {
        params: {
          page: params.current || 1,
          page_size: params.pageSize || 10,
          order_no: params.orderNo,
          user_id: params.userId,
          pool_type: params.poolType,
          start_date: params.startTime,
          end_date: params.endTime
        }
      });
      
      debug.log('API Response:', response);
      const responseData = response.data;
      debug.log('Response Data:', responseData);
      
      if (responseData.code === 0 && responseData.data) {
        const { list = [], total = 0 } = responseData.data;
        debug.log('Processing response data');
        debug.log('Raw List Data:', JSON.stringify(list, null, 2));
        debug.log('Total:', total);
        
        if (Array.isArray(list)) {
          debug.log('List is an array with length:', list.length);
          if (list.length > 0) {
            debug.log('First order raw data:', JSON.stringify(list[0], null, 2));
            debug.log('First order keys:', Object.keys(list[0]));
          }
          
          // 处理每个订单的数据
          const ordersWithDefaults = list.map((order: Partial<DynamicOrder>) => {
            debug.log('Processing order:', JSON.stringify(order, null, 2));
            const processedOrder = {
              id: order.id || '',
              orderNo: order.orderNo || order.order_no || '',
              userId: String(order.userId || order.user_id || ''),
              username: order.username || '-',  // 直接使用后端返回的username
              agent_username: order.agent_username || '',
              poolType: (order.poolType || order.pool_type || 'pool1') as PoolType,
              traffic: order.traffic || 0,
              remark: order.remark || '-',
              createTime: order.createTime || order.created_at || '-',
              proxyInfo: order.proxyInfo || order.proxy_info || {}
            };
            debug.log('Processed order:', JSON.stringify(processedOrder, null, 2));
            return processedOrder;
          });
          
          debug.log('All processed orders:', JSON.stringify(ordersWithDefaults, null, 2));
          setOrders(ordersWithDefaults as DynamicOrder[]);
          setTotal(total);
        } else {
          debug.log('List is not an array:', list);
          setOrders([]);
          setTotal(0);
        }
      } else {
        debug.log('Invalid response data structure:', responseData);
        message.error(responseData.message || '获取订单列表失败：数据格式错误');
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

  const handleAddTraffic = async (traffic: number) => {
    if (!selectedOrder) {
      message.error('请先选择订单');
      return;
    }

    // 检查必要的参数是否存在
    if (!selectedOrder.orderNo) {
      message.error('订单号不存在');
      return;
    }

    debug.log('选中的订单详细信息:', {
      id: selectedOrder.id,
      orderNo: selectedOrder.orderNo,
      userId: selectedOrder.userId,
      username: selectedOrder.username,
      poolType: selectedOrder.poolType,
      proxyInfo: selectedOrder.proxyInfo
    });

    const params = {
      appOrderNo: selectedOrder.orderNo,  // 使用orderNo而不是proxyInfo.appOrderNo
      productNo: selectedOrder.poolType,  // 使用poolType作为productNo
      proxyType: 104, // 动态国外
      appUsername: selectedOrder.username,  // 使用订单的username
      traffic: traffic
    };

    debug.log('增加流量请求参数:', JSON.stringify(params, null, 2));
    debug.log('selectedOrder:', JSON.stringify(selectedOrder, null, 2));

    setAddTrafficLoading(true);
    try {
      debug.log('发送请求前的参数:', params);
      const response = await api.post('/api/dynamic/add-traffic', params);
      debug.log('增加流量响应:', response);

      if (response.data.code === 0 || response.data.code === 200) {
        message.success('增加流量成功');
        setAddTrafficVisible(false);
        // 刷新订单列表
        fetchOrders({
          current: pagination.current,
          pageSize: pagination.pageSize
        });
      } else {
        message.error(response.data.message || '增加流量失败');
      }
    } catch (error: any) {
      debug.log('增加流量错误:', error);
      debug.log('错误响应数据:', error.response?.data);
      debug.log('错误响应状态:', error.response?.status);
      debug.log('错误响应详情:', error.response?.statusText);
      
      // 显示详细的错误信息
      const errorMessage = error.response?.data?.detail?.message 
        || error.response?.data?.message 
        || error.message 
        || '增加流量失败';
      
      message.error(errorMessage);
    } finally {
      setAddTrafficLoading(false);
    }
  };

  const columns: ColumnsType<DynamicOrder> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
      render: (text) => text || '-'
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text, record) => record.username || '-'
    },
    {
      title: '资源类型',
      dataIndex: 'poolType',
      key: 'poolType',
      width: 120,
      render: (text: PoolType) => POOL_TYPE_MAP[text] || text
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (text) => text || '-'
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<CopyOutlined />}
            onClick={() => handleCopyOrderNo(record.orderNo)}
          >
            复制订单号
          </Button>
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedOrder(record);
              setAddTrafficVisible(true);
            }}
          >
            增加流量
          </Button>
        </Space>
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
      <AddTrafficModal
        visible={addTrafficVisible}
        onCancel={() => {
          setAddTrafficVisible(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleAddTraffic}
        loading={addTrafficLoading}
        orderNo={selectedOrder?.orderNo || ''}  // 传入订单号
      />
    </Card>
  );
};

export default DynamicOrderList; 