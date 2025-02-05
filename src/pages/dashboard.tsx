import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { getDashboardData } from '@/services/dashboardService';
import type { DashboardData } from '@/types/dashboard';
import { formatNumber, formatTraffic } from '@/utils/format';
import './dashboard.less';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* 统计数据卡片 */}
      <Card title="账户统计" className="dashboard-card">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic
              title="账户余额"
              value={dashboardData?.statistics.balance || 0}
              precision={2}
              prefix="¥"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="累计充值"
              value={dashboardData?.statistics.totalRecharge || 0}
              precision={2}
              prefix="¥"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="累计消费"
              value={dashboardData?.statistics.totalConsumption || 0}
              precision={2}
              prefix="¥"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="本月充值"
              value={dashboardData?.statistics.monthRecharge || 0}
              precision={2}
              prefix="¥"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="本月消费"
              value={dashboardData?.statistics.monthConsumption || 0}
              precision={2}
              prefix="¥"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="上月消费"
              value={dashboardData?.statistics.lastMonthConsumption || 0}
              precision={2}
              prefix="¥"
            />
          </Col>
        </Row>
      </Card>

      {/* 动态资源使用情况 */}
      <Card title="动态资源使用情况" className="dashboard-card" style={{ marginTop: '20px' }}>
        <Row gutter={[16, 16]}>
          {dashboardData?.dynamicResources.map((resource) => (
            <Col span={8} key={resource.id}>
              <Card title={resource.name} className="resource-card">
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Statistic title="使用率" value={resource.usageRate} suffix="%" />
                  </Col>
                  <Col span={12}>
                    <Statistic title="累计使用" value={formatTraffic(resource.total)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="本月使用" value={formatTraffic(resource.monthly)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="今日使用" value={formatTraffic(resource.today)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="上月使用" value={formatTraffic(resource.lastMonth)} />
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 静态资源使用情况 */}
      <Card title="静态资源使用情况" className="dashboard-card" style={{ marginTop: '20px' }}>
        <Row gutter={[16, 16]}>
          {dashboardData?.staticResources.map((resource) => (
            <Col span={8} key={resource.id}>
              <Card title={resource.name} className="resource-card">
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Statistic title="使用率" value={resource.usageRate} suffix="%" />
                  </Col>
                  <Col span={12}>
                    <Statistic title="累计开通" value={formatNumber(resource.total)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="本月开通" value={formatNumber(resource.monthly)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="上月开通" value={formatNumber(resource.lastMonth)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="剩余可用" value={formatNumber(resource.available)} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="已过期" value={formatNumber(resource.expired)} />
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;