import React from 'react';
import { Modal, Descriptions, Tag } from 'antd';
import type { UserStaticOrder } from '@/types/order';

interface Props {
  visible: boolean;
  onCancel: () => void;
  order: UserStaticOrder | null;
}

const UserStaticOrderDetailModal: React.FC<Props> = ({ visible, onCancel, order }) => {
  if (!order) return null;

  const resourceTypeMap = {
    static1: '静态资源1',
    static2: '静态资源2',
    static3: '静态资源3'
  };

  return (
    <Modal
      title="订单详情"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="订单号" span={2}>
          {order.orderNo}
        </Descriptions.Item>
        
        <Descriptions.Item label="用户账号">
          {order.userAccount}
        </Descriptions.Item>
        
        <Descriptions.Item label="代理商">
          {order.agentName}
        </Descriptions.Item>

        <Descriptions.Item label="IP信息" span={2}>
          {`${order.ipInfo.subnet}:${order.ipInfo.port}:${order.ipInfo.username}:${order.ipInfo.password}`}
        </Descriptions.Item>

        <Descriptions.Item label="位置">
          {`${order.ipInfo.country} ${order.ipInfo.city}`}
        </Descriptions.Item>

        <Descriptions.Item label="资源类型">
          {resourceTypeMap[order.ipInfo.resourceType]}
        </Descriptions.Item>
        
        <Descriptions.Item label="状态">
          <Tag color={order.status === 'active' ? 'success' : 'error'}>
            {order.status === 'active' ? '使用中' : '已过期'}
          </Tag>
        </Descriptions.Item>
        
        <Descriptions.Item label="创建时间">
          {order.createdAt}
        </Descriptions.Item>

        <Descriptions.Item label="到期时间" span={2}>
          {order.expiredAt}
        </Descriptions.Item>
        
        <Descriptions.Item label="备注" span={2}>
          {order.remark || '-'}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default UserStaticOrderDetailModal; 