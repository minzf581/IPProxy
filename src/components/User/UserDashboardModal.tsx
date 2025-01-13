import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Tag, Spin, message } from 'antd';
import { getUserStatistics } from '@/services/userService';
import type { UserInfo, UserStatistics } from '@/types/user';
import { formatDateTime } from '@/utils/dateUtils';

interface Props {
  visible: boolean;
  onCancel: () => void;
  user: UserInfo | null;
}

const UserDashboardModal: React.FC<Props> = ({
  visible,
  onCancel,
  user
}) => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);

  useEffect(() => {
    if (visible && user) {
      loadStatistics();
    }
  }, [visible, user]);

  const loadStatistics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserStatistics(user.id);
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load user statistics:', error);
      message.error('加载用户统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Modal
      title="用户仪表盘"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Spin spinning={loading}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="用户名">
            {user.username}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={user.status === 'active' ? 'green' : 'red'}>
              {user.status === 'active' ? '正常' : '禁用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">
            {user.email}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {formatDateTime(user.createdAt)}
          </Descriptions.Item>
        </Descriptions>

        {statistics && (
          <>
            <h3 style={{ marginTop: 24, marginBottom: 16 }}>账户统计</h3>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="当前余额">
                ¥{statistics.balance.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="总充值金额">
                ¥{statistics.totalRecharge.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="本月充值">
                ¥{statistics.monthRecharge.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="本月消费">
                ¥{statistics.monthConsumption.toFixed(2)}
              </Descriptions.Item>
            </Descriptions>

            <h3 style={{ marginTop: 24, marginBottom: 16 }}>订单统计</h3>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="动态订单数">
                {statistics.dynamicOrders}
              </Descriptions.Item>
              <Descriptions.Item label="静态订单数">
                {statistics.staticOrders}
              </Descriptions.Item>
              <Descriptions.Item label="活跃订单数">
                {statistics.activeOrders}
              </Descriptions.Item>
              <Descriptions.Item label="已完成订单数">
                {statistics.completedOrders}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default UserDashboardModal;