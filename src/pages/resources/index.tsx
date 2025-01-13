import React from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, InputNumber, message } from 'antd';
import { getResourceList, createResource, updateResource } from '@/services/resourceService';
import { isAdmin } from '@/services/mainUser';
import type { Resource } from '@/types/resource';
import dayjs from 'dayjs';

const ResourceListPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<{ list: Resource[]; total: number }>({ list: [], total: 0 });
  const [pagination, setPagination] = React.useState({ current: 1, pageSize: 10 });
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingResource, setEditingResource] = React.useState<Resource | null>(null);
  const [form] = Form.useForm();

  React.useEffect(() => {
    loadResources();
  }, [pagination.current, pagination.pageSize]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const result = await getResourceList({
        page: pagination.current,
        pageSize: pagination.pageSize
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load resources:', error);
      message.error('加载资源列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (resource: Resource, newStatus: string) => {
    try {
      await updateResource(resource.id, { status: newStatus });
      message.success('状态更新成功');
      loadResources();
    } catch (error) {
      console.error('Failed to update resource status:', error);
      message.error('更新资源状态失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingResource) {
        await updateResource(editingResource.id, values);
        message.success('资源更新成功');
      } else {
        await createResource(values);
        message.success('资源创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      setEditingResource(null);
      loadResources();
    } catch (error) {
      console.error('Failed to save resource:', error);
      message.error('保存资源失败');
    }
  };

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'dynamic' ? 'blue' : 'green'}>
          {type === 'dynamic' ? '动态' : '静态'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: Resource) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditingResource(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Button
            size="small"
            type={record.status === 'active' ? 'default' : 'primary'}
            onClick={() => handleUpdateStatus(record, record.status === 'active' ? 'disabled' : 'active')}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  if (!isAdmin()) {
    return <div>无权访问</div>;
  }

  return (
    <Card title="资源管理">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          onClick={() => {
            setEditingResource(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          添加资源
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data.list}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          total: data.total,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        onChange={handleTableChange}
      />
    </Card>

    <Modal
      title={editingResource ? '编辑资源' : '添加资源'}
      open={modalVisible}
      onOk={handleSubmit}
      onCancel={() => {
        setModalVisible(false);
        setEditingResource(null);
        form.resetFields();
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入资源名称' }]}
        >
          <Input placeholder="请输入资源名称" />
        </Form.Item>

        <Form.Item
          name="type"
          label="类型"
          rules={[{ required: true, message: '请选择资源类型' }]}
        >
          <Input.Group>
            <Space>
              <Button
                type={form.getFieldValue('type') === 'dynamic' ? 'primary' : 'default'}
                onClick={() => form.setFieldValue('type', 'dynamic')}
              >
                动态
              </Button>
              <Button
                type={form.getFieldValue('type') === 'static' ? 'primary' : 'default'}
                onClick={() => form.setFieldValue('type', 'static')}
              >
                静态
              </Button>
            </Space>
          </Input.Group>
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
        >
          <Input.TextArea rows={4} placeholder="请输入资源描述" />
        </Form.Item>

        <Form.Item
          name="price"
          label="价格"
          rules={[
            { required: true, message: '请输入价格' },
            { type: 'number', min: 0, message: '价格不能小于0' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            precision={2}
            prefix="¥"
            placeholder="请输入价格"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ResourceListPage;
