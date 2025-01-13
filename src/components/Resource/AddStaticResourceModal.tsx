import React from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { resourceService } from '@/services/resourceService';
import type { AddStaticResourceForm } from '@/types/resource';

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

const ispOptions = [
  { label: '电信', value: 'CT' },
  { label: '联通', value: 'CU' },
  { label: '移动', value: 'CM' },
  { label: '其他', value: 'OTHER' },
];

const AddStaticResourceModal: React.FC<Props> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm<AddStaticResourceForm>();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await resourceService.addStaticResource(values);

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
      title="添加静态资源"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="ipAddress"
          label="IP地址"
          rules={[
            { required: true, message: '请输入IP地址' },
            {
              pattern: /^(\d{1,3}\.){3}\d{1,3}$/,
              message: '请输入有效的IP地址'
            }
          ]}
        >
          <Input placeholder="例如：192.168.1.1" />
        </Form.Item>

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
          name="isp"
          label="运营商"
        >
          <Select
            options={ispOptions}
            placeholder="请选择运营商（可选）"
            allowClear
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

export default AddStaticResourceModal;
