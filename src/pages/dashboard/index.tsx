import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Button, Progress } from 'antd';
import { api } from '@/utils/request';
import styles from './index.module.less';
import { DashboardData as IDashboardData, DynamicResource, StaticResource } from '@/types/dashboard';
import type { Agent } from '@/types/agent';
import { AxiosError } from 'axios';

interface DashboardData {
  statistics: {
    balance: number;
    total_recharge: number;
    total_consumption: number;
    monthly_recharge: number;
    monthly_consumption: number;
    last_month_consumption: number;
  };
  dynamic_resources: Array<{
    name: string;
    total_usage: number;
    monthly_usage: number;
    daily_usage: number;
    last_month_usage: number;
    usage_rate: number;
  }>;
  static_resources: Array<{
    name: string;
    total_opened: number;
    monthly_opened: number;
    last_month_opened: number;
    available: number;
    expired: number;
    usage_rate: number;
  }>;
}

interface Props {
  currentAgent: Agent | null;
  setCurrentAgent: (agent: Agent | null) => void;
}

const Dashboard: React.FC<Props> = ({ currentAgent }) => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<IDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Dashboard mounted, currentAgent:', currentAgent);
    fetchDashboardData();
  }, [currentAgent]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching dashboard data for agent:', currentAgent);
      
      const apiPath = currentAgent 
        ? `/api/open/app/agent/${currentAgent.id}/dashboard`
        : '/api/open/app/agent/dashboard';
      
      console.log('Making request to:', apiPath);
      
      const response = await api.get(apiPath);
      console.log('Dashboard API response:', response);
      
      if (response.data.code === 0) {
        console.log('Dashboard data received:', response.data.data);
        setDashboardData(response.data.data);
      } else {
        throw new Error(response.data.message || '获取仪表盘数据失败');
      }
    } catch (err) {
      const error = err as AxiosError<{message?: string}>;
      const errorMessage = error.response?.data?.message || error.message || '获取仪表盘数据时发生错误';
      
      console.error('Error fetching dashboard data:', {
        error: error,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStatisticsCards = () => {
    if (!dashboardData) return null;

    const { statistics } = dashboardData;
    
    return (
      <Row gutter={[16, 16]} className={styles.statisticsRow}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="账户余额"
              value={statistics.balance}
              precision={2}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="总充值"
              value={statistics.total_recharge}
              precision={2}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="总消费"
              value={statistics.total_consumption}
              precision={2}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="本月消费"
              value={statistics.monthly_consumption}
              precision={2}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderDynamicResources = (resources: DynamicResource[]) => {
    return resources.map((resource) => (
      <Col span={8} key={resource.id}>
        <Card>
          <Statistic title={resource.name} value={resource.total} suffix="Gb" />
          <Progress percent={resource.usage_rate} status="active" />
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="本月" value={resource.monthly} suffix="Gb" />
            </Col>
            <Col span={8}>
              <Statistic title="今日" value={resource.today} suffix="Gb" />
            </Col>
            <Col span={8}>
              <Statistic title="上月" value={resource.last_month} suffix="Gb" />
            </Col>
          </Row>
        </Card>
      </Col>
    ));
  };

  const renderStaticResources = (resources: StaticResource[]) => {
    return resources.map((resource) => (
      <Col span={8} key={resource.id}>
        <Card>
          <Statistic title={resource.name} value={resource.total} />
          <Progress percent={resource.usage_rate} status="active" />
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="本月" value={resource.monthly} />
            </Col>
            <Col span={8}>
              <Statistic title="上月" value={resource.last_month} />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '16px' }}>
            <Col span={12}>
              <Statistic title="可用" value={resource.available} />
            </Col>
            <Col span={12}>
              <Statistic title="过期" value={resource.expired} />
            </Col>
          </Row>
        </Card>
      </Col>
    ));
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <Button type="primary" onClick={fetchDashboardData}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <Spin spinning={loading}>
      <div className={styles.dashboard}>
        {renderStatisticsCards()}
        <div className={styles.resourceSection}>
          <h2>动态资源</h2>
          <Row gutter={[16, 16]}>
            {dashboardData?.dynamic_resources ? renderDynamicResources(dashboardData.dynamic_resources) : null}
          </Row>
        </div>
        <div className={styles.resourceSection}>
          <h2>静态资源</h2>
          <Row gutter={[16, 16]}>
            {dashboardData?.static_resources ? renderStaticResources(dashboardData.static_resources) : null}
          </Row>
        </div>
      </div>
    </Spin>
  );
};

export default Dashboard; 