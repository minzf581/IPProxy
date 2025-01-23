import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Space,
  message,
  Modal,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import styles from './index.module.less';

const { RangePicker } = DatePicker;

interface DynamicOrderData {
  id: string;
  orderNo: string;
  userId: string;
  agentId: string;
  resourceType: '动态资源1' | '动态资源2' | '动态资源3';
  flowLimit: number; // GB
  deductAmount: number; // 扣费额度
  createTime: string;
}

const DynamicOrderPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DynamicOrderData[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<DynamicOrderData | null>(null);

  // 表格列配置
  const columns: ColumnsType<DynamicOrderData> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      fixed: 'left',
    },
    {
      title: '用户账号',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
    },
    {
      title: '代理商账号',
      dataIndex: 'agentId',
      key: 'agentId',
      width: 120,
    },
    {
      title: '资源来源',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 120,
    },
    {
      title: '流量限制',
      dataIndex: 'flowLimit',
      key: 'flowLimit',
      width: 120,
      render: (flowLimit: number) => `${flowLimit}GB`,
    },
    {
      title: '扣费额度',
      dataIndex: 'deductAmount',
      key: 'deductAmount',
      width: 120,
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record: DynamicOrderData) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  // 处理表格变化
  const handleTableChange: TableProps<DynamicOrderData>['onChange'] = (
    pagination,
    filters,
    sorter
  ) => {
    fetchData({
      pageSize: pagination.pageSize,
      current: pagination.current,
      ...form.getFieldsValue(),
    });
  };

  // 获取数据
  const fetchData = async (params: any) => {
    setLoading(true);
    try {
      // TODO: 替换为实际的API调用
      const response = await fetch('/api/dynamic-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      
      // 模拟数据
      const mockData: DynamicOrderData[] = Array(10).fill(null).map((_, index) => ({
        id: `${index + 1}`,
        orderNo: `DD${dayjs().format('YYYYMMDD')}${String(index + 1).padStart(6, '0')}`,
        userId: `user${index + 1}`,
        agentId: `agent${Math.floor(index / 3) + 1}`,
        resourceType: ['动态资源1', '动态资源2', '动态资源3'][Math.floor(Math.random() * 3)] as any,
        flowLimit: [1, 10, 100, 1000][Math.floor(Math.random() * 4)],
        deductAmount: Math.floor(Math.random() * 10000) / 100,
        createTime: dayjs().subtract(index, 'day').format('YYYY-MM-DD HH:mm:ss'),
      }));
      
      setData(mockData);
      setPagination({
        ...pagination,
        total: 100,
      });
    } catch (error) {
      message.error('获取数据失败');
    }
    setLoading(false);
  };

  // 处理搜索
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchData({
      ...form.getFieldsValue(),
      current: 1,
      pageSize: pagination.pageSize,
    });
  };

  // 处理重置
  const handleReset = () => {
    form.resetFields();
    setPagination({ ...pagination, current: 1 });
    fetchData({
      current: 1,
      pageSize: pagination.pageSize,
    });
  };

  // 查看详情
  const handleViewDetails = (order: DynamicOrderData) => {
    setCurrentOrder(order);
    setDetailVisible(true);
  };

  // 初始化加载数据
  React.useEffect(() => {
    fetchData({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  }, []);

  return (
    <div className={styles.dynamicOrders}>
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
              placeholder="请输入用户账号"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="agentId">
            <Input
              placeholder="请输入代理商账号"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="dateRange">
            <RangePicker
              style={{ width: 260 }}
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>
          <Form.Item name="resourceType">
            <Select
              placeholder="请选择资源来源"
              allowClear
              style={{ width: 200 }}
              options={[
                { value: '动态资源1', label: '动态资源1' },
                { value: '动态资源2', label: '动态资源2' },
                { value: '动态资源3', label: '动态资源3' },
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
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
      >
        {currentOrder && (
          <div>
            <p>订单号：{currentOrder.orderNo}</p>
            <p>用户账号：{currentOrder.userId}</p>
            <p>代理商账号：{currentOrder.agentId}</p>
            <p>资源来源：{currentOrder.resourceType}</p>
            <p>流量限制：{currentOrder.flowLimit}GB</p>
            <p>扣费额度：¥{currentOrder.deductAmount.toFixed(2)}</p>
            <p>创建时间：{currentOrder.createTime}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DynamicOrderPage;
