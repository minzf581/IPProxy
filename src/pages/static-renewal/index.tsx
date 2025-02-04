import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Space,
  Select,
  message,
  Modal,
  Checkbox,
  Typography,
  Tag,
  Row,
  Col,
  InputNumber,
  Tooltip,
  Statistic
} from 'antd';
import type { TableProps } from 'antd';
import {
  SearchOutlined,
  ExportOutlined,
  ReloadOutlined,
  FileTextOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';
import styles from './index.module.less';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

interface StaticIPInfo {
  id: number;
  host: string;
  port: number;
  username: string;
  password: string;
  user_account: string;
  type: string;
  status: 'active' | 'expired';
  created_at: string;
  expired_at: string;
}

interface RenewalModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: any) => Promise<void>;
  selectedIPs: StaticIPInfo[];
  balance: number;
  loading: boolean;
}

interface StaticIPStats {
  total_opened: number;
  available: number;
  expired: number;
}

const RenewalModal: React.FC<RenewalModalProps> = ({
  visible,
  onCancel,
  onOk,
  selectedIPs,
  balance,
  loading
}) => {
  const [form] = Form.useForm();
  const [totalCost, setTotalCost] = useState(0);

  const handleDurationChange = (value: number) => {
    // 这里需要根据实际的价格计算逻辑来计算总费用
    const unitPrice = 10; // 假设单价是10元/月
    setTotalCost(value * selectedIPs.length * unitPrice);
  };

  return (
    <Modal
      title="续费"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          支付
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onOk}
      >
        <Form.Item label="账户">
          <Input value={selectedIPs[0]?.user_account} disabled />
        </Form.Item>
        
        <Form.Item
          name="duration"
          label="续费时长"
          rules={[{ required: true, message: '请选择续费时长' }]}
        >
          <Select onChange={handleDurationChange}>
            <Option value={1}>1个月</Option>
            <Option value={3}>3个月</Option>
            <Option value={6}>6个月</Option>
            <Option value={12}>12个月</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
        >
          <TextArea placeholder="请输入" />
        </Form.Item>

        <Form.Item label="剩余额度">
          <Input value={`￥${balance.toFixed(2)}`} disabled />
        </Form.Item>

        <Form.Item label="总计费用">
          <Input value={`￥${totalCost.toFixed(2)}`} disabled />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const StaticRenewalPage: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StaticIPInfo[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [renewalModalVisible, setRenewalModalVisible] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const { user } = useAuth();
  const [stats, setStats] = useState<StaticIPStats>({
    total_opened: 0,
    available: 0,
    expired: 0
  });

  // 获取统计数据
  const fetchStats = async () => {
    try {
      // TODO: 实现获取统计数据的API调用
      const response = await fetch('/api/static-ip/stats');
      const data = await response.json();
      if (data.code === 0) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const staticTypes = [
    '纯净静态1',
    '纯净静态2',
    '纯净静态3',
    '纯净静态4',
    '纯净静态5',
    '纯净静态7'
  ];

  const handleSearch = async (values: any) => {
    setLoading(true);
    try {
      // TODO: 实现搜索逻辑
      console.log('Search values:', values);
    } catch (error) {
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchQuery = async (values: any) => {
    setLoading(true);
    try {
      // TODO: 实现批量查询逻辑
      console.log('Batch query values:', values);
    } catch (error) {
      message.error('批量查询失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要导出的IP');
      return;
    }

    const selectedData = data.filter(item => selectedRowKeys.includes(item.id));
    const content = selectedData.map(item => {
      return `${item.host}:${item.port}:${item.username}:${item.password}`;
    }).join('\n');

    const footer = `\n开通时间：${selectedData[0].created_at}\n到期时间：${selectedData[0].expired_at}`;
    
    const blob = new Blob([content + footer], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `static_ips_${dayjs().format('YYYYMMDD_HHmmss')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleRenewal = async (values: any) => {
    try {
      // TODO: 实现续费逻辑
      console.log('Renewal values:', values);
      message.success('续费成功');
      setRenewalModalVisible(false);
    } catch (error) {
      message.error('续费失败');
    }
  };

  const columns = [
    {
      title: '用户账户',
      dataIndex: 'user_account',
      key: 'user_account',
    },
    {
      title: 'IP信息',
      key: 'ip_info',
      render: (record: StaticIPInfo) => (
        `${record.host}:${record.port}:${record.username}:${record.password}`
      ),
    },
    {
      title: '静态类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '开通时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '到期时间',
      dataIndex: 'expired_at',
      key: 'expired_at',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? '运行中' : '已过期'}
        </Tag>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card bordered={false}>
        <Row gutter={[16, 16]} className={styles.statsRow}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="累积开通数量"
                value={stats.total_opened}
                suffix="个"
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="可用IP数量"
                value={stats.available}
                suffix="个"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="已过期IP数量"
                value={stats.expired}
                suffix="个"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="user_account" label="用户账号">
                <Input placeholder="请输入用户账号" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="type" label="静态类型">
                <Select placeholder="请选择">
                  {staticTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择">
                  <Option value="active">运行中</Option>
                  <Option value="expired">已过期</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={() => searchForm.submit()}
                  >
                    搜索
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => searchForm.resetFields()}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Form layout="vertical" onFinish={handleBatchQuery}>
          <Form.Item name="batch_ips" label="批量查询">
            <TextArea
              placeholder="请输入IP信息，格式：主机地址:端口:用户名:密码，每行一条"
              rows={4}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              批量查询
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.tableToolbar}>
          <Space>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
              disabled={selectedRowKeys.length === 0}
            >
              导出
            </Button>
            <Button
              type="primary"
              icon={<ClockCircleOutlined />}
              onClick={() => setRenewalModalVisible(true)}
              disabled={selectedRowKeys.length === 0}
            >
              续费
            </Button>
          </Space>
          <Space>
            <span>显示数量：</span>
            <InputNumber
              min={1}
              value={pageSize}
              onChange={(value) => setPageSize(value || 10)}
            />
            <Button onClick={() => setPageSize(999999)}>
              显示全部
            </Button>
          </Space>
        </div>

        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize,
            showSizeChanger: false,
          }}
        />

        <RenewalModal
          visible={renewalModalVisible}
          onCancel={() => setRenewalModalVisible(false)}
          onOk={handleRenewal}
          selectedIPs={data.filter(item => selectedRowKeys.includes(item.id))}
          balance={1000} // TODO: 从用户数据中获取实际余额
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default StaticRenewalPage; 