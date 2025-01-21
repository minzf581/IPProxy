// 模拟数据
let systemSettings = {
  siteName: 'IP代理管理系统',
  siteDescription: '专业的IP代理服务平台',
  contactEmail: 'admin@example.com',
  maintenance: false,
  maintenanceMessage: '系统维护中，请稍后再试...',
  ipLimitPerUser: 10,
  orderExpiryDays: 30,
  allowRegistration: true,
  requireEmailVerification: true,
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUser: 'noreply@example.com',
  smtpPassword: '********',
  smtpFrom: 'IP代理系统 <noreply@example.com>',
};

export async function getSystemSettings() {
  return systemSettings;
}

export async function updateSystemSettings(settings: any) {
  systemSettings = { ...systemSettings, ...settings };
  return systemSettings;
}

export async function testEmailSettings(settings: any) {
  // 模拟发送测试邮件
  const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom } = settings;
  
  // 在实际应用中，这里需要实现真实的邮件发送逻辑
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !smtpFrom) {
    throw new Error('邮件配置不完整');
  }
  
  // 模拟异步操作
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return true;
} 