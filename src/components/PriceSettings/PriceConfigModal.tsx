import React from 'react';
import { Modal, Form, InputNumber, Descriptions, message } from 'antd';
import { updateProductPrice } from '@/services/productInventory';
import type { ProductPrice } from '@/types/product';

interface PriceSettingsModalProps {
  visible: boolean;
  initialData: ProductPrice | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const PriceSettingsModal: React.FC<PriceSettingsModalProps> = ({
  visible,
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  // 当弹窗显示时，设置表单初始值
  React.useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        price: initialData.price
      });
    }
  }, [visible, initialData, form]);

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!initialData) {
        message.error('数据错误');
        return;
      }

      setLoading(true);
      await updateProductPrice(initialData.id, {
        price: values.price
      });

      message.success('价格更新成功');
      onSuccess();
    } catch (error) {
      console.error('更新价格失败:', error);
      message.error('更新价格失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="修改价格"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      maskClosable={false}
      destroyOnClose
    >
      <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="资源类型">
          {initialData?.type === 'dynamic' ? '动态资源' : '静态资源'}
        </Descriptions.Item>
        <Descriptions.Item label="区域">
          {initialData?.area || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="国家">
          {initialData?.country || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="城市">
          {initialData?.city || '-'}
        </Descriptions.Item>
        {initialData?.ipRange && (
          <Descriptions.Item label="IP段">
            {initialData.ipRange}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Form 
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="price"
          label="价格"
          rules={[
            { required: true, message: '请输入价格' },
            { type: 'number', min: 0.1, message: '价格必须大于0.1' },
            { type: 'number', max: 999999.9, message: '价格超出范围' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            precision={1}
            step={0.1}
            prefix="¥"
            placeholder="请输入价格"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PriceSettingsModal; 