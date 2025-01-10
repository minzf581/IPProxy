import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import axios from 'axios';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    total_consumption: 0,
    total_recharge: 0,
    balance: 0,
    month_recharge: 0,
    month_consumption: 0,
    last_month_consumption: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/dashboard');
        if (response.data.code === 200) {
          setDashboardData(response.data.data);
        } else {
          console.error('获取仪表盘数据失败:', response.data.msg);
        }
      } catch (error) {
        console.error('请求仪表盘数据失败:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container" style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="累计消费"
              value={dashboardData.total_consumption}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="累计充值"
              value={dashboardData.total_recharge}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#3f8600' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="剩余金额"
              value={dashboardData.balance}
              precision={2}
              prefix="¥"
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="本月充值"
              value={dashboardData.month_recharge}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#3f8600' }}
              suffix="元"
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="本月消费"
              value={dashboardData.month_consumption}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
              suffix="元"
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="上月消费"
              value={dashboardData.last_month_consumption}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
              suffix="元"
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
