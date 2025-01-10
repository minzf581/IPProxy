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

  const monthlyChange = data.monthlyConsumption - data.lastMonthConsumption;
  const monthlyChangePercent = data.lastMonthConsumption ? 
    ((monthlyChange / data.lastMonthConsumption) * 100).toFixed(2) : 0;

  return (
    <Row gutter={[16, 16]}>
      <Col span={8}>
        <Statistic
          loading={loading}
          title="累计消费"
          value={data.totalConsumption}
          precision={2}
          prefix="¥"
          valueStyle={{ color: '#cf1322' }}
          suffix="元"
        />
      </Col>
      <Col span={8}>
        <Statistic
          loading={loading}
          title="累计充值"
          value={data.totalRecharge}
          precision={2}
          prefix="¥"
          valueStyle={{ color: '#3f8600' }}
          suffix="元"
        />
      </Col>
      <Col span={8}>
        <Statistic
          loading={loading}
          title="账户余额"
          value={data.balance}
          precision={2}
          prefix="¥"
          suffix="元"
        />
      </Col>
      <Col span={8}>
        <Statistic
          loading={loading}
          title="本月消费"
          value={data.monthlyConsumption}
          precision={2}
          prefix="¥"
          suffix="元"
          valueStyle={{ color: monthlyChange >= 0 ? '#cf1322' : '#3f8600' }}
        />
      </Col>
      <Col span={8}>
        <Statistic
          loading={loading}
          title="本月充值"
          value={data.monthlyRecharge}
          precision={2}
          prefix="¥"
          valueStyle={{ color: '#3f8600' }}
          suffix="元"
        />
      </Col>
      <Col span={8}>
        <Statistic
          loading={loading}
          title="环比变化"
          value={monthlyChangePercent}
          precision={2}
          prefix={monthlyChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          valueStyle={{ color: monthlyChange >= 0 ? '#cf1322' : '#3f8600' }}
          suffix="%"
        />
      </Col>
    </Row>
  );
};

export default Dashboard;
