import ipProxyAPI from '../utils/ipProxyAPI';

export interface MainUser {
  appUsername: string;
  username: string;
  password: string;
  status: number;
  authStatus: number;
}

const MAIN_USER_KEY = 'ipproxy_main_user';

// 生产环境的默认主账号配置
const DEFAULT_PROD_USER: MainUser = {
  appUsername: 'admin',
  username: 'admin',
  password: 'admin123',
  status: 1,
  authStatus: 2
};

export async function initializeMainUser(): Promise<MainUser> {
  // 检查是否已经有主账号信息
  const savedUser = localStorage.getItem(MAIN_USER_KEY);
  if (savedUser) {
    return JSON.parse(savedUser);
  }

  // 检查是否在 GitHub Pages 环境
  const isGitHubPages = window.location.hostname === 'minzf581.github.io';
  
  if (isGitHubPages) {
    return DEFAULT_PROD_USER;
  }

  // 如果没有，创建新的主账号
  try {
    const mainUser = await ipProxyAPI.createMainUser({
      phone: '13800138000',
      email: 'admin@example.com',
      authType: 2, // 个人实名
      authName: 'Admin User',
      no: 'ADMIN001',
      status: 1  // 正常状态
    });

    // 为主账号创建产品
    await ipProxyAPI.createMainUserProduct(mainUser.username, mainUser.appUsername);

    // 只在本地环境保存主账号信息
    localStorage.setItem(MAIN_USER_KEY, JSON.stringify(mainUser));
    return mainUser;
  } catch (error) {
    console.error('Failed to initialize main user:', error);
    throw error;
  }
}

export function getMainUser(): MainUser | null {
  // 检查是否在 GitHub Pages 环境
  const isGitHubPages = window.location.hostname === 'minzf581.github.io';
  
  if (isGitHubPages) {
    return DEFAULT_PROD_USER;
  }

  // 本地开发环境：使用 localStorage
  const savedUser = localStorage.getItem(MAIN_USER_KEY);
  return savedUser ? JSON.parse(savedUser) : null;
}
