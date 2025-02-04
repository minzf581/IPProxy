import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Select, Typography, Table, message } from 'antd';
import { getDashboardData, getAgentList } from '@/services/dashboardService';
import { useLocation, useParams } from 'react-router-dom';
import type { DashboardData, AgentListResponse } from '@/types/dashboard';
import { useAuth } from '@/hooks/useAuth';
import styles from './dashboard.module.less';

const { Title } = Typography;
const { Option } = Select;

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentListResponse['list'][0] | null>(null);
  const [agents, setAgents] = useState<AgentListResponse['list']>([]);
  const [data, setData] = useState<DashboardData | null>(null);

  // 加载代理商列表
  const loadAgents = async () => {
    try {
      const response = await getAgentList({ page: 1, pageSize: 100 });
      console.log('[Dashboard] Agent list response:', response);
      if (response.list) {
        setAgents(response.list);
        // 如果当前用户是代理，设置为默认选中的代理
        if (user?.agent_id) {
          const agent = response.list.find(agent => agent.id === user.agent_id);
          if (agent) {
            setCurrentAgent(agent);
          }
        }
      } else {
        message.error('获取代理列表失败');
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      message.error('获取代理列表失败');
    }
  };

  // 加载仪表盘数据
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // 优先使用选中的代理ID，如果没有则使用当前用户的代理ID
      const agentId = (currentAgent?.id ?? user?.agent_id) || undefined;
      console.log('[Dashboard] Loading dashboard data for agent:', agentId);
      const response = await getDashboardData(agentId);
      console.log('[Dashboard] Dashboard data response:', response);
      setData(response);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      message.error('获取仪表盘数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理代理商切换
  const handleAgentChange = (value: string) => {
    const agent = value ? agents.find(a => String(a.id) === value) ?? null : null;
    setCurrentAgent(agent);
  };

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [currentAgent]);

  if (loading || !data) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <Title level={4} style={{ margin: 0 }}>
          {currentAgent ? `${currentAgent.username} 的仪表盘` : '我的仪表盘'}
        </Title>
        <Select
          style={{ width: 200 }}
          placeholder="切换用户"
          value={currentAgent?.id?.toString()}
          onChange={handleAgentChange}
          allowClear
        >
          <Option value="">我的仪表盘</Option>
          {agents.map(agent => (
            <Option key={agent.id} value={String(agent.id)}>
              {agent.username}
            </Option>
          ))}
        </Select>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={4}>
          <Card>
            <div className={styles.statisticCard}>
              <div className={styles.title}>累计充值</div>
              <div className={styles.value}>
                ¥{data.statistics?.total_recharge?.toLocaleString() || 0}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <div className={styles.statisticCard}>
              <div className={styles.title}>累计消费</div>
              <div className={styles.value}>
                ¥{data.statistics?.total_consumption?.toLocaleString() || 0}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <div className={styles.statisticCard}>
              <div className={styles.title}>剩余金额</div>
              <div className={styles.value}>
                ¥{data.statistics?.balance?.toLocaleString() || 0}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <div className={styles.statisticCard}>
              <div className={styles.title}>本月充值</div>
              <div className={styles.value}>
                ¥{data.statistics?.monthly_recharge?.toLocaleString() || 0}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <div className={styles.statisticCard}>
              <div className={styles.title}>本月消费</div>
              <div className={styles.value}>
                ¥{data.statistics?.monthly_consumption?.toLocaleString() || 0}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <div className={styles.statisticCard}>
              <div className={styles.title}>上月消费</div>
              <div className={styles.value}>
                ¥{data.statistics?.last_month_consumption?.toLocaleString() || 0}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card title="动态资源使用情况">
            <Row gutter={[16, 16]}>
              {data.dynamic_resources?.map((resource, index) => (
                <Col span={8} key={index}>
                  <Card title={`动态资源${index + 1}`} size="small">
                    <Progress percent={resource.usage_rate} />
                    <div className={styles.resourceInfo}>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>累计：</span>
                        <span className={styles.value}>{resource.total}G</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>本月：</span>
                        <span className={styles.value}>{resource.monthly}G</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>今日：</span>
                        <span className={styles.value}>{resource.today}G</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>上月：</span>
                        <span className={styles.value}>{resource.last_month}G</span>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card title="静态资源使用情况">
            <Row gutter={[16, 16]}>
              {data.static_resources?.map((resource, index) => (
                <Col span={6} key={index}>
                  <Card title={`静态资源${index + 1}`} size="small">
                    <Progress percent={resource.usage_rate} />
                    <div className={styles.resourceInfo}>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>累计：</span>
                        <span className={styles.value}>{resource.total}条</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>本月：</span>
                        <span className={styles.value}>{resource.monthly}条</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>上月：</span>
                        <span className={styles.value}>{resource.last_month}条</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>可用：</span>
                        <span className={styles.value}>{resource.available}条</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>过期：</span>
                        <span className={styles.value}>{resource.expired}条</span>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="最近订单" style={{ marginTop: 16 }}>
        <Table
          dataSource={data.recentOrders}
          columns={[
            {
              title: '订单ID',
              dataIndex: 'id',
              key: 'id',
            },
            {
              title: '用户ID',
              dataIndex: 'userId',
              key: 'userId',
            },
            {
              title: '金额',
              dataIndex: 'amount',
              key: 'amount',
              render: (amount: number) => `¥${amount}`,
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
            },
            {
              title: '创建时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
            },
          ]}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default DashboardPage;