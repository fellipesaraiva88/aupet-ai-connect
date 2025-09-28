type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, ...args));
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, ...args));
    }
  }

  // Specialized logging methods
  http(method: string, url: string, status: number, responseTime: number): void {
    this.info(`${method} ${url} ${status} - ${responseTime}ms`);
  }

  evolution(action: string, instanceName: string, details?: any): void {
    this.info(`Evolution API - ${action} [${instanceName}]`, details);
  }

  ai(action: string, details?: any): void {
    this.info(`AI Service - ${action}`, details);
  }

  websocket(event: string, socketId: string, details?: any): void {
    this.info(`WebSocket - ${event} [${socketId}]`, details);
  }

  supabase(operation: string, table: string, details?: any): void {
    this.info(`Supabase - ${operation} [${table}]`, details);
  }

  webhook(action: string, event: string, details?: any): void {
    this.info(`Webhook - ${action} [${event}]`, details);
  }
}

export const logger = new Logger();