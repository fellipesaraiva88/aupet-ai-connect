import { logger } from '../../utils/logger';
import { WhatsAppManager } from './managers/WhatsAppManager';
import { MessageQueue } from './MessageQueue';
import { RedisManager } from '../../config/redis.config';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  services: {
    redis: ServiceHealth;
    whatsapp: ServiceHealth;
    messageQueue: ServiceHealth;
    providers: Record<string, ServiceHealth>;
  };
  metrics: {
    totalSessions: number;
    activeSessions: number;
    queueStats: any;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
  details?: any;
  lastCheck: Date;
}

export class HealthCheckService {
  private whatsappManager?: WhatsAppManager;
  private messageQueue?: MessageQueue;
  private checkInterval: number;
  private timer?: NodeJS.Timeout;
  private startTime: Date;

  constructor(checkInterval = 30000) {
    this.checkInterval = checkInterval;
    this.startTime = new Date();
  }

  public setWhatsAppManager(manager: WhatsAppManager): void {
    this.whatsappManager = manager;
  }

  public setMessageQueue(queue: MessageQueue): void {
    this.messageQueue = queue;
  }

  public startHealthChecks(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(async () => {
      try {
        const health = await this.getHealthStatus();

        if (health.status === 'unhealthy') {
          logger.error('System health check failed', health);
          // Aqui você pode adicionar alertas, notificações, etc.
        } else if (health.status === 'degraded') {
          logger.warn('System health degraded', health);
        } else {
          logger.debug('System health check passed');
        }
      } catch (error) {
        logger.error('Health check execution failed:', error);
      }
    }, this.checkInterval);

    logger.info('Health checks started', { interval: this.checkInterval });
  }

