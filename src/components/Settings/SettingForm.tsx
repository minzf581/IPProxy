import React from 'react';
import { Form, Input, InputNumber, Select, Switch, Button, Space, Card } from 'antd';
import type { FormInstance } from 'antd/es/form';

const { Option } = Select;
const { TextArea } = Input;

export interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'switch';
  options?: { label: string; value: any }[];
  rules?: any[];
  extra?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

interface SettingFormProps {
  title: string;
  description?: string;
  fields: SettingField[];
  loading: boolean;
  form: FormInstance;
  onFinish: (values: any) => void;
  onReset?: () => void;
}

const SettingForm: React.FC<SettingFormProps> = ({
  title,
  description,
  fields,
  loading,
  form,
  onFinish,
  onReset,
}) => {
  const renderFormItem = (field: SettingField) => {
    const commonProps = {
      disabled: loading || field.disabled,
    };

    switch (field.type) {
      case 'text':
        return <Input {...commonProps} />;
      case 'number':
        return (
          <InputNumber
            {...commonProps}
            style={{ width: '100%' }}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
      case 'textarea':
        return <TextArea {...commonProps} rows={4} />;
      case 'select':
        return (
          <Select {...commonProps}>
            {field.options?.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );
      case 'switch':
        return <Switch {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <Card
      title={title}
      className="mb-6"
      extra={description && <span className="text-gray-500 text-sm">{description}</span>}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{}}
      >
        {fields.map((field) => (
          <Form.Item
            key={field.key}
            name={field.key}
            label={field.label}
            rules={field.rules}
            extra={field.extra}
            valuePropName={field.type === 'switch' ? 'checked' : 'value'}
          >
            {renderFormItem(field)}
          </Form.Item>
        ))}

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
            {onReset && (
              <Button onClick={onReset} disabled={loading}>
                重置
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SettingForm;
