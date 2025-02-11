import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  DatePicker,
  Button,
  Table,
  Space,
  message,
  Modal
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import styles from './index.module.less';
import { getAgentOrders } from '@/services/agentService';

const { RangePicker } = DatePicker;

interface OrderData {
  id: string;
  order_no: string;
  agent_id: string;
  amount: number;
  created_at: string;
  status: string;
  type: string;
  remark?: string;
}

const AgentOrders: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OrderData[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<OrderData | null>(null);

  // 表格列配置
  const columns: ColumnsType<OrderData> = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      fixed: 'left',
    },
    {
      title: '代理商',
      dataIndex: 'agent_id',
      key: 'agent_id',
      width: 120,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_: unknown, record: OrderData) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  // 处理表格变化
  const handleTableChange: TableProps<OrderData>['onChange'] = (
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
      const { data } = await getAgentOrders({
        agentId: params.agentId,
        page: params.current || 1,
        pageSize: params.pageSize || 10,
        status: params.status,
      });

      setData(data.list);
      setPagination({
        ...pagination,
        total: data.total,
      });
    } catch (error) {
      console.error('获取代理商订单列表失败:', error);
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
  const handleViewDetails = (order: OrderData) => {
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
    <div className={styles.agentOrders}>
      <Card bordered={false}>
        <Form
          form={form}
          layout="inline"
          className={styles.searchForm}
          onFinish={handleSearch}
        >
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
          scroll={{ x: 1000 }}
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
            <p>订单号：{currentOrder.order_no}</p>
            <p>代理商：{currentOrder.agent_id}</p>
            <p>金额：¥{currentOrder.amount.toFixed(2)}</p>
            <p>状态：{currentOrder.status}</p>
            <p>类型：{currentOrder.type}</p>
            <p>创建时间：{currentOrder.created_at}</p>
            {currentOrder.remark && <p>备注：{currentOrder.remark}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AgentOrders;
