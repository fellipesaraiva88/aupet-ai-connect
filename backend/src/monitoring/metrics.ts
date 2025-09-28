import promClient from 'prom-client';
import { Request, Response } from 'express';
import { EnhancedLogger } from './logger';

/**
 * Enterprise Metrics Collection System
 * Provides comprehensive application metrics for monitoring and alerting
 */

// Initialize Prometheus metrics collection
promClient.collectDefaultMetrics({
  timeout: 5000,
  prefix: 'auzap_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// Create registry for custom metrics
export const metricsRegistry = new promClient.Registry();
promClient.register.setDefaultLabels({
  app: 'auzap-backend',
  version: process.env.npm_package_version || '1.0.0',
  environment: process.env.NODE_ENV || 'production',
  instance: process.env.HOSTNAME || require('os').hostname()
});

/**
 * HTTP Metrics
 */
export const httpRequestDuration = new promClient.Histogram({
  name: 'auzap_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code', 'handler'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

export const httpRequestTotal = new promClient.Counter({
  name: 'auzap_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'handler']
});

export const httpRequestSize = new promClient.Histogram({
  name: 'auzap_http_request_size_bytes',
  help: 'HTTP request size in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000]
});

export const httpResponseSize = new promClient.Histogram({
  name: 'auzap_http_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [100, 1000, 10000, 100000, 1000000]
});

/**
 * Business Metrics
 */
export const whatsappMessagesTotal = new promClient.Counter({
  name: 'auzap_whatsapp_messages_total',
  help: 'Total WhatsApp messages processed',
  labelNames: ['direction', 'type', 'status']
});

export const aiResponseDuration = new promClient.Histogram({
  name: 'auzap_ai_response_duration_seconds',
  help: 'AI response generation duration',
  labelNames: ['model', 'prompt_type'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30]
});

export const campaignMetrics = new promClient.Counter({
  name: 'auzap_campaigns_total',
  help: 'Total campaigns processed',
  labelNames: ['status', 'type']
});

export const userRegistrations = new promClient.Counter({
  name: 'auzap_user_registrations_total',
  help: 'Total user registrations',
  labelNames: ['source', 'plan']
});

export const subscriptionMetrics = new promClient.Gauge({
  name: 'auzap_active_subscriptions',
  help: 'Number of active subscriptions',
  labelNames: ['plan', 'status']
});

/**
 * Database Metrics
 */
export const databaseQueryDuration = new promClient.Histogram({
  name: 'auzap_database_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['operation', 'table', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const databaseConnectionsActive = new promClient.Gauge({
  name: 'auzap_database_connections_active',
  help: 'Active database connections'
});

export const databaseQueryTotal = new promClient.Counter({
  name: 'auzap_database_queries_total',
  help: 'Total database queries executed',
  labelNames: ['operation', 'table', 'status']
});

export const supabaseApiCalls = new promClient.Counter({
  name: 'auzap_supabase_api_calls_total',
  help: 'Total Supabase API calls',
  labelNames: ['endpoint', 'method', 'status']
});

/**
 * Cache Metrics
 */
export const cacheOperations = new promClient.Counter({
  name: 'auzap_cache_operations_total',
  help: 'Cache operations',
  labelNames: ['operation', 'status', 'cache_type']
});

export const cacheHitRate = new promClient.Gauge({
  name: 'auzap_cache_hit_rate',
  help: 'Cache hit rate percentage',
  labelNames: ['cache_type']
});

/**
 * External Service Metrics
 */
export const externalServiceCalls = new promClient.Counter({
  name: 'auzap_external_service_calls_total',
  help: 'External service API calls',
  labelNames: ['service', 'endpoint', 'status']
});

export const externalServiceDuration = new promClient.Histogram({
  name: 'auzap_external_service_duration_seconds',
  help: 'External service call duration',
  labelNames: ['service', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

/**
 * Security Metrics
 */
export const securityEvents = new promClient.Counter({
  name: 'auzap_security_events_total',
  help: 'Security events detected',
  labelNames: ['event_type', 'severity', 'source']
});

export const rateLimitHits = new promClient.Counter({
  name: 'auzap_rate_limit_hits_total',
  help: 'Rate limit violations',
  labelNames: ['endpoint', 'user_id']
});

export const authenticationAttempts = new promClient.Counter({
  name: 'auzap_authentication_attempts_total',
  help: 'Authentication attempts',
  labelNames: ['method', 'status', 'source']
});

/**
 * Application Performance Metrics
 */
export const eventLoopLag = new promClient.Gauge({
  name: 'auzap_event_loop_lag_seconds',
  help: 'Event loop lag in seconds'
});

export const memoryUsage = new promClient.Gauge({
  name: 'auzap_memory_usage_bytes',
  help: 'Memory usage by type',
  labelNames: ['type']
});

export const cpuUsage = new promClient.Gauge({
  name: 'auzap_cpu_usage_percent',
  help: 'CPU usage percentage'
});

export const activeConnections = new promClient.Gauge({
  name: 'auzap_active_connections',
  help: 'Active WebSocket/HTTP connections',
  labelNames: ['type']
});

/**
 * Error Tracking Metrics
 */
export const errorsTotal = new promClient.Counter({
  name: 'auzap_errors_total',
  help: 'Total application errors',
  labelNames: ['error_type', 'component', 'severity']
});

export const unhandledErrors = new promClient.Counter({
  name: 'auzap_unhandled_errors_total',
  help: 'Unhandled errors and rejections',
  labelNames: ['type']
});

/**
 * Enhanced Metrics Collector Class
 */
export class MetricsCollector {
  private logger: EnhancedLogger;

  constructor(logger: EnhancedLogger) {
    this.logger = logger;
    this.startPerformanceMonitoring();
  }

  // HTTP request metrics collection
  recordHttpRequest(req: Request, res: Response, duration: number) {
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode.toString();
    const handler = req.route?.stack?.[0]?.name || 'unknown';

    httpRequestDuration
      .labels(method, route, statusCode, handler)
      .observe(duration / 1000);

    httpRequestTotal
      .labels(method, route, statusCode, handler)
      .inc();

    const requestSize = parseInt(req.get('content-length') || '0');
    if (requestSize > 0) {
      httpRequestSize
        .labels(method, route)
        .observe(requestSize);
    }

    const responseSize = parseInt(res.get('content-length') || '0');
    if (responseSize > 0) {
      httpResponseSize
        .labels(method, route, statusCode)
        .observe(responseSize);
    }
  }

  // WhatsApp message metrics
  recordWhatsAppMessage(direction: 'inbound' | 'outbound', type: string, status: 'success' | 'failed') {
    whatsappMessagesTotal
      .labels(direction, type, status)
      .inc();

    this.logger.info('WhatsApp message recorded', {
      direction,
      type,
      status,
      metric: 'whatsapp_messages_total'
    });
  }

  // AI response metrics
  recordAiResponse(model: string, promptType: string, duration: number) {
    aiResponseDuration
      .labels(model, promptType)
      .observe(duration / 1000);

    this.logger.info('AI response recorded', {
      model,
      promptType,
      duration,
      metric: 'ai_response_duration'
    });
  }

  // Database query metrics
  recordDatabaseQuery(operation: string, table: string, duration: number, status: 'success' | 'error') {
    databaseQueryDuration
      .labels(operation, table, status)
      .observe(duration / 1000);

    databaseQueryTotal
      .labels(operation, table, status)
      .inc();

    if (duration > 1000) {
      this.logger.warn('Slow database query detected', {
        operation,
        table,
        duration,
        status
      });
    }
  }

  // External service call metrics
  recordExternalServiceCall(service: string, endpoint: string, duration: number, status: string) {
    externalServiceCalls
      .labels(service, endpoint, status)
      .inc();

    externalServiceDuration
      .labels(service, endpoint)
      .observe(duration / 1000);
  }

  // Security event metrics
  recordSecurityEvent(eventType: string, severity: string, source: string) {
    securityEvents
      .labels(eventType, severity, source)
      .inc();

    this.logger.warn('Security event recorded', {
      eventType,
      severity,
      source,
      metric: 'security_events_total'
    });
  }

  // Error metrics
  recordError(errorType: string, component: string, severity: string, error?: Error) {
    errorsTotal
      .labels(errorType, component, severity)
      .inc();

    this.logger.error('Error recorded in metrics', error, {
      errorType,
      component,
      severity,
      metric: 'errors_total'
    });
  }

  // User registration metrics
  recordUserRegistration(source: string, plan: string) {
    userRegistrations
      .labels(source, plan)
      .inc();

    this.logger.info('User registration recorded', {
      source,
      plan,
      metric: 'user_registrations_total'
    });
  }

  // Campaign metrics
  recordCampaign(status: string, type: string) {
    campaignMetrics
      .labels(status, type)
      .inc();
  }

  // Cache metrics
  recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', cacheType: string, success: boolean) {
    cacheOperations
      .labels(operation, success ? 'success' : 'error', cacheType)
      .inc();
  }

  // Update cache hit rate
  updateCacheHitRate(cacheType: string, hitRate: number) {
    cacheHitRate
      .labels(cacheType)
      .set(hitRate);
  }

  // Performance monitoring
  private startPerformanceMonitoring() {
    const os = require('os');

    // Monitor event loop lag
    const eventLoopUtilization = require('perf_hooks').performance.eventLoopUtilization();
    setInterval(() => {
      const elu = require('perf_hooks').performance.eventLoopUtilization(eventLoopUtilization);
      eventLoopLag.set(elu.utilization);
    }, 5000);

    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage();
      memoryUsage.labels('rss').set(memUsage.rss);
      memoryUsage.labels('heapTotal').set(memUsage.heapTotal);
      memoryUsage.labels('heapUsed').set(memUsage.heapUsed);
      memoryUsage.labels('external').set(memUsage.external);
      memoryUsage.labels('arrayBuffers').set(memUsage.arrayBuffers || 0);
    }, 10000);

    // Monitor CPU usage
    setInterval(() => {
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });

      const usage = 100 - (totalIdle / totalTick) * 100;
      cpuUsage.set(usage);
    }, 15000);
  }
}

// Middleware for automatic HTTP metrics collection
export const createMetricsMiddleware = (metricsCollector: MetricsCollector) => {
  return (req: Request, res: Response, next: Function) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      metricsCollector.recordHttpRequest(req, res, duration);
    });

    next();
  };
};

// Endpoint to expose metrics for Prometheus scraping
export const getMetricsHandler = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    const metrics = await promClient.register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end('Error collecting metrics');
  }
};

// Health check with metrics
export const getHealthHandler = (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
};

export default MetricsCollector;