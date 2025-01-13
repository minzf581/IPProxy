import React from 'react';
import { Modal, Form, InputNumber, Select, Input, message } from 'antd';
import { resourceService } from '@/services/resourceService';
import type { AddDynamicResourceForm } from '@/types/resource';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

const locationOptions = [
  { label: '中国', value: 'CN' },
  { label: '美国', value: 'US' },
  { label: '日本', value: 'JP' },
  { label: '韩国', value: 'KR' },
  { label: '香港', value: 'HK' },
  { label: '新加坡', value: 'SG' },
];

const AddDynamicResourceModal: React.FC<Props> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm<AddDynamicResourceForm>();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await resourceService.addDynamicResource(values);

      message.success('添加成功');
      form.resetFields();
      onSuccess?.();
      onCancel();
    } catch (error) {
      console.error('添加资源失败:', error);
      message.error('添加资源失败');
    }
  };

  return (
    <Modal
      title="添加动态资源"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          count: 100
        }}
      >
        <Form.Item
          name="location"
          label="地区"
          rules={[{ required: true, message: '请选择地区' }]}
        >
          <Select
            options={locationOptions}
            placeholder="请选择地区"
          />
        </Form.Item>

        <Form.Item
          name="count"
          label="数量"
          rules={[
            { required: true, message: '请输入数量' },
            { type: 'number', min: 1, message: '数量必须大于0' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            step={1}
          />
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddDynamicResourceModal;
