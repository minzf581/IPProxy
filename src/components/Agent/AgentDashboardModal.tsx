import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Tag, Spin, message } from 'antd';
import { dbService } from '@/services/dbService';
import type { AgentInfo, AgentStatistics } from '@/types/agent';
import { formatDateTime } from '@/utils/dateUtils';

interface Props {
  visible: boolean;
  onCancel: () => void;
  agent: AgentInfo | null;
}

const AgentDashboardModal: React.FC<Props> = ({
  visible,
  onCancel,
  agent
}) => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<AgentStatistics | null>(null);

  useEffect(() => {
    if (visible && agent) {
      fetchStatistics();
    }
  }, [visible, agent]);

  const fetchStatistics = async () => {
    if (!agent) return;

    try {
      setLoading(true);
      const data = await dbService.getAgentStatistics(agent.id);
      setStatistics(data);
    } catch (error) {
      console.error('获取代理商统计数据失败:', error);
      message.error('获取代理商统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (!agent) return null;

  return (
    <Modal
      title={`${agent.account} 的统计数据`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Spin spinning={loading}>
        {statistics && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="账号">
                {agent.account}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {agent.email}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {agent.status === 'active' ? (
                  <Tag color="success">正常</Tag>
                ) : (
                  <Tag color="error">禁用</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="余额">
                ¥{agent.balance.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {formatDateTime(agent.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="最后登录">
                {agent.lastLoginAt ? formatDateTime(agent.lastLoginAt) : '-'}
              </Descriptions.Item>
              {agent.remark && (
                <Descriptions.Item label="备注" span={2}>
                  {agent.remark}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Descriptions title="用户统计" bordered column={2} style={{ marginTop: 24 }}>
              <Descriptions.Item label="总用户数">
                {statistics.totalUsers}
              </Descriptions.Item>
              <Descriptions.Item label="活跃用户">
                {statistics.activeUsers}
              </Descriptions.Item>
              <Descriptions.Item label="本月新增">
                {statistics.monthlyNewUsers}
              </Descriptions.Item>
              <Descriptions.Item label="环比变化">
                {statistics.monthlyNewUsers > statistics.lastMonthNewUsers ? (
                  <Tag color="red">
                    +{((statistics.monthlyNewUsers - statistics.lastMonthNewUsers) / statistics.lastMonthNewUsers * 100).toFixed(2)}%
                  </Tag>
                ) : (
                  <Tag color="green">
                    {((statistics.monthlyNewUsers - statistics.lastMonthNewUsers) / statistics.lastMonthNewUsers * 100).toFixed(2)}%
                  </Tag>
                )}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="订单统计" bordered column={2} style={{ marginTop: 24 }}>
              <Descriptions.Item label="总订单数">
                {statistics.totalOrders}
              </Descriptions.Item>
              <Descriptions.Item label="活跃订单">
                {statistics.activeOrders}
              </Descriptions.Item>
              <Descriptions.Item label="总收入">
                ¥{statistics.totalIncome.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="本月收入">
                ¥{statistics.monthlyIncome.toFixed(2)}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="动态IP订单" bordered column={2} style={{ marginTop: 24 }}>
              <Descriptions.Item label="总订单数">
                {statistics.dynamicOrders.total}
              </Descriptions.Item>
              <Descriptions.Item label="活跃订单">
                {statistics.dynamicOrders.active}
              </Descriptions.Item>
              <Descriptions.Item label="总收入" span={2}>
                ¥{statistics.dynamicOrders.income.toFixed(2)}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="静态IP订单" bordered column={2} style={{ marginTop: 24 }}>
              <Descriptions.Item label="总订单数">
                {statistics.staticOrders.total}
              </Descriptions.Item>
              <Descriptions.Item label="活跃订单">
                {statistics.staticOrders.active}
              </Descriptions.Item>
              <Descriptions.Item label="总收入" span={2}>
                ¥{statistics.staticOrders.income.toFixed(2)}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default AgentDashboardModal;