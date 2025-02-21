import React from 'react';
import { Form, Input, Button, Space } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';

interface IpWhitelistInputProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  maxCount?: number;
}

const IpWhitelistInput: React.FC<IpWhitelistInputProps> = ({
  value = [''],
  onChange,
  maxCount = 5
}) => {
  const [form] = Form.useForm();

  // IP地址验证规则
  const validateIp = (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(value)) {
      return Promise.reject('请输入有效的IP地址');
    }
    const parts = value.split('.');
    const isValid = parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
    return isValid ? Promise.resolve() : Promise.reject('IP地址格式不正确');
  };

  // 处理表单值变化
  const handleValuesChange = () => {
    const values = form.getFieldsValue();
    const ips = values.ipList?.map((item: { ip: string }) => item.ip) || [''];
    onChange?.(ips);
  };

  return (
    <Form form={form} initialValues={{ ipList: value.map(ip => ({ ip })) }}>
      <Form.List name="ipList" initialValue={[{ ip: '' }]}>
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, index) => (
              <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }}>
                <Form.Item
                  {...field}
                  name={[field.name, 'ip']}
                  rules={[{ validator: validateIp }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="请输入IP地址" style={{ width: 200 }} onChange={handleValuesChange} />
                </Form.Item>
                <Button
                  type="text"
                  icon={<MinusOutlined />}
                  onClick={() => {
                    if (fields.length > 1) {
                      remove(field.name);
                      handleValuesChange();
                    }
                  }}
                  disabled={fields.length === 1}
                />
                {index === fields.length - 1 && fields.length < maxCount && (
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      add({ ip: '' });
                      handleValuesChange();
                    }}
                  />
                )}
              </Space>
            ))}
          </>
        )}
      </Form.List>
    </Form>
  );
};

export default IpWhitelistInput; 