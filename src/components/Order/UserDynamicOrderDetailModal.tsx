import React from 'react';
import { Modal, Descriptions } from 'antd';

interface OrderDetailModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
}

const UserDynamicOrderDetailModal: React.FC<OrderDetailModalProps> = ({
  visible,
  onClose,
  orderId
}) => {
  return (
    <Modal
      title="动态订单详情"
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      <Descriptions bordered column={1}>
        {/* 订单详情内容 */}
      </Descriptions>
    </Modal>
  );
};

export default UserDynamicOrderDetailModal;