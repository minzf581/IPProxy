import React, { useState, useEffect } from 'react';
import { Table, Card, Form, Input, Button, Space, Select, message, Tag, Modal, Spin, Alert, InputNumber, Tooltip } from 'antd';
import { SearchOutlined, SyncOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import type { ApiResponse } from '@/types/api';
import type { DynamicProxyParams, DynamicProxyPool } from '@/types/instance';
import type { DynamicOrder } from '@/types/order';
import ipProxyAPI from '@/utils/ipProxyAPI';
import { formatTraffic } from '@/utils/format';

const { Option } = Select;

interface DynamicProxyPageState {
  proxies: DynamicOrder[];
  loading: boolean;
  pagination: TablePaginationConfig;
  searchParams: Record<string, any>;
}

// 防抖函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const DynamicProxyPage: React.FC = () => {
  const [form] = Form.useForm();
  const [openForm] = Form.useForm();
  const [state, setState] = useState<DynamicProxyPageState>({
    proxies: [],
    loading: false,
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    searchParams: {},
  });
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [calculating, setCalculating] = useState(false);
  const [proxyPools, setProxyPools] = useState<DynamicProxyPool[]>([]);
  const [openLoading, setOpenLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProxies = async (
    page = state.pagination.current || 1,
    pageSize = state.pagination.pageSize || 10,
    params = state.searchParams
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const response = await ipProxyAPI.getDynamicProxies({
        page,
        pageSize,
        ...params,
      });

      if (response.code === 0 && response.data) {
        setState(prev => ({
          ...prev,
          proxies: response.data.list,
          pagination: {
            ...prev.pagination,
            current: page,
            total: response.data.total,
          },
        }));
      } else {
        message.error(response.msg || '获取代理列表失败');
      }
    } catch (error) {
      console.error('获取代理列表失败:', error);
      message.error('获取代理列表失败');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchProxyPools = async () => {
    try {
      const response = await ipProxyAPI.getProxyPools();
      if (response.code === 0 && response.data) {
        setProxyPools(response.data);
      } else {
        message.error(response.msg || '获取代理池列表失败');
      }
    } catch (error) {
      console.error('获取代理池列表失败:', error);
      message.error('获取代理池列表失败');
    }
  };

  useEffect(() => {
    fetchProxies();
    fetchProxyPools();
  }, []);

  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: any
  ) => {
    fetchProxies(newPagination.current, newPagination.pageSize, {
      ...state.searchParams,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters,
    });
  };

  const handleSearch = (values: any) => {
    setState(prev => ({ ...prev, searchParams: values }));
    fetchProxies(1, state.pagination.pageSize, values);
  };

  const handleReset = () => {
    form.resetFields();
    setState(prev => ({ ...prev, searchParams: {} }));
    fetchProxies(1, state.pagination.pageSize, {});
  };

  const handleRefreshProxy = async (record: DynamicOrder) => {
    try {
      await ipProxyAPI.refreshDynamicProxy(record.orderNo);
      message.success('代理已刷新');
      fetchProxies();
    } catch (error) {
      console.error('刷新代理失败:', error);
      message.error('刷新代理失败');
    }
  };

  // 计算价格的防抖
  const calculatePriceDebounced = React.useCallback(
    debounce(async (values: Partial<DynamicProxyParams>) => {
      if (!values.poolId || !values.trafficAmount) return;
      
      try {
        setPriceLoading(true);
        setFormError(null);
        const response = await ipProxyAPI.calculateDynamicProxyPrice({
          poolId: values.poolId,
          trafficAmount: values.trafficAmount
        });
        if (response.code === 0) {
          setCalculatedPrice(response.data.price);
        } else {
          setFormError(response.msg || '计算价格失败');
        }
      } catch (error) {
        console.error('计算价格失败:', error);
        setFormError('计算价格失败，请稍后重试');
      } finally {
        setPriceLoading(false);
      }
    }, 500),
    []
  );

  // 处理表单值变化
  const handleFormValuesChange = (changedValues: Partial<DynamicProxyParams>, allValues: Partial<DynamicProxyParams>) => {
    if ('poolId' in changedValues || 'trafficAmount' in changedValues) {
      calculatePriceDebounced(allValues);
    }
  };

  // 处理开通代理
  const handleOpenProxy = async (values: DynamicProxyParams) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const response = await ipProxyAPI.openDynamicProxy(values);
      if (response.code === 0) {
        message.success('开通成功');
        setOpenModalVisible(false);
        openForm.resetFields();
        fetchProxies();
      } else {
        message.error(response.msg || '开通失败');
      }
    } catch (error) {
      console.error('开通代理失败:', error);
      message.error('开通代理失败');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // 开通表单
  const openProxyForm = (
    <Form
      form={openForm}
      layout="vertical"
      onFinish={handleOpenProxy}
      onValuesChange={handleFormValuesChange}
    >
      {formError && (
        <Alert
          message={formError}
          type="error"
          showIcon
          closable
          className="mb-4"
          onClose={() => setFormError(null)}
        />
      )}

      <Form.Item
        name="poolId"
        label={
          <Space>
            <span>IP池</span>
            <Tooltip title="选择合适的IP池，不同IP池的价格和性能可能不同">
              <QuestionCircleOutlined />
            </Tooltip>
          </Space>
        }
        rules={[{ required: true, message: '请选择IP池' }]}
      >
        <Select 
          placeholder="请选择IP池"
          loading={state.loading}
          disabled={openLoading}
        >
          {proxyPools.map(pool => (
            <Option key={pool.id} value={pool.id}>
              <Space>
                <span>{pool.name}</span>
                <Tag color="blue">¥{pool.price}/GB</Tag>
                {pool.description && (
                  <Tooltip title={pool.description}>
                    <QuestionCircleOutlined />
                  </Tooltip>
                )}
              </Space>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="trafficAmount"
        label={
          <Space>
            <span>流量(GB)</span>
            <Tooltip title="设置需要购买的流量数量，最小单位为1GB">
              <QuestionCircleOutlined />
            </Tooltip>
          </Space>
        }
        rules={[
          { required: true, message: '请输入流量' },
          { type: 'number', min: 1, message: '流量必须大于等于1GB' },
          { type: 'number', max: 10000, message: '流量不能超过10000GB' }
        ]}
      >
        <InputNumber
          min={1}
          max={10000}
          placeholder="请输入流量"
          style={{ width: '100%' }}
          disabled={openLoading}
          addonAfter="GB"
        />
      </Form.Item>

      <Form.Item
        name="username"
        label="用户名"
        rules={[
          { min: 4, message: '用户名至少4个字符' },
          { max: 20, message: '用户名最多20个字符' },
          { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
        ]}
      >
        <Input 
          placeholder="请输入用户名（选填）"
          disabled={openLoading}
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="密码"
        rules={[
          { min: 6, message: '密码至少6个字符' },
          { max: 20, message: '密码最多20个字符' }
        ]}
      >
        <Input.Password 
          placeholder="请输入密码（选填）"
          disabled={openLoading}
        />
      </Form.Item>

      <Form.Item
        name="remark"
        label="备注"
        rules={[
          { max: 100, message: '备注最多100个字符' }
        ]}
      >
        <Input.TextArea 
          placeholder="请输入备注（选填）"
          disabled={openLoading}
          rows={3}
        />
      </Form.Item>

      {(calculatedPrice > 0 || priceLoading) && (
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <span className="text-gray-600">预计费用：</span>
              {priceLoading ? (
                <Spin size="small" />
              ) : (
                <span className="text-lg font-bold text-red-500">¥{calculatedPrice.toFixed(2)}</span>
              )}
            </div>
            <div className="text-gray-400 text-sm">
              * 实际费用可能会因为市场价格波动而变化
            </div>
          </Space>
        </div>
      )}
    </Form>
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'orderNo',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'IP池',
      dataIndex: 'proxyList',
      width: 120,
      render: (proxyList: any[]) => proxyList?.[0]?.location || '-',
    },
    {
      title: '用户名',
      dataIndex: 'proxyList',
      width: 120,
      render: (proxyList: any[]) => proxyList?.[0]?.username || '-',
    },
    {
      title: '密码',
      dataIndex: 'proxyList',
      width: 120,
      render: () => '******',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'error'}>
          {status === 'active' ? '正常' : '异常'}
        </Tag>
      ),
    },
    {
      title: '总流量(GB)',
      dataIndex: 'quantity',
      width: 120,
      render: (quantity: number) => (quantity / 1024).toFixed(2),
    },
    {
      title: '已用流量(GB)',
      dataIndex: 'usedTraffic',
      width: 120,
      render: (traffic: number) => (traffic / 1024).toFixed(2),
    },
    {
      title: '剩余流量(GB)',
      dataIndex: 'remainingTraffic',
      width: 120,
      render: (traffic: number) => (traffic / 1024).toFixed(2),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '过期时间',
      dataIndex: 'expiredAt',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 120,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 100,
      render: (record: DynamicOrder) => (
        <Button
          type="link"
          onClick={() => handleRefreshProxy(record)}
          loading={state.loading}
        >
          刷新
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <Form
            form={form}
            layout="inline"
            onFinish={handleSearch}
          >
            <Form.Item name="ip" label="IP地址">
              <Input placeholder="请输入IP地址" allowClear />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select placeholder="请选择状态" allowClear style={{ width: 120 }}>
                <Option value="active">正常</Option>
                <Option value="error">异常</Option>
              </Select>
            </Form.Item>
            <Form.Item name="protocol" label="协议">
              <Select placeholder="请选择协议" allowClear style={{ width: 120 }}>
                <Option value="http">HTTP</Option>
                <Option value="https">HTTPS</Option>
                <Option value="socks5">SOCKS5</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button icon={<SyncOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
          <Button
            type="primary"
            onClick={() => setOpenModalVisible(true)}
          >
            开通代理
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={state.proxies}
          loading={state.loading}
          pagination={state.pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          rowKey="id"
        />
      </Card>

      <Modal
        title="开通动态代理"
        open={openModalVisible}
        onOk={() => openForm.submit()}
        onCancel={() => {
          setOpenModalVisible(false);
          openForm.resetFields();
          setCalculatedPrice(0);
          setFormError(null);
        }}
        confirmLoading={openLoading}
        width={600}
        maskClosable={false}
        destroyOnClose
        okText="确认开通"
        cancelText="取消"
        okButtonProps={{
          disabled: calculatedPrice <= 0 || priceLoading
        }}
      >
        {openProxyForm}
      </Modal>
    </div>
  );
};

export default DynamicProxyPage;
