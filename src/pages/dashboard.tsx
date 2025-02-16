import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Select, message, Spin } from 'antd';
import { getDashboardData } from '@/services/dashboard';
import { getAgentList } from '@/services/agentService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { AgentInfo, ApiResponse, AgentListResponse } from '@/types/agent';
import './dashboard.less';

const { Option } = Select;

const DashboardPage: React.FC = () => {
  console.log('DashboardPage 组件渲染');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlAgentId = searchParams.get('agentId');
  console.log('URL中的agentId:', urlAgentId);
  
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(urlAgentId || undefined);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  // 获取代理商列表
  const loadAgents = async () => {
    console.log('开始加载代理商列表');
    try {
      const response = await getAgentList({ page: 1, pageSize: 100 });
      console.log('代理商列表原始响应:', JSON.stringify(response, null, 2));
      
      // 验证响应数据结构
      if (!response || typeof response !== 'object') {
        throw new Error('API响应格式错误');
      }

      // 验证响应状态
      if (response.code !== 0) {
        throw new Error(response.msg || '获取代理商列表失败');
      }

      // 验证数据存在
      if (!response.data || !Array.isArray(response.data.list)) {
        throw new Error('代理商列表数据格式错误');
      }

      const agentList = response.data.list.map(agent => ({
        ...agent,
        id: agent.id.toString() // 确保 id 是字符串类型
      }));
      console.log('解析后的代理商列表:', JSON.stringify(agentList, null, 2));
      
      setAgents(agentList);
      
      // 如果URL中没有指定代理商ID，不自动选择第一个代理商
      if (urlAgentId) {
        setSelectedAgentId(urlAgentId);
      }
    } catch (error) {
      console.error('加载代理商列表失败:', error);
      message.error(error instanceof Error ? error.message : '获取代理商列表失败');
    } finally {
      console.log('代理商列表加载完成，设置initialized为true');
      setInitialized(true);
    }
  };

  // 加载仪表盘数据
  const loadDashboardData = async (agentId?: string) => {
    console.log('开始加载仪表盘数据, agentId:', agentId);
    setLoading(true);
    try {
      const response = await getDashboardData(agentId);
      console.log('仪表盘数据响应:', JSON.stringify(response, null, 2));
      if (response.code === 0 && response.data) {
        setDashboardData(response.data);
      } else {
        console.warn('仪表盘数据格式不正确:', response);
      }
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
      message.error('获取仪表盘数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理代理商选择变化
  const handleAgentChange = (value: string | undefined) => {
    console.log('代理商选择变更:', value);
    setSelectedAgentId(value);
    if (value) {
      navigate(`/dashboard?agentId=${value}`);
    } else {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    console.log('初始化useEffect执行');
    loadAgents();
  }, []);

  useEffect(() => {
    console.log('数据加载useEffect执行, initialized:', initialized, 'selectedAgentId:', selectedAgentId, 'agents:', agents);
    if (initialized) {
      loadDashboardData(selectedAgentId);
    }
  }, [selectedAgentId, initialized]);

  console.log('当前组件状态:', {
    initialized,
    agents: agents.length,
    selectedAgentId,
    loading,
    hasData: !!dashboardData,
    agentsList: agents
  });

  if (!initialized) {
    console.log('显示加载中状态');
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Card 
        title="仪表盘" 
        className="dashboard-card"
        extra={
          <Select
            style={{ width: 200 }}
            placeholder="选择代理商"
            allowClear
            value={selectedAgentId}
            onChange={handleAgentChange}
            loading={loading}
          >
            <Option value={undefined}>管理员仪表盘</Option>
            {agents && agents.length > 0 ? (
              agents.map(agent => (
                <Option key={agent.id} value={agent.id}>
                  {`${agent.username} (ID: ${agent.id})`}
                </Option>
              ))
            ) : (
              <Option value="" disabled>暂无代理商数据</Option>
            )}
          </Select>
        }
      >
        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="账户余额"
                  value={dashboardData?.agent?.balance || 0}
                  precision={2}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="累计充值"
                  value={dashboardData?.statistics?.total_recharge || 0}
                  precision={2}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="本月充值"
                  value={dashboardData?.statistics?.monthly_recharge || 0}
                  precision={2}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="累计消费"
                  value={dashboardData?.statistics?.total_consumption || 0}
                  precision={2}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="本月消费"
                  value={dashboardData?.statistics?.monthly_consumption || 0}
                  precision={2}
                  suffix="元"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总用户数"
                  value={dashboardData?.statistics?.total_users || 0}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="活跃用户数"
                  value={dashboardData?.statistics?.active_users || 0}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总订单数"
                  value={dashboardData?.statistics?.total_orders || 0}
                />
              </Card>
            </Col>
          </Row>
        </Spin>
      </Card>
    </div>
  );
};

export default DashboardPage;