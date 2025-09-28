import { Request, Response } from 'express';
import createPrometheusMetrics from 'prometheus-api-metrics';
import client from 'prom-client';
import os from 'os';
import { logger } from '../utils/logger';
import { SupabaseService } from './supabase';

export class MonitoringService {
  private register: client.Registry;
  private supabaseService: SupabaseService;

  // Custom metrics
  private httpRequestDuration: client.Histogram<string>;
  private httpRequestTotal: client.Counter<string>;
  private activeConnections: client.Gauge<string>;
  private databaseConnections: client.Gauge<string>;
  private memoryUsage: client.Gauge<string>;
  private cpuUsage: client.Gauge<string>;
  private errorRate: client.Counter<string>;
  private responseTime: client.Histogram<string>;

  constructor() {
    this.register = new client.Registry();
    this.supabaseService = new SupabaseService();

    // Add default metrics
    client.collectDefaultMetrics({
      register: this.register,
      prefix: 'auzap_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });

    this.initializeCustomMetrics();
    this.startMetricsCollection();
  }

  private initializeCustomMetrics(): void {
    // HTTP Request Duration
    this.httpRequestDuration = new client.Histogram({
      name: 'auzap_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    });

    // HTTP Request Total
    this.httpRequestTotal = new client.Counter({
      name: 'auzap_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    // Active Connections
    this.activeConnections = new client.Gauge({
      name: 'auzap_active_connections_total',
      help: 'Number of active WebSocket connections'
    });

    // Database Connections
    this.databaseConnections = new client.Gauge({
      name: 'auzap_database_connections_total',
      help: 'Number of active database connections'
    });

    // Memory Usage
    this.memoryUsage = new client.Gauge({
      name: 'auzap_memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type']
    });

    // CPU Usage
    this.cpuUsage = new client.Gauge({
      name: 'auzap_cpu_usage_percent',
      help: 'CPU usage percentage'
    });

    // Error Rate
    this.errorRate = new client.Counter({
      name: 'auzap_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'service']
    });

    // Response Time
    this.responseTime = new client.Histogram({
      name: 'auzap_response_time_seconds',
      help: 'Response time in seconds',
      labelNames: ['endpoint']
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.activeConnections);
    this.register.registerMetric(this.databaseConnections);
    this.register.registerMetric(this.memoryUsage);
    this.register.registerMetric(this.cpuUsage);
    this.register.registerMetric(this.errorRate);
    this.register.registerMetric(this.responseTime);
  }

  private startMetricsCollection(): void {
    // Collect system metrics every 15 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 15000);

    // Collect application metrics every 30 seconds
    setInterval(() => {
      this.collectApplicationMetrics();
    }, 30000);
  }

  private collectSystemMetrics(): void {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      this.memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
      this.memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
      this.memoryUsage.set({ type: 'external' }, memUsage.external);
      this.memoryUsage.set({ type: 'rss' }, memUsage.rss);

      // CPU usage (simple approximation)
      const loadAvg = os.loadavg();
      this.cpuUsage.set(loadAvg[0] * 100 / os.cpus().length);

    } catch (error) {
      logger.error('Error collecting system metrics:', error);
      this.errorRate.inc({ type: 'metrics_collection', service: 'monitoring' });
    }
  }

  private async collectApplicationMetrics(): Promise<void> {
    try {
      // Database connection check
      const dbHealth = await this.checkDatabaseHealth();
      this.databaseConnections.set(dbHealth.connectionCount);

    } catch (error) {
      logger.error('Error collecting application metrics:', error);
      this.errorRate.inc({ type: 'metrics_collection', service: 'database' });
    }
  }

  // Middleware to track HTTP requests
  public requestMetricsMiddleware() {
    const self = this; // Capture the MonitoringService instance
    return (req: Request, res: Response, next: Function) => {
      const startTime = Date.now();

      // Override res.end to capture metrics when request completes
      const originalEnd = res.end;
      res.end = function(this: Response, ...args: any[]) {
        const duration = (Date.now() - startTime) / 1000;
        const route = req.route?.path || req.path;

        // Record metrics
        const labels = {
          method: req.method,
          route: route,
          status_code: res.statusCode.toString()
        };

        self.httpRequestDuration.observe(labels, duration);
        self.httpRequestTotal.inc(labels);
        self.responseTime.observe({ endpoint: route }, duration);

        // Call original end
        originalEnd.apply(this, args);
      }.bind(this);

      next();
    };
  }

  // Update active connections count
  public updateActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  // Record error
  public recordError(type: string, service: string): void {
    this.errorRate.inc({ type, service });
  }

  // Health check endpoint
  public async getHealthStatus(): Promise<any> {
    const startTime = Date.now();

    try {
      // Basic health indicators
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        build: {
          date: process.env.BUILD_DATE,
          commit: process.env.BUILD_COMMIT,
          branch: process.env.BUILD_BRANCH
        },
        system: {
          memory: process.memoryUsage(),
          cpu: {
            loadAverage: os.loadavg(),
            cores: os.cpus().length
          },
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname()
        },
        services: {
          database: await this.checkDatabaseHealth(),
          supabase: await this.checkSupabaseHealth()
        },
        metrics: {
          response_time: Date.now() - startTime
        }
      };

      // Determine overall health status
      const serviceStatuses = Object.values(health.services);
      const allHealthy = serviceStatuses.every(service =>
        typeof service === 'object' && service.status === 'healthy'
      );

      health.status = allHealthy ? 'healthy' : 'degraded';

      return health;

    } catch (error) {
      logger.error('Health check failed:', error);
      this.recordError('health_check', 'monitoring');

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          response_time: Date.now() - startTime
        }
      };
    }
  }

  // Database health check
  private async checkDatabaseHealth(): Promise<any> {
    try {
      const startTime = Date.now();

      // Simple query to test database connectivity
      const result = await this.supabaseService.testConnection();

      return {
        status: 'healthy',
        response_time: Date.now() - startTime,
        connectionCount: 1, // Simplified for REST API
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connection failed',
        lastChecked: new Date().toISOString()
      };
    }
  }

  // Supabase health check
  private async checkSupabaseHealth(): Promise<any> {
    try {
      const startTime = Date.now();

      // Test Supabase connectivity
      const result = await this.supabaseService.healthCheck();

      return {
        status: 'healthy',
        response_time: Date.now() - startTime,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Supabase connection failed',
        lastChecked: new Date().toISOString()
      };
    }
  }

  // Get Prometheus metrics
  public async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Readiness probe (for Kubernetes)
  public async getReadiness(): Promise<any> {
    try {
      // Check if application is ready to serve traffic
      const dbHealth = await this.checkDatabaseHealth();
      const supabaseHealth = await this.checkSupabaseHealth();

      const ready = dbHealth.status === 'healthy' && supabaseHealth.status === 'healthy';

      return {
        status: ready ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbHealth.status === 'healthy',
          supabase: supabaseHealth.status === 'healthy'
        }
      };

    } catch (error) {
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Readiness check failed'
      };
    }
  }

  // Liveness probe (for Kubernetes)
  public getLiveness(): any {
    // Simple liveness check - if the process is running, it's alive
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}