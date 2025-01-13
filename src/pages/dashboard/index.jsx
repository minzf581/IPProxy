import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { getDashboardData } from '../../services/dashboard';
import './index.css';

const StatCard = ({ title, value, icon, color }) => (
  <Card className="stat-card">
    <div className="stat-header">
      <span>{title}</span>
      <span className="stat-icon" style={{ color }}>{icon}</span>
    </div>
    <div className="stat-value" style={{ color }}>
      {value.toLocaleString()}
    </div>
  </Card>
);

const ResourceCard = ({ title, total, used, today, lastMonth, available, percentage, type }) => (
  <Card className="resource-card">
    <div className="resource-title">{title}</div>
    <Progress 
      percent={percentage} 
      showInfo={false}
      strokeColor="#1890ff"
      trailColor="#f0f0f0"
      strokeWidth={8}
    />
    <div className="resource-stats">
      <div className="stat-row">
        <span>累计：{total}</span>
        <span>本月：{today}</span>
      </div>
      <div className="stat-row">
        <span>上月：{lastMonth}</span>
        {type === 'static' && <span>剩余可用：{available}</span>}
      </div>
      <div className="stat-row">
        <span>已过期：{used}</span>
        <span>{percentage}%</span>
      </div>
    </div>
  </Card>
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    total_consumption: 0,
    total_recharge: 0,
    balance: 0,
    month_recharge: 0,
    month_consumption: 0,
    last_month_consumption: 0,
    dynamic_resources: [],
    static_resources: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
        message.error('获取仪表盘数据失败');
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container">
      <Row gutter={[16, 16]}>
        <Col span={4}>
          <StatCard
            title="累计充值"
            value={dashboardData.total_recharge}
            icon="￥"
            color="#1890ff"
          />
        </Col>
        <Col span={4}>
          <StatCard
            title="累计消费"
            value={dashboardData.total_consumption}
            icon="￥"
            color="#52c41a"
          />
        </Col>
        <Col span={4}>
          <StatCard
            title="剩余金额"
            value={dashboardData.balance}
            icon="￥"
            color="#722ed1"
          />
        </Col>
        <Col span={4}>
          <StatCard
            title="本月充值"
            value={dashboardData.month_recharge}
            icon={<ArrowUpOutlined />}
            color="#faad14"
          />
        </Col>
        <Col span={4}>
          <StatCard
            title="本月消费"
            value={dashboardData.month_consumption}
            icon={<ArrowDownOutlined />}
            color="#f5222d"
          />
        </Col>
        <Col span={4}>
          <StatCard
            title="上月消费"
            value={dashboardData.last_month_consumption}
            icon="￥"
            color="#13c2c2"
          />
        </Col>
      </Row>

      <h2 className="section-title">动态资源使用情况</h2>
      <Row gutter={[16, 16]}>
        {dashboardData.dynamic_resources.map((resource, index) => (
          <Col span={8} key={index}>
            <ResourceCard
              title={resource.title}
              total={resource.total}
              used={resource.used}
              today={resource.today}
              lastMonth={resource.lastMonth}
              percentage={resource.percentage}
              type="dynamic"
            />
          </Col>
        ))}
      </Row>

      <h2 className="section-title">静态资源使用情况</h2>
      <Row gutter={[16, 16]}>
        {dashboardData.static_resources.map((resource, index) => (
          <Col span={8} key={index}>
            <ResourceCard
              title={resource.title}
              total={resource.total}
              used={resource.used}
              today={resource.today}
              lastMonth={resource.lastMonth}
              available={resource.available}
              percentage={resource.percentage}
              type="static"
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Dashboard;
