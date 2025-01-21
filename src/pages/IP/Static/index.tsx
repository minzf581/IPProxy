import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Space,
  message,
  Modal,
  Tooltip,
  Badge
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  SyncOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import styles from './index.module.less';

const { RangePicker } = DatePicker;

interface StaticIPData {
  id: string;
  ip: string;
  port: number;
  username: string;
  password: string;
  location: string;
  status: 'active' | 'inactive' | 'expired';
  type: string;
  bandwidth: string;
  expireTime: string;
  createTime: string;
  lastActiveTime: string;
}

const StaticIPPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StaticIPData[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // 表格列配置
  const columns: ColumnsType<StaticIPData> = [
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 150,
      fixed: 'left',
    },
    {
      title: '端口',
      dataIndex: 'port',
      key: 'port',
      width: 100,
    },
    {
      title: '认证信息',
      key: 'auth',
      width: 200,
      render: (_, record) => (
        <>
          <div>用户名：{record.username}</div>
          <div>密码：{record.password}</div>
        </>
      ),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusMap = {
          active: { color: 'success', text: '活跃' },
          inactive: { color: 'warning', text: '不活跃' },
          expired: { color: 'error', text: '已过期' },
        };
        const { color, text } = statusMap[status as keyof typeof statusMap];
        return <Badge status={color as any} text={text} />;
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: '带宽',
      dataIndex: 'bandwidth',
      key: 'bandwidth',
      width: 120,
    },
    {
      title: '到期时间',
      dataIndex: 'expireTime',
      key: 'expireTime',
      width: 180,
      render: (time: string) => {
        const isNearExpire = dayjs(time).diff(dayjs(), 'day') <= 7;
        return (
          <Tooltip title={isNearExpire ? '即将到期' : ''}>
            <span style={{ color: isNearExpire ? '#faad14' : 'inherit' }}>
              {isNearExpire && <ClockCircleOutlined style={{ marginRight: 4 }} />}
              {time}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActiveTime',
      key: 'lastActiveTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record: StaticIPData) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<SyncOutlined />}
            onClick={() => handleRefreshIP(record.id)}
          >
            刷新
          </Button>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
        </Space>
      ),
    },
  ];

  // 处理表格变化
  const handleTableChange: TableProps<StaticIPData>['onChange'] = (
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
      const response = await fetch('/api/static-ips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      const result = await response.json();
      
      // 模拟数据
      const mockData: StaticIPData[] = Array(10).fill(null).map((_, index) => ({
        id: `${index + 1}`,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        port: Math.floor(Math.random() * 60000) + 1024,
        username: `user${index + 1}`,
        password: `pass${index + 1}`,
        location: ['中国', '美国', '日本', '韩国', '新加坡'][Math.floor(Math.random() * 5)],
        status: ['active', 'inactive', 'expired'][Math.floor(Math.random() * 3)] as any,
        type: ['HTTP', 'HTTPS', 'SOCKS5'][Math.floor(Math.random() * 3)],
        bandwidth: ['1Mbps', '5Mbps', '10Mbps', '20Mbps'][Math.floor(Math.random() * 4)],
        expireTime: dayjs().add(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD HH:mm:ss'),
        createTime: dayjs().subtract(index, 'day').format('YYYY-MM-DD HH:mm:ss'),
        lastActiveTime: dayjs().subtract(Math.floor(Math.random() * 24), 'hour').format('YYYY-MM-DD HH:mm:ss'),
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

  // 刷新IP
  const handleRefreshIP = async (id: string) => {
    try {
      // TODO: 替换为实际的API调用
      await fetch(`/api/static-ips/${id}/refresh`, {
        method: 'POST',
      });
      message.success('IP刷新成功');
      fetchData({
        current: pagination.current,
        pageSize: pagination.pageSize,
        ...form.getFieldsValue(),
      });
    } catch (error) {
      message.error('IP刷新失败');
    }
  };

  // 查看详情
  const handleViewDetails = (record: StaticIPData) => {
    Modal.info({
      title: 'IP详情',
      width: 600,
      content: (
        <div className={styles.ipDetail}>
          <p><strong>IP地址：</strong>{record.ip}</p>
          <p><strong>端口：</strong>{record.port}</p>
          <p><strong>用户名：</strong>{record.username}</p>
          <p><strong>密码：</strong>{record.password}</p>
          <p><strong>位置：</strong>{record.location}</p>
          <p><strong>状态：</strong>
            <Badge 
              status={
                record.status === 'active' ? 'success' :
                record.status === 'inactive' ? 'warning' : 'error'
              } 
              text={
                record.status === 'active' ? '活跃' :
                record.status === 'inactive' ? '不活跃' : '已过期'
              }
            />
          </p>
          <p><strong>类型：</strong>{record.type}</p>
          <p><strong>带宽：</strong>{record.bandwidth}</p>
          <p><strong>到期时间：</strong>{record.expireTime}</p>
          <p><strong>创建时间：</strong>{record.createTime}</p>
          <p><strong>最后活跃：</strong>{record.lastActiveTime}</p>
        </div>
      ),
    });
  };

  // 批量操作
  const handleBatchOperation = (operation: string) => {
    Modal.confirm({
      title: `确认${operation}选中的IP？`,
      content: `您选择了 ${selectedRowKeys.length} 个IP，确定要${operation}吗？`,
      onOk: async () => {
        try {
          // TODO: 替换为实际的API调用
          await fetch('/api/static-ips/batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              operation,
              ids: selectedRowKeys,
            }),
          });
          message.success(`批量${operation}成功`);
          setSelectedRowKeys([]);
          fetchData({
            current: pagination.current,
            pageSize: pagination.pageSize,
            ...form.getFieldsValue(),
          });
        } catch (error) {
          message.error(`批量${operation}失败`);
        }
      },
    });
  };

  // 初始化加载数据
  React.useEffect(() => {
    fetchData({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  }, []);

  return (
    <div className={styles.staticIP}>
      <Card bordered={false}>
        <Form
          form={form}
          layout="inline"
          className={styles.searchForm}
          onFinish={handleSearch}
        >
          <Form.Item name="ip">
            <Input
              placeholder="请输入IP地址"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="location">
            <Input
              placeholder="请输入位置"
              allowClear
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="status">
            <Select
              placeholder="IP状态"
              allowClear
              style={{ width: 120 }}
              options={[
                { label: '活跃', value: 'active' },
                { label: '不活跃', value: 'inactive' },
                { label: '已过期', value: 'expired' },
              ]}
            />
          </Form.Item>
          <Form.Item name="type">
            <Select
              placeholder="IP类型"
              allowClear
              style={{ width: 120 }}
              options={[
                { label: 'HTTP', value: 'HTTP' },
                { label: 'HTTPS', value: 'HTTPS' },
                { label: 'SOCKS5', value: 'SOCKS5' },
              ]}
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

        <div className={styles.batchOperations}>
          <Space>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() => handleBatchOperation('刷新')}
            >
              批量刷新
            </Button>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() => handleBatchOperation('续期')}
            >
              批量续期
            </Button>
          </Space>
          <span className={styles.selectedCount}>
            已选择 {selectedRowKeys.length} 项
          </span>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            ...pagination,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1800 }}
          className={styles.table}
        />
      </Card>
    </div>
  );
};

export default StaticIPPage; 