import React from 'react';
import { Modal, Descriptions } from 'antd';

interface OrderDetailModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
}

const UserStaticOrderDetailModal: React.FC<OrderDetailModalProps> = ({
  visible,
  onClose,
  orderId
}) => {
  return (
    <Modal
      title="静态订单详情"
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

export default UserStaticOrderDetailModal;