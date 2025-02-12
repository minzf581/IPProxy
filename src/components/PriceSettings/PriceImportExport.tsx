import React, { useState } from 'react';
import { Button, Upload, message, Space, Modal, Table, Typography } from 'antd';
import { UploadOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { ProductPrice } from '@/types/product';
import type { ApiResponse } from '@/types/api';
import * as XLSX from 'xlsx';
import request from '@/utils/request';

const { Text } = Typography;

interface ImportResult {
  total: number;
  success: number;
  failed: number;
}

interface PreviewData {
  type: string;
  area: string;
  country: string;
  city: string;
  ipRange: string;
  price: number;
  errors?: string[];
}

interface PriceImportExportProps {
  onImportSuccess: () => void;
  currentData: ProductPrice[];
}

const PriceImportExport: React.FC<PriceImportExportProps> = ({
  onImportSuccess,
  currentData
}) => {
  const [importing, setImporting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [previewStats, setPreviewStats] = useState({ total: 0, valid: 0, invalid: 0 });

  // 导出Excel
  const handleExport = () => {
    try {
      // 准备导出数据
      const exportData = currentData.map(item => ({
        '资源类型': item.type === 'dynamic' ? '动态资源' : '静态资源',
        '区域': item.area || '-',
        '国家': item.country || '-',
        '城市': item.city || '-',
        'IP段': item.ipRange || '-',
        '价格': item.price.toFixed(1)
      }));

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // 设置列宽
      const colWidths = [
        { wch: 10 }, // 资源类型
        { wch: 10 }, // 区域
        { wch: 15 }, // 国家
        { wch: 15 }, // 城市
        { wch: 20 }, // IP段
        { wch: 10 }, // 价格
      ];
      ws['!cols'] = colWidths;

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '价格配置');

      // 导出文件
      XLSX.writeFile(wb, `价格配置_${new Date().toISOString().split('T')[0]}.xlsx`);
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    }
  };

  // 下载模板
  const handleDownloadTemplate = () => {
    try {
      // 创建工作簿
      const wb = XLSX.utils.book_new();

      // 创建说明sheet
      const instructionsWs = XLSX.utils.aoa_to_sheet([
        ['价格配置导入模板使用说明'],
        [''],
        ['1. 文件格式要求：'],
        ['   - 必须使用Excel格式（.xlsx或.xls）'],
        ['   - 请勿修改表头名称'],
        ['   - 请勿修改工作表名称'],
        [''],
        ['2. 字段说明：'],
        ['   - 资源类型：必填，只能填写"动态资源"或"静态资源"'],
        ['   - 区域：必填，可选值：亚洲、欧洲、北美、南美、非洲、大洋洲'],
        ['   - 国家：必填，请填写准确的国家名称'],
        ['   - 城市：必填，请填写准确的城市名称'],
        ['   - IP段：选填，格式如"192.168.1.1-192.168.1.255"'],
        ['   - 价格：必填，只支持一位小数的正数'],
        [''],
        ['3. 注意事项：'],
        ['   - 价格必须大于0'],
        ['   - 请确保区域、国家、城市信息准确匹配'],
        ['   - 建议先导出现有数据作为参考']
      ]);

      // 创建模板sheet
      const templateData = [
        ['资源类型', '区域', '国家', '城市', 'IP段', '价格'],
        ['动态资源', '亚洲', '中国', '北京', '', '10.0'],
        ['静态资源', '欧洲', '德国', '柏林', '192.168.1.1-192.168.1.255', '20.0']
      ];
      const templateWs = XLSX.utils.aoa_to_sheet(templateData);

      // 设置列宽
      const colWidths = [
        { wch: 10 }, // 资源类型
        { wch: 10 }, // 区域
        { wch: 15 }, // 国家
        { wch: 15 }, // 城市
        { wch: 25 }, // IP段
        { wch: 10 }, // 价格
      ];
      templateWs['!cols'] = colWidths;

      // 添加到工作簿
      XLSX.utils.book_append_sheet(wb, instructionsWs, '使用说明');
      XLSX.utils.book_append_sheet(wb, templateWs, '价格配置');

      // 导出文件
      XLSX.writeFile(wb, '价格配置导入模板.xlsx');
      message.success('模板下载成功');
    } catch (error) {
      console.error('模板下载失败:', error);
      message.error('模板下载失败，请重试');
    }
  };

  // 验证数据
  const validateData = (data: any[]): PreviewData[] => {
    return data.map(row => {
      const errors: string[] = [];
      const item: PreviewData = {
        type: row['资源类型'],
        area: row['区域'],
        country: row['国家'],
        city: row['城市'],
        ipRange: row['IP段'],
        price: parseFloat(row['价格']),
        errors: errors
      };

      // 验证资源类型
      if (!item.type || !['动态资源', '静态资源'].includes(item.type)) {
        errors.push('资源类型无效');
      }

      // 验证区域
      if (!item.area || !['亚洲', '欧洲', '北美', '南美', '非洲', '大洋洲'].includes(item.area)) {
        errors.push('区域无效');
      }

      // 验证必填字段
      if (!item.country) errors.push('国家不能为空');
      if (!item.city) errors.push('城市不能为空');

      // 验证价格
      if (isNaN(item.price) || item.price <= 0) {
        errors.push('价格必须大于0');
      }

      // 验证IP段格式
      if (item.ipRange && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}-\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(item.ipRange)) {
        errors.push('IP段格式错误');
      }

      return item;
    });
  };

  // 处理文件上传
  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[workbook.SheetNames.length - 1]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // 验证数据
          const validatedData = validateData(jsonData);
          const validCount = validatedData.filter(item => !item.errors?.length).length;
          
          setPreviewData(validatedData);
          setPreviewStats({
            total: validatedData.length,
            valid: validCount,
            invalid: validatedData.length - validCount
          });
          setPreviewVisible(true);
        } catch (error) {
          console.error('解析文件失败:', error);
          message.error('文件格式错误，请检查后重试');
        }
      };
      reader.readAsArrayBuffer(file);
      return false;
    }
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (previewStats.invalid > 0) {
      message.error('存在无效数据，请修正后重试');
      return;
    }

    try {
      setImporting(true);
      const importData = previewData.map(item => ({
        type: item.type === '动态资源' ? 'dynamic' : 'static',
        area: item.area,
        country: item.country,
        city: item.city,
        ipRange: item.ipRange,
        price: item.price
      }));

      const response = await request.post<ApiResponse<ImportResult>>('/api/product/prices/batch-import', {
        prices: importData
      });

      const { code, message: msg, data } = response.data;
      
      if (code === 200 && data) {
        const { total, success, failed } = data;
        message.success(
          `导入完成：共 ${total} 条数据，成功 ${success} 条，失败 ${failed} 条`
        );
        setPreviewVisible(false);
        onImportSuccess();
      } else {
        throw new Error(msg || '导入失败');
      }
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  // 预览表格列配置
  const previewColumns = [
    {
      title: '资源类型',
      dataIndex: 'type',
      width: 100,
    },
    {
      title: '区域',
      dataIndex: 'area',
      width: 100,
    },
    {
      title: '国家',
      dataIndex: 'country',
      width: 120,
    },
    {
      title: '城市',
      dataIndex: 'city',
      width: 120,
    },
    {
      title: 'IP段',
      dataIndex: 'ipRange',
      width: 180,
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 100,
      render: (price: number) => price?.toFixed(1)
    },
    {
      title: '状态',
      dataIndex: 'errors',
      width: 200,
      render: (errors: string[]) => (
        errors?.length ? (
          <Text type="danger">{errors.join('; ')}</Text>
        ) : (
          <Text type="success">有效</Text>
        )
      )
    }
  ];

  return (
    <>
      <Space>
        <Button
          icon={<FileExcelOutlined />}
          onClick={handleDownloadTemplate}
        >
          下载模板
        </Button>
        <Upload {...uploadProps}>
          <Button 
            icon={<UploadOutlined />} 
            loading={importing}
          >
            导入
          </Button>
        </Upload>
        <Button 
          icon={<DownloadOutlined />} 
          onClick={handleExport}
        >
          导出
        </Button>
      </Space>

      <Modal
        title="导入数据预览"
        open={previewVisible}
        width={1000}
        onOk={handleConfirmImport}
        onCancel={() => setPreviewVisible(false)}
        confirmLoading={importing}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>总记录数：{previewStats.total}</Text>
          <Text style={{ marginLeft: 16 }}>
            有效记录：<Text type="success">{previewStats.valid}</Text>
          </Text>
          <Text style={{ marginLeft: 16 }}>
            无效记录：<Text type="danger">{previewStats.invalid}</Text>
          </Text>
        </div>
        <Table
          columns={previewColumns}
          dataSource={previewData}
          rowKey={(_, index) => `${index}`}
          scroll={{ y: 400 }}
          pagination={false}
          size="small"
        />
      </Modal>
    </>
  );
};

export default PriceImportExport; 