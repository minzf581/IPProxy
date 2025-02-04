import type { ApiResponse, ApiRequestParams } from '@/types/api';

export interface DebugOptions {
  namespace?: string;
  timestamp?: boolean;
  level?: 'debug' | 'info' | 'warn' | 'error';
  enabled?: boolean;
}

export class Debug {
  private namespace: string;
  private showTimestamp: boolean;
  private enabled: boolean;

  constructor(options: DebugOptions = {}) {
    this.namespace = options.namespace || 'App';
    this.showTimestamp = options.timestamp !== false;
    this.enabled = options.enabled !== false && process.env.NODE_ENV !== 'production';
  }

  private getPrefix(level: string): string {
    const timestamp = this.showTimestamp ? `[${new Date().toISOString()}]` : '';
    return `${timestamp} [${this.namespace}] [${level}]`;
  }

  private formatArgs(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          if (arg instanceof Error) {
            return {
              message: arg.message,
              stack: arg.stack,
              name: arg.name,
              ...(arg as any)
            };
          }
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return arg;
        }
      }
      return arg;
    });
  }

  private shouldLog(): boolean {
    return this.enabled;
  }

  log(...args: any[]): void {
    if (this.shouldLog()) {
      console.log(this.getPrefix('LOG'), ...this.formatArgs(args));
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog()) {
      console.info(this.getPrefix('INFO'), ...this.formatArgs(args));
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog()) {
      console.warn(this.getPrefix('WARN'), ...this.formatArgs(args));
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog()) {
      console.error(this.getPrefix('ERROR'), ...this.formatArgs(args));
    }
  }

  trace(message: string): void {
    if (this.shouldLog()) {
      console.log(this.getPrefix('TRACE'), message);
      console.trace();
    }
  }

  group(label: string): void {
    if (this.shouldLog()) {
      console.group(`${this.getPrefix('GROUP')} ${label}`);
    }
  }

  groupEnd(): void {
    if (this.shouldLog()) {
      console.groupEnd();
    }
  }

  // API请求调试
  request(config: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: ApiRequestParams;
  }): void {
    if (this.shouldLog()) {
      this.group('API Request');
      this.log('URL:', config.url);
      this.log('Method:', config.method);
      this.log('Headers:', config.headers);
      if (config.params) this.log('Query Params:', config.params);
      if (config.data) {
        this.log('Request Body:', {
          ...config.data,
          params: config.data.params.length > 100 
            ? `${config.data.params.slice(0, 100)}...`
            : config.data.params
        });
      }
      this.groupEnd();
    }
  }

  // API响应调试
  response<T>(response: {
    status: number;
    headers?: Record<string, string>;
    data: ApiResponse<T>;
  }): void {
    if (this.shouldLog()) {
      this.group('API Response');
      this.log('Status:', response.status);
      this.log('Headers:', response.headers);
      this.log('Response Data:', {
        code: response.data.code,
        msg: response.data.msg,
        reqId: response.data.reqId,
        hasData: !!response.data.data,
        dataType: typeof response.data.data
      });
      if (response.data.data) {
        const dataStr = JSON.stringify(response.data.data);
        this.log('Data:', dataStr.length > 200 
          ? `${dataStr.slice(0, 200)}...`
          : dataStr
        );
      }
      this.groupEnd();
    }
  }

  // 错误调试
  logError(error: any): void {
    if (this.shouldLog()) {
      this.group('Error Details');
      this.error('Type:', error.constructor.name);
      this.error('Message:', error.message);
      if (error.response) {
        this.error('Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      if (error.config) {
        this.error('Request Config:', {
          url: error.config.url,
          method: error.config.method,
          headers: error.config.headers,
          params: error.config.params,
          data: error.config.data
        });
      }
      this.error('Stack:', error.stack);
      this.groupEnd();
    }
  }

  // API参数调试
  logApiParams(params: Record<string, any>): void {
    if (this.shouldLog()) {
      this.group('API Parameters');
      Object.entries(params).forEach(([key, value]) => {
        this.log(`${key}:`, value);
      });
      this.groupEnd();
    }
  }
}

export interface DebugNamespaces {
  auth: Debug;
  request: Debug;
  dashboard: Debug;
  layout: Debug;
  api: Debug;
  proxy: Debug;
  order: Debug;
  user: Debug;
  log: (namespace: string, message: string, ...args: any[]) => void;
  info: (namespace: string, message: string, ...args: any[]) => void;
  error: (namespace: string, message: string, ...args: any[]) => void;
  warn: (namespace: string, message: string, ...args: any[]) => void;
}

// 创建调试实例
export const debug: DebugNamespaces = {
  auth: new Debug({ namespace: 'Auth' }),
  request: new Debug({ namespace: 'Request' }),
  dashboard: new Debug({ namespace: 'Dashboard' }),
  layout: new Debug({ namespace: 'Layout' }),
  api: new Debug({ namespace: 'API' }),
  proxy: new Debug({ namespace: 'Proxy' }),
  order: new Debug({ namespace: 'Order' }),
  user: new Debug({ namespace: 'User' }),
  log: (namespace: string, message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${namespace}] ${message}`, ...args);
    }
  },
  info: (namespace: string, message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${namespace}] [INFO] ${message}`, ...args);
    }
  },
  error: (namespace: string, message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [${namespace}] [ERROR] ${message}`, ...args);
    }
  },
  warn: (namespace: string, message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.warn(`[${timestamp}] [${namespace}] [WARN] ${message}`, ...args);
    }
  }
}; 