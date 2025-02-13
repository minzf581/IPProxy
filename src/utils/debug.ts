/**
 * 调试工具模块
 * 
 * 提供统一的日志记录接口，可以根据环境切换日志级别
 */

const isDevelopment = process.env.NODE_ENV === 'development';

interface DebugLogger {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
}

const createLogger = (namespace: string): DebugLogger => ({
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(`[${namespace}]`, ...args);
    }
  },
  error: (...args: any[]) => {
    console.error(`[${namespace}]`, ...args);
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(`[${namespace}]`, ...args);
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(`[${namespace}]`, ...args);
    }
  }
});

export const debug = {
  auth: createLogger('Auth'),
  user: createLogger('User'),
  agent: createLogger('Agent'),
  order: createLogger('Order'),
  product: createLogger('Product'),
  dashboard: createLogger('Dashboard'),
  log: (...args: any[]) => isDevelopment && console.log(...args),
  error: (...args: any[]) => console.error(...args)
}; 