export interface DebugOptions {
  namespace?: string;
  timestamp?: boolean;
  level?: 'debug' | 'info' | 'warn' | 'error';
}

export class Debug {
  private namespace: string;
  private showTimestamp: boolean;

  constructor(options: DebugOptions = {}) {
    this.namespace = options.namespace || 'App';
    this.showTimestamp = options.timestamp !== false;
  }

  private getPrefix(level: string): string {
    const timestamp = this.showTimestamp ? `[${new Date().toISOString()}]` : '';
    return `${timestamp} [${this.namespace}] [${level}]`;
  }

  private formatArgs(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return arg;
        }
      }
      return arg;
    });
  }

  log(...args: any[]): void {
    this.info(...args);
  }

  info(...args: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.info(this.getPrefix('INFO'), ...this.formatArgs(args));
    }
  }

  warn(...args: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(this.getPrefix('WARN'), ...this.formatArgs(args));
    }
  }

  error(...args: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error(this.getPrefix('ERROR'), ...this.formatArgs(args));
    }
  }

  trace(message: string): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.getPrefix('TRACE'), message);
      console.trace();
    }
  }

  group(label: string): void {
    if (process.env.NODE_ENV !== 'production') {
      console.group(`${this.getPrefix('GROUP')} ${label}`);
    }
  }

  groupEnd(): void {
    if (process.env.NODE_ENV !== 'production') {
      console.groupEnd();
    }
  }

  // 用于记录 API 请求
  request(config: any): void {
    this.group('API Request');
    this.log('URL:', config.url);
    this.log('Method:', config.method);
    this.log('Headers:', config.headers);
    if (config.params) this.log('Query Params:', config.params);
    if (config.data) this.log('Request Body:', config.data);
    this.groupEnd();
  }

  // 用于记录 API 响应
  response(response: any): void {
    this.group('API Response');
    this.log('Status:', response.status);
    this.log('Headers:', response.headers);
    this.log('Data:', response.data);
    this.groupEnd();
  }

  // 用于记录错误
  logError(error: any): void {
    this.group('Error Details');
    this.error('Message:', error.message);
    if (error.response) {
      this.error('Response Status:', error.response.status);
      this.error('Response Data:', error.response.data);
    }
    if (error.config) {
      this.error('Request Config:', {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers
      });
    }
    this.error('Stack:', error.stack);
    this.groupEnd();
  }
}

export interface DebugNamespaces {
  auth: Debug;
  request: Debug;
  dashboard: Debug;
  layout: Debug;
  api: Debug;
}

export const debug: DebugNamespaces = {
  auth: new Debug({ namespace: 'Auth' }),
  request: new Debug({ namespace: 'Request' }),
  dashboard: new Debug({ namespace: 'Dashboard' }),
  layout: new Debug({ namespace: 'Layout' }),
  api: new Debug({ namespace: 'API' })
}; 