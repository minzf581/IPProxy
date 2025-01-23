import React from 'react';
import { Card, Row, Col, Progress, Select, Typography } from 'antd';
import { getDashboardData } from '@/services/dashboard';
import { getAgentList } from '@/services/agentService';
import { useLocation } from 'react-router-dom';
import type { AgentInfo } from '@/types/agent';
import styles from './dashboard.module.less';

const { Title } = Typography;
const { Option } = Select;

const Dashboard: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = React.useState(false);
  const [currentAgent, setCurrentAgent] = React.useState<AgentInfo | null>(null);
  const [agents, setAgents] = React.useState<AgentInfo[]>([]);
  const [dashboardData, setDashboardData] = React.useState<any>(null);

  // 从 URL 参数中获取代理商 ID
  const searchParams = new URLSearchParams(location.search);
  const agentId = searchParams.get('agentId');

  // 加载代理商列表
  const loadAgents = async () => {
    try {
      const result = await getAgentList({ page: 1, pageSize: 100 });
      setAgents(result.list);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  // 加载仪表盘数据
  const loadDashboardData = async (id?: string) => {
    try {
      setLoading(true);
      const data = await getDashboardData(id);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理代理商切换
  const handleAgentChange = (value: string) => {
    const agent = agents.find(a => String(a.id) === value);
    setCurrentAgent(agent || null);
    loadDashboardData(value);
  };

  React.useEffect(() => {
    loadAgents();
  }, []);

  React.useEffect(() => {
    if (agentId) {
      const agent = agents.find(a => String(a.id) === agentId);
      if (agent) {
        setCurrentAgent(agent);
        loadDashboardData(agentId);
      }
    } else {
      loadDashboardData();
    }
  }, [agentId, agents]);

  if (!dashboardData) {
    return null;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <Title level={4} style={{ margin: 0 }}>
          {currentAgent ? `${currentAgent.app_username} 的仪表盘` : '我的仪表盘'}
        </Title>
        <Select
          style={{ width: 200 }}
          placeholder="切换用户"
          value={currentAgent?.id}
          onChange={handleAgentChange}
          allowClear
        >
          <Option value="">我的仪表盘</Option>
          {agents.map(agent => (
            <Option key={agent.id} value={agent.id}>
              {agent.app_username}
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
                ¥{dashboardData.statistics?.total_recharge?.toLocaleString() || 0}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <div className={styles.statisticCard}>
              <div className={styles.title}>累计消费</div>
              <div className={styles.value}>
                ¥{dashboardData.statistics?.total_consumption?.toLocaleString() || 0}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <div className={styles.statisticCard}>
              <div className={styles.title}>剩余金额</div>
              <div className={styles.value}>
                ¥{dashboardData.statistics?.balance?.toLocaleString() || 0}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <div className={styles.statisticCard}>
              <div className={styles.title}>本月充值</div>
              <div className={styles.value}>
                ¥{dashboardData.statistics?.monthly_recharge?.toLocaleString() || 0}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <div className={styles.statisticCard}>
              <div className={styles.title}>本月消费</div>
              <div className={styles.value}>
                ¥{dashboardData.statistics?.monthly_consumption?.toLocaleString() || 0}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <div className={styles.statisticCard}>
              <div className={styles.title}>上月消费</div>
              <div className={styles.value}>
                ¥{dashboardData.statistics?.last_month_consumption?.toLocaleString() || 0}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card title="动态资源使用情况">
            <Row gutter={[16, 16]}>
              {dashboardData.dynamic_resources?.map((resource: any, index: number) => (
                <Col span={8} key={index}>
                  <Card title={`动态资源${index + 1}`} size="small">
                    <Progress percent={resource.usage_rate} />
                    <div className={styles.resourceInfo}>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>累计：</span>
                        <span className={styles.value}>{resource.total_usage}G</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>本月：</span>
                        <span className={styles.value}>{resource.monthly_usage}G</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>今日：</span>
                        <span className={styles.value}>{resource.daily_usage}G</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>上月：</span>
                        <span className={styles.value}>{resource.last_month_usage}G</span>
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
              {dashboardData.static_resources?.map((resource: any, index: number) => (
                <Col span={6} key={index}>
                  <Card title={`静态资源${index + 1}`} size="small">
                    <Progress percent={resource.usage_rate} />
                    <div className={styles.resourceInfo}>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>累计开通：</span>
                        <span className={styles.value}>{resource.total_opened}条</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>上月开通：</span>
                        <span className={styles.value}>{resource.last_month_opened}条</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>本月开通：</span>
                        <span className={styles.value}>{resource.monthly_opened}条</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>剩余可用：</span>
                        <span className={styles.value}>{resource.available}条</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>已过期：</span>
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
    </div>
  );
};

export default Dashboard;