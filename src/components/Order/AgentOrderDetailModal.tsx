import React from 'react';
import { Modal, Descriptions, Tag } from 'antd';
import type { AgentOrder } from '@/types/order';

interface Props {
  visible: boolean;
  onCancel: () => void;
  order: AgentOrder | null;
}

const AgentOrderDetailModal: React.FC<Props> = ({ visible, onCancel, order }) => {
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
        
        <Descriptions.Item label="代理商">
          {order.agentName}
        </Descriptions.Item>
        
        <Descriptions.Item label="订单金额">
          ¥{order.amount.toFixed(2)}
        </Descriptions.Item>
        
        <Descriptions.Item label="订单状态">
          <Tag color={order.status === 'paid' ? 'success' : 'warning'}>
            {order.status === 'paid' ? '已支付' : '待支付'}
          </Tag>
        </Descriptions.Item>
        
        <Descriptions.Item label="创建时间">
          {order.createdAt}
        </Descriptions.Item>
        
        {order.status === 'paid' && (
          <>
            <Descriptions.Item label="支付时间" span={2}>
              {order.paidAt}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>
    </Modal>
  );
};

export default AgentOrderDetailModal; 