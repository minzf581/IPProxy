import React, { useState, useEffect } from 'react';
import { Modal, Statistic, Row, Col, Card, Spin, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { AgentInfo } from '@/utils/ipProxyAPI';
import ipProxyAPI from '@/utils/ipProxyAPI';

interface AgentDashboardModalProps {
  visible: boolean;
  agent: AgentInfo | null;
  onCancel: () => void;
}

interface AgentStatistics {
  balance: number;
  totalRecharge: number;
  totalConsumption: number;
  monthlyRecharge: number;
  monthlyConsumption: number;
  lastMonthConsumption: number;
}

const AgentDashboardModal: React.FC<AgentDashboardModalProps> = ({
  visible,
  agent,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<AgentStatistics | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!agent || !visible) return;

      try {
        setLoading(true);
        const data = await ipProxyAPI.getAgentStatistics(agent.id);
        setStatistics(data);
      } catch (error) {
        console.error('获取代理商统计数据失败:', error);
        message.error('获取代理商统计数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [agent, visible]);

  if (!agent) return null;

  const monthlyChange = statistics ? 
    statistics.monthlyConsumption - statistics.lastMonthConsumption : 0;
  const monthlyChangePercent = statistics?.lastMonthConsumption ? 
    ((monthlyChange / statistics.lastMonthConsumption) * 100).toFixed(2) : 0;

  return (
    <Modal
      title={`${agent.name} 的统计数据`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Spin spinning={loading}>
        {statistics && (
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="累计消费"
                  value={statistics.totalConsumption}
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
                  value={statistics.totalRecharge}
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
                  title="账户余额"
                  value={statistics.balance}
                  precision={2}
                  prefix="¥"
                  suffix="元"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="本月消费"
                  value={statistics.monthlyConsumption}
                  precision={2}
                  prefix="¥"
                  suffix="元"
                  valueStyle={{ color: monthlyChange >= 0 ? '#cf1322' : '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="本月充值"
                  value={statistics.monthlyRecharge}
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
                  title="环比变化"
                  value={monthlyChangePercent}
                  precision={2}
                  prefix={monthlyChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  valueStyle={{ color: monthlyChange >= 0 ? '#cf1322' : '#3f8600' }}
                  suffix="%"
                />
              </Card>
            </Col>
          </Row>
        )}
      </Spin>
    </Modal>
  );
};

export default AgentDashboardModal;