  public stopHealthChecks(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
      logger.info('Health checks stopped');
    }
  }

  public async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const [
        redisHealth,
        whatsappHealth,
        queueHealth,
        providersHealth
      ] = await Promise.all([
        this.checkRedisHealth(),
        this.checkWhatsAppHealth(),
        this.checkMessageQueueHealth(),
        this.checkProvidersHealth()
      ]);

      const metrics = await this.getMetrics();
      const overallStatus = this.determineOverallStatus([
        redisHealth,
        whatsappHealth,
        queueHealth,
        ...Object.values(providersHealth)
      ]);

      const health: HealthStatus = {
        status: overallStatus,
        timestamp: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          redis: redisHealth,
          whatsapp: whatsappHealth,
          messageQueue: queueHealth,
          providers: providersHealth
        },
        metrics
      };

      logger.debug('Health check completed', {
        status: overallStatus,
        duration: Date.now() - startTime
      });

      return health;
    } catch (error: any) {
      logger.error('Health check failed:', error);

      return {
        status: 'unhealthy',
        timestamp: new Date(),
        uptime: Date.now() - this.startTime.getTime(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          redis: { status: 'unhealthy', error: 'Health check failed', lastCheck: new Date() },
          whatsapp: { status: 'unhealthy', error: 'Health check failed', lastCheck: new Date() },
          messageQueue: { status: 'unhealthy', error: 'Health check failed', lastCheck: new Date() },
          providers: {}
        },
        metrics: {
          totalSessions: 0,
          activeSessions: 0,
          queueStats: {},
          memoryUsage: process.memoryUsage()
        }
      };
    }
  }

  private async checkRedisHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const isHealthy = await RedisManager.healthCheck();
      const latency = Date.now() - startTime;

      if (!isHealthy) {
        return {
          status: 'unhealthy',
          latency,
          error: 'Redis ping failed',
          lastCheck: new Date()
        };
      }

      // Test Redis operations
      const redis = RedisManager.getInstance();
      const testKey = 'health_check_test';
      const testValue = Date.now().toString();

      await redis.set(testKey, testValue, 'EX', 10);
      const retrieved = await redis.get(testKey);
      await redis.del(testKey);

      if (retrieved !== testValue) {
        return {
          status: 'degraded',
          latency,
          error: 'Redis operations failed',
          lastCheck: new Date()
        };
      }

      return {
        status: latency > 1000 ? 'degraded' : 'healthy',
        latency,
        lastCheck: new Date()
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message,
        lastCheck: new Date()
      };
    }
  }

  private async checkWhatsAppHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      if (!this.whatsappManager) {
        return {
          status: 'unhealthy',
          error: 'WhatsApp Manager not initialized',
          lastCheck: new Date()
        };
      }

      const metrics = this.whatsappManager.getMetrics();
      const latency = Date.now() - startTime;

      // Check if there are any sessions and if they're responsive
      if (metrics.totalSessions === 0) {
        return {
          status: 'healthy',
          latency,
          details: metrics,
          lastCheck: new Date()
        };
      }

      // Check connection ratio
      const connectionRatio = metrics.connectedSessions / metrics.totalSessions;

      if (connectionRatio < 0.5) {
        return {
          status: 'degraded',
          latency,
          error: 'Low connection ratio',
          details: metrics,
          lastCheck: new Date()
        };
      }

      return {
        status: 'healthy',
        latency,
        details: metrics,
        lastCheck: new Date()
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message,
        lastCheck: new Date()
      };
    }
  }

  private async checkMessageQueueHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      if (!this.messageQueue) {
        return {
          status: 'unhealthy',
          error: 'Message Queue not initialized',
          lastCheck: new Date()
        };
      }

      const stats = await this.messageQueue.getQueueStats();
      const latency = Date.now() - startTime;

      // Check for stuck jobs
      const totalActiveJobs = stats.incoming.active + stats.outgoing.active;
      const totalFailedJobs = stats.incoming.failed + stats.outgoing.failed;

      if (totalFailedJobs > 50) {
        return {
          status: 'degraded',
          latency,
          error: 'High number of failed jobs',
          details: stats,
          lastCheck: new Date()
        };
      }

      if (totalActiveJobs > 100) {
        return {
          status: 'degraded',
          latency,
          error: 'High number of active jobs',
          details: stats,
          lastCheck: new Date()
        };
      }

      return {
        status: 'healthy',
        latency,
        details: stats,
        lastCheck: new Date()
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: error.message,
        lastCheck: new Date()
      };
    }
  }

  private async checkProvidersHealth(): Promise<Record<string, ServiceHealth>> {
    if (!this.whatsappManager) {
      return {};
    }

    const providersHealth: Record<string, ServiceHealth> = {};

    // Simular check dos providers - em implementação real, seria necessário
    // expor os providers do WhatsAppManager ou implementar método específico
    try {
      // Por enquanto, vamos assumir que temos Evolution como provider principal
      const startTime = Date.now();

      // Aqui você implementaria o health check específico de cada provider
      // Por exemplo, para Evolution API:
      const isEvolutionHealthy = true; // Placeholder - implementar check real

      providersHealth['evolution'] = {
        status: isEvolutionHealthy ? 'healthy' : 'unhealthy',
        latency: Date.now() - startTime,
        lastCheck: new Date()
      };
    } catch (error: any) {
      providersHealth['evolution'] = {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date()
      };
    }

    return providersHealth;
  }

  private async getMetrics(): Promise<HealthStatus['metrics']> {
    try {
      const [queueStats, whatsappMetrics] = await Promise.all([
        this.messageQueue?.getQueueStats() || {},
        this.whatsappManager?.getMetrics() || { totalSessions: 0, connectedSessions: 0 }
      ]);

      return {
        totalSessions: whatsappMetrics.totalSessions || 0,
        activeSessions: whatsappMetrics.connectedSessions || 0,
        queueStats,
        memoryUsage: process.memoryUsage()
      };
    } catch (error) {
      logger.error('Failed to get metrics:', error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        queueStats: {},
        memoryUsage: process.memoryUsage()
      };
    }
  }

  private determineOverallStatus(services: ServiceHealth[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (services.some(service => service.status === 'unhealthy')) {
      return 'unhealthy';
    }

    if (services.some(service => service.status === 'degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  // Recovery methods
  public async attemptRecovery(): Promise<void> {
    logger.info('Attempting system recovery');

    try {
      // Restart Redis connection if unhealthy
      const redisHealth = await this.checkRedisHealth();
      if (redisHealth.status === 'unhealthy') {
        logger.info('Attempting Redis recovery');
        await RedisManager.closeConnection();
        // Reconnection will happen automatically on next use
      }

      // Restart message queue if unhealthy
      if (this.messageQueue) {
        const queueHealth = await this.checkMessageQueueHealth();
        if (queueHealth.status === 'unhealthy') {
          logger.info('Attempting message queue recovery');
          await this.messageQueue.resumeQueues();
        }
      }

      logger.info('Recovery attempt completed');
    } catch (error) {
      logger.error('Recovery attempt failed:', error);
    }
  }

  // Cleanup
  public dispose(): void {
    this.stopHealthChecks();
  }
}

// Utility functions for monitoring
export class MetricsCollector {
  private static startTime = Date.now();
  private static requestCount = 0;
  private static errorCount = 0;

  static incrementRequest(): void {
    this.requestCount++;
  }

  static incrementError(): void {
    this.errorCount++;
  }

  static getBasicMetrics(): any {
    const uptime = Date.now() - this.startTime;

    return {
      uptime,
      requests: this.requestCount,
      errors: this.errorCount,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
  }

  static reset(): void {
    this.requestCount = 0;
    this.errorCount = 0;
  }
}