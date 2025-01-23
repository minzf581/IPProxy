import React from 'react';
import { Table, Button, Space, Input, Select, Form, message, Card, Divider } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import type { ColumnType } from 'antd/es/table';
import { getAgentList, updateAgent } from '@/services/agentService';
import { debug } from '@/utils/debug';
import UpdatePasswordModal from '@/components/Agent/UpdatePasswordModal';
import UpdateBalanceModal from '@/components/Agent/UpdateBalanceModal';
import CreateAgentModal from '@/components/Agent/CreateAgentModal';
import type { AgentInfo } from '@/types/agent';
import dayjs from 'dayjs';
import './index.less';
import { PlusOutlined } from '@ant-design/icons';
import UpdateRemarkModal from '@/components/Agent/UpdateRemarkModal';
import UpdateQuotaModal from '@/components/Agent/UpdateQuotaModal';
import PriceConfigModal from '@/components/Agent/PriceConfigModal';

const { Option } = Select;
const { Search } = Input;
const { dashboard: debugAgent } = debug;

interface SearchParams {
  page: number;
  pageSize: number;
  account?: string;
  status?: string;
}

const AgentListPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<{ list: AgentInfo[]; total: number }>({ list: [], total: 0 });
  const [pagination, setPagination] = React.useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [selectedAgent, setSelectedAgent] = React.useState<AgentInfo | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);
  const [balanceModalVisible, setBalanceModalVisible] = React.useState(false);
  const [createModalVisible, setCreateModalVisible] = React.useState(false);
  const [remarkModalVisible, setRemarkModalVisible] = React.useState(false);
  const [quotaModalVisible, setQuotaModalVisible] = React.useState(false);
  const [priceConfigModalVisible, setPriceConfigModalVisible] = React.useState(false);

  React.useEffect(() => {
    loadAgents();
  }, [pagination.current, pagination.pageSize]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      debugAgent.info('Loading agents list');
      
      const params: SearchParams = {
        page: Number(pagination.current) || 1,
        pageSize: Number(pagination.pageSize) || 10,
        ...form.getFieldsValue()
      };
      
      const result = await getAgentList(params);
      debugAgent.info('Agents list loaded successfully', result);
      
      setData(result);
      setPagination(prev => ({
        ...prev,
        total: result.total
      }));
    } catch (error) {
      debugAgent.error('Failed to load agents:', error);
      message.error('加载代理商列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (agent: AgentInfo) => {
    try {
      debugAgent.info('Updating agent status', agent);
      const newStatus = agent.status === 'active' ? 'disabled' : 'active';
      await updateAgent(Number(agent.id), { 
        status: newStatus,
        app_username: agent.app_username
      });
      message.success('状态更新成功');
      loadAgents();
    } catch (error) {
      debugAgent.error('Failed to update agent status:', error);
      message.error('更新代理商状态失败');
    }
  };

  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: any
  ) => {
    setPagination(newPagination);
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadAgents();
  };

  const handleReset = () => {
    form.resetFields();
    setPagination(prev => ({ ...prev, current: 1 }));
    loadAgents();
  };

  const columns: ColumnType<AgentInfo>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      align: 'center',
    },
    {
      title: '账号',
      dataIndex: 'app_username',
      key: 'app_username',
      width: 120,
      align: 'center',
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      align: 'center',
      render: (balance: number) => `¥${balance.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (status: string) => (
        <span className={status === 'active' ? 'statusActive' : 'statusDisabled'}>
          {status === 'active' ? '正常' : '禁用'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      align: 'center',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      align: 'center',
      render: (remark: string) => remark || '-',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      align: 'center',
      render: (_: unknown, record: AgentInfo) => (
        <div className="actionButtons">
          <Space direction="vertical" size="small">
            <Space size="small">
              <Button 
                type="link" 
                size="small"
                onClick={() => {
                  setSelectedAgent(record);
                  setRemarkModalVisible(true);
                }}
              >
                备注
              </Button>
              <Button 
                type="link" 
                size="small"
                onClick={() => {
                  setSelectedAgent(record);
                  setQuotaModalVisible(true);
                }}
              >
                调整额度
              </Button>
              <Button 
                type="link" 
                size="small"
                onClick={() => {
                  setSelectedAgent(record);
                  setPriceConfigModalVisible(true);
                }}
              >
                单价设置
              </Button>
            </Space>
            <Space size="small">
              <Button 
                type="link" 
                size="small"
                onClick={() => {
                  setSelectedAgent(record);
                  setPasswordModalVisible(true);
                }}
              >
                修改密码
              </Button>
              <Button 
                type="link"
                size="small"
                onClick={() => {
                  setSelectedAgent(record);
                  setBalanceModalVisible(true);
                }}
              >
                查看仪表盘
              </Button>
              <Button 
                type="link"
                size="small"
                className={record.status === 'active' ? 'dangerButton' : 'enableButton'}
                onClick={() => handleUpdateStatus(record)}
              >
                {record.status === 'active' ? '停用' : '启用'}
              </Button>
            </Space>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <div className="agentListPage">
      <Card className="searchCard">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Space>
            <Search
              placeholder="请输入代理商账户"
              style={{ width: 200 }}
              onSearch={handleSearch}
            />
            <Select
              placeholder="全部"
              style={{ width: 120 }}
              allowClear
              onChange={() => handleSearch()}
            >
              <Option value="active">正常</Option>
              <Option value="disabled">禁用</Option>
            </Select>
            <Button type="primary" onClick={handleSearch}>查询</Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
          <Button 
            type="primary" 
            onClick={() => setCreateModalVisible(true)}
            icon={<PlusOutlined />}
          >
            新增代理商
          </Button>
        </div>
      </Card>

      <Card className="tableCard">
        <Table
          className="agentTable"
          columns={columns}
          dataSource={data.list}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSize: 10,
            pageSizeOptions: ['10', '20', '50'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1100 }}
        />
      </Card>

      <CreateAgentModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={loadAgents}
      />

      {selectedAgent && (
        <>
          <UpdatePasswordModal
            visible={passwordModalVisible}
            agentId={Number(selectedAgent.id)}
            onClose={() => {
              setPasswordModalVisible(false);
              setSelectedAgent(null);
            }}
          />
          <UpdateBalanceModal
            visible={balanceModalVisible}
            agentId={Number(selectedAgent.id)}
            currentBalance={selectedAgent.balance}
            onClose={() => {
              setBalanceModalVisible(false);
              setSelectedAgent(null);
              loadAgents();
            }}
          />
          <UpdateRemarkModal
            visible={remarkModalVisible}
            agent={{
              id: Number(selectedAgent.id),
              remark: selectedAgent.remark
            }}
            onClose={() => {
              setRemarkModalVisible(false);
              setSelectedAgent(null);
              loadAgents();
            }}
          />
          <UpdateQuotaModal
            visible={quotaModalVisible}
            agent={{
              id: Number(selectedAgent.id),
              balance: selectedAgent.balance
            }}
            onClose={() => {
              setQuotaModalVisible(false);
              setSelectedAgent(null);
              loadAgents();
            }}
          />
          <PriceConfigModal
            visible={priceConfigModalVisible}
            agent={{
              id: Number(selectedAgent.id),
              price_config: selectedAgent.price_config
            }}
            onClose={() => {
              setPriceConfigModalVisible(false);
              setSelectedAgent(null);
              loadAgents();
            }}
          />
        </>
      )}
    </div>
  );
};

export default AgentListPage;
