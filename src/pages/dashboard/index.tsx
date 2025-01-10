import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { getStatistics } from '@/services/statistics';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalRecharge: 0,
    totalConsumption: 0,
    balance: 0,
    monthlyRecharge: 0,
    monthlyConsumption: 0,
    lastMonthConsumption: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const statistics = await getStatistics();
        setData(statistics);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        message.error('获取数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-container" style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              loading={loading}
              title="累计消费"
              value={data.totalConsumption}
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
              loading={loading}
              title="累计充值"
              value={data.totalRecharge}
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
              loading={loading}
              title="剩余金额"
              value={data.balance}
              precision={2}
              prefix="¥"
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              loading={loading}
              title="本月充值"
              value={data.monthlyRecharge}
              precision={2}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              loading={loading}
              title="本月消费"
              value={data.monthlyConsumption}
              precision={2}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#cf1322' }}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              loading={loading}
              title="上月消费"
              value={data.lastMonthConsumption}
              precision={2}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#cf1322' }}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
