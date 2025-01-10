import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, message, Menu } from 'antd';
import { getStatistics, StatisticsData } from '../services/statistics';
import { formatBytes } from '../utils/format';
import { useNavigate, useLocation } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData>({
    totalRecharge: 0,
    totalConsumption: 0,
    balance: 0,
    monthlyRecharge: 0,
    monthlyConsumption: 0,
    lastMonthConsumption: 0,
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await getStatistics();
      setStatistics(data);
    } catch (error) {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'dashboard':
        navigate('/');
        break;
      case 'agents':
        navigate('/account/agents');
        break;
      case 'users':
        navigate('/account/users');
        break;
      case 'agent-orders':
        navigate('/orders/agent');
        break;
      case 'user-dynamic-orders':
        navigate('/orders/user/dynamic');
        break;
      case 'user-static-orders':
        navigate('/orders/user/static');
        break;
      case 'ip-manage':
        navigate('/static-ip/manage');
        break;
      case 'system-settings':
        navigate('/settings/system');
        break;
    }
  };

  // 根据当前路径获取选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path === '/') return ['dashboard'];
    if (path.includes('/account/agents')) return ['agents'];
    if (path.includes('/account/users')) return ['users'];
    if (path.includes('/orders/agent')) return ['agent-orders'];
    if (path.includes('/orders/user/dynamic')) return ['user-dynamic-orders'];
    if (path.includes('/orders/user/static')) return ['user-static-orders'];
    if (path.includes('/static-ip/manage')) return ['ip-manage'];
    if (path.includes('/settings/system')) return ['system-settings'];
    return ['dashboard'];
  };

  // 获取展开的子菜单
  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.includes('/account')) return ['account'];
    if (path.includes('/orders')) return ['orders'];
    if (path.includes('/static-ip')) return ['static-ip'];
    if (path.includes('/settings')) return ['settings'];
    return [];
  };

  const basicStats = [
    { 
      title: '累计充值', 
      value: statistics.totalRecharge,
      prefix: '¥',
      color: '#52c41a'
    },
    { 
      title: '累计消费', 
      value: statistics.totalConsumption,
      prefix: '¥',
      color: '#f5222d'
    },
    { 
      title: '剩余金额', 
      value: statistics.balance,
      prefix: '¥',
      color: '#1890ff'
    },
    { 
      title: '本月充值', 
      value: statistics.monthlyRecharge,
      prefix: '¥',
      color: '#722ed1'
    },
    { 
      title: '本月消费', 
      value: statistics.monthlyConsumption,
      prefix: '¥',
      color: '#13c2c2'
    },
    { 
      title: '上月消费', 
      value: statistics.lastMonthConsumption,
      prefix: '¥',
      color: '#eb2f96'
    }
  ];

  const dynamicResources = [
    {
      title: '动态资源1',
      percent: 50,
      total: '1024G',
      monthly: '256G',
      lastMonth: '320G',
      today: '28G'
    },
    {
      title: '动态资源2',
      percent: 75,
      total: '2048G',
      monthly: '512G',
      lastMonth: '486G',
      today: '64G'
    },
    {
      title: '动态资源3',
      percent: 25,
      total: '4096G',
      monthly: '1024G',
      lastMonth: '896G',
      today: '128G'
    }
  ];

  const staticResources = [
    {
      title: '静态资源1',
      percent: 60,
      total: '1000条',
      monthlyAvailable: '200条',
      remainingAvailable: '300条',
      lastMonth: '180条',
      expired: '120条'
    },
    {
      title: '静态资源2',
      percent: 80,
      total: '2000条',
      monthlyAvailable: '400条',
      remainingAvailable: '600条',
      lastMonth: '380条',
      expired: '220条'
    },
    {
      title: '静态资源3',
      percent: 40,
      total: '3000条',
      monthlyAvailable: '600条',
      remainingAvailable: '900条',
      lastMonth: '550条',
      expired: '350条'
    }
  ];

  return (
    <div className="dashboard-container">
      {/* 左侧菜单 */}
      <div className="sidebar">
        <div className="logo">IP总管理后台</div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          onClick={handleMenuClick}
          style={{ height: '100%', borderRight: 0 }}
        >
          <Menu.Item key="dashboard">仪表盘</Menu.Item>
          <Menu.SubMenu key="account" title="账户管理">
            <Menu.Item key="agents">代理商管理</Menu.Item>
            <Menu.Item key="users">用户管理</Menu.Item>
          </Menu.SubMenu>
          <Menu.SubMenu key="orders" title="订单管理">
            <Menu.Item key="agent-orders">代理商订单</Menu.Item>
            <Menu.Item key="user-dynamic-orders">用户动态订单</Menu.Item>
            <Menu.Item key="user-static-orders">用户静态订单</Menu.Item>
          </Menu.SubMenu>
          <Menu.SubMenu key="static-ip" title="静态IP管理">
            <Menu.Item key="ip-manage">IP管理</Menu.Item>
          </Menu.SubMenu>
          <Menu.SubMenu key="settings" title="系统设置">
            <Menu.Item key="system-settings">系统设置</Menu.Item>
          </Menu.SubMenu>
        </Menu>
      </div>

      {/* 主要内容区域 */}
      <div className="main-content">
        <Row gutter={[16, 16]}>
          {basicStats.map((stat, index) => (
            <Col key={index} span={8}>
              <Card loading={loading}>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.prefix}
                  precision={2}
                  valueStyle={{ color: stat.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          {dynamicResources.map((resource, index) => (
            <Col key={index} span={8}>
              <Card loading={loading}>
                <div className="resource-title">{resource.title}</div>
                <Progress percent={resource.percent} />
                <Row className="mt-4">
                  <Col span={12}>
                    <div>累计：{resource.total}</div>
                    <div>本月：{resource.monthly}</div>
                  </Col>
                  <Col span={12}>
                    <div>上月：{resource.lastMonth}</div>
                    <div>今日：{resource.today}</div>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          {staticResources.map((resource, index) => (
            <Col key={index} span={8}>
              <Card loading={loading}>
                <div className="resource-title">{resource.title}</div>
                <Progress percent={resource.percent} />
                <Row className="mt-4">
                  <Col span={12}>
                    <div>总开通：{resource.total}</div>
                    <div>本月可用：{resource.monthlyAvailable}</div>
                    <div>剩余可用：{resource.remainingAvailable}</div>
                  </Col>
                  <Col span={12}>
                    <div>上月：{resource.lastMonth}</div>
                    <div>已过期：{resource.expired}</div>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <style jsx global>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
        }
        .sidebar {
          width: 200px;
          background: #fff;
          border-right: 1px solid #f0f0f0;
        }
        .logo {
          height: 64px;
          line-height: 64px;
          padding-left: 24px;
          background: #fff;
          border-bottom: 1px solid #f0f0f0;
          font-size: 16px;
          font-weight: bold;
        }
        .main-content {
          flex: 1;
          padding: 24px;
          background: #f0f2f5;
        }
        .section-title {
          font-size: 16px;
          font-weight: 500;
          margin: 24px 0 16px;
        }
        .resource-title {
          margin-bottom: 16px;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.85);
        }
        .mt-4 {
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;