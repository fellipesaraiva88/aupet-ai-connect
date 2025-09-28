import pino from 'pino';
import { Request, Response } from 'express';

/**
 * Enterprise-grade structured logging system
 * Provides centralized logging with correlation IDs, performance metrics, and observability
 */

// Log levels configuration
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// Application context types
export interface LogContext {
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  operationId?: string;
  component?: string;
  action?: string;
  duration?: number;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
}

// Performance monitoring interface
export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  activeHandles: number;
  activeRequests: number;
}

// Custom log levels for business events
export enum BusinessEvent {
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  ORDER_CREATED = 'order_created',
  PAYMENT_PROCESSED = 'payment_processed',
  CAMPAIGN_STARTED = 'campaign_started',
  WHATSAPP_MESSAGE_SENT = 'whatsapp_message_sent',
  AI_RESPONSE_GENERATED = 'ai_response_generated',
  DATABASE_QUERY_SLOW = 'database_query_slow',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SECURITY_ALERT = 'security_alert'
}

// Create production-ready Pino logger configuration
const createLogger = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const baseConfig = {
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        'password',
        'token',
        'apiKey',
        'authorization',
        'cookie',
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]'
      ],
      censor: '[REDACTED]'
    }
  };

  if (isDevelopment) {
    return pino({
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false
        }
      }
    });
  }

  // Production configuration with structured JSON output
  return pino({
    ...baseConfig,
    base: {
      pid: process.pid,
      hostname: process.env.HOSTNAME || require('os').hostname(),
      service: 'auzap-backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    }
  });
};

export const logger = createLogger();

/**
 * Enhanced logger with business context and correlation tracking
 */
export class EnhancedLogger {
  private baseLogger: pino.Logger;
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.baseLogger = logger;
    this.context = context;
  }

  // Create child logger with additional context
  child(context: LogContext): EnhancedLogger {
    return new EnhancedLogger({ ...this.context, ...context });
  }

  // Standard logging methods with context
  trace(message: string, data?: any) {
    this.baseLogger.trace({ ...this.context, ...data }, message);
  }

  debug(message: string, data?: any) {
    this.baseLogger.debug({ ...this.context, ...data }, message);
  }

  info(message: string, data?: any) {
    this.baseLogger.info({ ...this.context, ...data }, message);
  }

  warn(message: string, data?: any) {
    this.baseLogger.warn({ ...this.context, ...data }, message);
  }

  error(message: string, error?: Error | any, data?: any) {
    const errorData = error instanceof Error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      }
    } : { error };

    this.baseLogger.error({
      ...this.context,
      ...errorData,
      ...data
    }, message);
  }

  fatal(message: string, error?: Error | any, data?: any) {
    const errorData = error instanceof Error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      }
    } : { error };

    this.baseLogger.fatal({
      ...this.context,
      ...errorData,
      ...data
    }, message);
  }

  // Business event logging
  logBusinessEvent(event: BusinessEvent, data?: any) {
    this.baseLogger.info({
      ...this.context,
      businessEvent: event,
      eventData: data,
      timestamp: new Date().toISOString()
    }, `Business event: ${event}`);
  }

  // Performance logging
  logPerformance(operation: string, metrics: PerformanceMetrics, data?: any) {
    this.baseLogger.info({
      ...this.context,
      operation,
      performance: metrics,
      ...data
    }, `Performance: ${operation}`);
  }

  // Security event logging
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', data?: any) {
    this.baseLogger.warn({
      ...this.context,
      securityEvent: event,
      severity,
      timestamp: new Date().toISOString(),
      ...data
    }, `Security event: ${event}`);
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, duration: number, data?: any) {
    const logLevel = duration > 1000 ? 'warn' : 'debug';

    this.baseLogger[logLevel]({
      ...this.context,
      database: {
        operation,
        table,
        duration,
        slow: duration > 1000
      },
      ...data
    }, `Database operation: ${operation} on ${table}`);
  }

  // API request/response logging
  logApiRequest(req: Request, res: Response, duration: number) {
    const statusCode = res.statusCode;
    const logLevel = statusCode >= 400 ? 'warn' : statusCode >= 500 ? 'error' : 'info';

    this.baseLogger[logLevel]({
      ...this.context,
      http: {
        method: req.method,
        url: req.url,
        statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        contentLength: res.get('Content-Length'),
        referrer: req.get('Referrer')
      },
      ip: req.ip,
      userId: (req as any).user?.id
    }, `${req.method} ${req.url} ${statusCode} - ${duration}ms`);
  }

  // External service call logging
  logExternalService(service: string, operation: string, duration: number, success: boolean, data?: any) {
    const logLevel = success ? 'info' : 'error';

    this.baseLogger[logLevel]({
      ...this.context,
      externalService: {
        service,
        operation,
        duration,
        success
      },
      ...data
    }, `External service: ${service}.${operation} ${success ? 'succeeded' : 'failed'}`);
  }
}

// Utility functions for correlation tracking
export const generateCorrelationId = (): string => {
  return require('uuid').v4();
};

export const generateTraceId = (): string => {
  return require('uuid').v4().replace(/-/g, '');
};

// Create default logger instance
export const createEnhancedLogger = (context?: LogContext): EnhancedLogger => {
  return new EnhancedLogger(context);
};

// Express middleware for request logging
export const createRequestLogger = () => {
  return (req: Request, res: Response, next: Function) => {
    const startTime = Date.now();
    const correlationId = req.headers['x-correlation-id'] as string || generateCorrelationId();
    const traceId = req.headers['x-trace-id'] as string || generateTraceId();

    // Add correlation tracking to request
    (req as any).correlationId = correlationId;
    (req as any).traceId = traceId;

    // Set response headers for correlation
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Trace-ID', traceId);

    // Create request-scoped logger
    const requestLogger = createEnhancedLogger({
      correlationId,
      traceId,
      requestId: correlationId,
      component: 'api'
    });

    // Add logger to request object
    (req as any).logger = requestLogger;

    // Log request start
    requestLogger.info('Request started', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime;
      requestLogger.logApiRequest(req, res, duration);

      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

// Export singleton instances
export default logger;