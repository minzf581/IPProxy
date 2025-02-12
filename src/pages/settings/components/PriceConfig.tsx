import React, { useState } from 'react';
import { Card, Button, Table, Alert, Modal, message, Space, Tooltip } from 'antd';
import { EditOutlined, SyncOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getProductPrices } from '@/services/productInventory';
import PriceSettingsModal from '@/components/PriceSettings/PriceSettingsModal';
import PriceImportExport from '@/components/PriceSettings/PriceImportExport';
import type { ProductPrice } from '@/types/product';
import type { ColumnsType } from 'antd/es/table';

const PriceConfig: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [visible, setVisible] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<ProductPrice | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 加载价格设置
  const loadPrices = async () => {
    setLoading(true);
    try {
      const data = await getProductPrices({ isGlobal: true });
      setPrices(data);
    } catch (error) {
      console.error('加载价格设置失败:', error);
      message.error('加载价格设置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadPrices();
  }, [refreshKey]);

  const handleEdit = (record: ProductPrice) => {
    setSelectedPrice(record);
    setVisible(true);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const columns: ColumnsType<ProductPrice> = [
    {
      title: '资源类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: [
        { text: '动态资源', value: 'dynamic' },
        { text: '静态资源', value: 'static' }
      ],
      onFilter: (value: any, record: ProductPrice) => record.type === value,
      render: (type: string) => (
        <span style={{ 
          color: type === 'dynamic' ? '#1890ff' : '#52c41a',
          fontWeight: 500
        }}>
          {type === 'dynamic' ? '动态资源' : '静态资源'}
        </span>
      )
    },
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area',
      width: 120,
      filters: [
        { text: '亚洲', value: '亚洲' },
        { text: '欧洲', value: '欧洲' },
        { text: '北美', value: '北美' },
        { text: '南美', value: '南美' },
        { text: '非洲', value: '非洲' },
        { text: '大洋洲', value: '大洋洲' }
      ],
      onFilter: (value: any, record: ProductPrice) => record.area === value
    },
    {
      title: '国家',
      dataIndex: 'country',
      key: 'country',
      width: 120,
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 120,
    },
    {
      title: 'IP段',
      dataIndex: 'ipRange',
      key: 'ipRange',
      width: 180,
      ellipsis: {
        showTitle: false,
      },
      render: (ipRange: string) => (
        ipRange ? (
          <Tooltip placement="topLeft" title={ipRange}>
            {ipRange}
          </Tooltip>
        ) : '-'
      ),
    },
    {
      title: (
        <Space>
          价格
          <Tooltip title="此处设置的价格为系统全局默认价格">
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'price',
      key: 'price',
      width: 120,
      sorter: (a: ProductPrice, b: ProductPrice) => a.price - b.price,
      render: (price: number) => (
        <span style={{ fontWeight: 500, color: '#f50' }}>
          ¥{price.toFixed(1)}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: ProductPrice) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          修改
        </Button>
      )
    }
  ];

  return (
    <Card 
      title="产品价格设置" 
      bordered={false}
      style={{ marginTop: 24 }}
      extra={
        <Space>
          <PriceImportExport
            currentData={prices}
            onImportSuccess={handleRefresh}
          />
          <Button
            icon={<SyncOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      }
    >
      <Alert
        message="价格说明"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>动态资源：按流量计费，单位为元/GB</li>
            <li>静态资源：按IP数量计费，单位为元/IP</li>
            <li>此处设置的价格为系统全局默认价格</li>
            <li>修改价格后将立即生效</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Table
        columns={columns}
        dataSource={prices}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          defaultPageSize: 10,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
      />

      <PriceSettingsModal
        visible={visible}
        initialData={selectedPrice}
        onSuccess={() => {
          setVisible(false);
          setSelectedPrice(null);
          handleRefresh();
          message.success('价格更新成功');
        }}
        onCancel={() => {
          setVisible(false);
          setSelectedPrice(null);
        }}
      />
    </Card>
  );
};

export default PriceConfig; 