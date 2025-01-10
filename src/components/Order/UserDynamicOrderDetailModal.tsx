import React from 'react';
import { Modal, Descriptions } from 'antd';
import type { UserDynamicOrder } from '@/types/order';

interface Props {
  visible: boolean;
  onCancel: () => void;
  order: UserDynamicOrder | null;
}

const UserDynamicOrderDetailModal: React.FC<Props> = ({ visible, onCancel, order }) => {
  if (!order) return null;

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
        
        <Descriptions.Item label="时长">
          {order.duration}
        </Descriptions.Item>
        
        <Descriptions.Item label="创建时间">
          {order.createdAt}
        </Descriptions.Item>
        
        <Descriptions.Item label="备注" span={2}>
          {order.remark || '-'}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default UserDynamicOrderDetailModal; 