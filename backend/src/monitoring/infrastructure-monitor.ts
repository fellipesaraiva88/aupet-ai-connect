import os from 'os';
import promClient from 'prom-client';
import { EnhancedLogger } from './logger';
import { MetricsCollector } from './metrics';

/**
 * Infrastructure Monitoring System
 * Monitors system resources, network, disk I/O, and platform-specific metrics
 */

// System metrics
export const systemCpuUsage = new promClient.Gauge({
  name: 'auzap_system_cpu_usage_percent',
  help: 'System CPU usage percentage',
  labelNames: ['core']
});

export const systemMemoryUsage = new promClient.Gauge({
  name: 'auzap_system_memory_usage_bytes',
  help: 'System memory usage in bytes',
  labelNames: ['type']
});

export const systemLoadAverage = new promClient.Gauge({
  name: 'auzap_system_load_average',
  help: 'System load average',
  labelNames: ['period']
});

export const systemDiskUsage = new promClient.Gauge({
  name: 'auzap_system_disk_usage_bytes',
  help: 'Disk usage in bytes',
  labelNames: ['mount', 'type']
});

export const systemNetworkIO = new promClient.Counter({
  name: 'auzap_system_network_io_bytes_total',
  help: 'Network I/O in bytes',
  labelNames: ['interface', 'direction']
});

export const systemDiskIO = new promClient.Counter({
  name: 'auzap_system_disk_io_bytes_total',
  help: 'Disk I/O in bytes',
  labelNames: ['device', 'direction']
});

// Process metrics
export const processFileDescriptors = new promClient.Gauge({
  name: 'auzap_process_file_descriptors',
  help: 'Number of open file descriptors'
});

export const processThreads = new promClient.Gauge({
  name: 'auzap_process_threads',
  help: 'Number of process threads'
});

export const processUptime = new promClient.Gauge({
  name: 'auzap_process_uptime_seconds',
  help: 'Process uptime in seconds'
});

// Network metrics
export const networkLatency = new promClient.Histogram({
  name: 'auzap_network_latency_seconds',
  help: 'Network latency to external services',
  labelNames: ['target', 'protocol'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5]
});

export const networkConnections = new promClient.Gauge({
  name: 'auzap_network_connections',
  help: 'Active network connections',
  labelNames: ['state', 'protocol']
});

// Render.com specific metrics
export const renderInstanceMetrics = new promClient.Gauge({
  name: 'auzap_render_instance_metrics',
  help: 'Render.com instance metrics',
  labelNames: ['metric_type', 'instance_id']
});

export const renderDeploymentInfo = new promClient.Gauge({
  name: 'auzap_render_deployment_info',
  help: 'Render deployment information',
  labelNames: ['service_id', 'commit_hash', 'status']
});

// Application-specific infrastructure metrics
export const containerMemoryLimit = new promClient.Gauge({
  name: 'auzap_container_memory_limit_bytes',
  help: 'Container memory limit in bytes'
});

export const containerCpuLimit = new promClient.Gauge({
  name: 'auzap_container_cpu_limit_cores',
  help: 'Container CPU limit in cores'
});

/**
 * Infrastructure Monitoring Class
 */
export class InfrastructureMonitor {
  private logger: EnhancedLogger;
  private metricsCollector: MetricsCollector;
  private monitoringInterval?: NodeJS.Timeout;
  private networkMonitoringInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;

  // Platform detection
  private readonly platform = os.platform();
  private readonly isRender = process.env.RENDER === 'true';
  private readonly isContainer = process.env.NODE_ENV === 'production' && (
    process.env.KUBERNETES_SERVICE_HOST !== undefined ||
    process.env.DOCKER_CONTAINER_ID !== undefined ||
    this.isRender
  );

  constructor(logger: EnhancedLogger, metricsCollector: MetricsCollector) {
    this.logger = logger.child({ component: 'infrastructure-monitor' });
    this.metricsCollector = metricsCollector;

    this.detectPlatform();
  }

  /**
   * Start comprehensive infrastructure monitoring
   */
  start(): void {
    if (this.isMonitoring) {
      this.logger.warn('Infrastructure monitoring already started');
      return;
    }

    this.logger.info('Starting infrastructure monitoring', {
      platform: this.platform,
      isContainer: this.isContainer,
      isRender: this.isRender
    });

    this.isMonitoring = true;

    // Start system metrics collection
    this.startSystemMonitoring();

    // Start network monitoring
    this.startNetworkMonitoring();

    // Platform-specific monitoring
    if (this.isRender) {
      this.startRenderMonitoring();
    }

    // Start process monitoring
    this.startProcessMonitoring();

    // Monitor container limits if applicable
    if (this.isContainer) {
      this.monitorContainerLimits();
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.logger.info('Stopping infrastructure monitoring');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    if (this.networkMonitoringInterval) {
      clearInterval(this.networkMonitoringInterval);
    }

    this.isMonitoring = false;
  }

  /**
   * System metrics monitoring
   */
  private startSystemMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
      } catch (error) {
        this.logger.error('Error collecting system metrics', error);
      }
    }, 15000); // Every 15 seconds
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      // CPU metrics
      const cpus = os.cpus();
      cpus.forEach((cpu, index) => {
        const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
        const idle = cpu.times.idle;
        const usage = ((total - idle) / total) * 100;
        systemCpuUsage.labels(`cpu${index}`).set(usage);
      });

      // Memory metrics
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      systemMemoryUsage.labels('total').set(totalMemory);
      systemMemoryUsage.labels('used').set(usedMemory);
      systemMemoryUsage.labels('free').set(freeMemory);
      systemMemoryUsage.labels('available').set(freeMemory);

      // Load average (Unix-like systems)
      if (this.platform !== 'win32') {
        const loadAvg = os.loadavg();
        systemLoadAverage.labels('1m').set(loadAvg[0]);
        systemLoadAverage.labels('5m').set(loadAvg[1]);
        systemLoadAverage.labels('15m').set(loadAvg[2]);
      }

      // Advanced system metrics using systeminformation if available
      await this.collectAdvancedSystemMetrics();

      this.logger.debug('System metrics collected', {
        memoryUsage: (usedMemory / totalMemory) * 100,
        loadAverage: os.loadavg(),
        uptime: os.uptime()
      });

    } catch (error) {
      this.logger.error('Error in system metrics collection', error);
    }
  }

  private async collectAdvancedSystemMetrics(): Promise<void> {
    try {
      const si = require('systeminformation');

      // Disk usage
      const fsSize = await si.fsSize();
      fsSize.forEach((disk: any) => {
        systemDiskUsage.labels(disk.mount, 'total').set(disk.size);
        systemDiskUsage.labels(disk.mount, 'used').set(disk.used);
        systemDiskUsage.labels(disk.mount, 'available').set(disk.available);
      });

      // Network interfaces
      const networkStats = await si.networkStats();
      networkStats.forEach((iface: any) => {
        systemNetworkIO.labels(iface.iface, 'rx').inc(iface.rx_bytes);
        systemNetworkIO.labels(iface.iface, 'tx').inc(iface.tx_bytes);
      });

      // Disk I/O
      const disksIO = await si.disksIO();
      systemDiskIO.labels('all', 'read').inc(disksIO.rIO_sec || 0);
      systemDiskIO.labels('all', 'write').inc(disksIO.wIO_sec || 0);

    } catch (error) {
      // Fallback if systeminformation is not available
      this.logger.debug('Advanced system metrics not available', error);
    }
  }

  /**
   * Process monitoring
   */
  private startProcessMonitoring(): void {
    setInterval(() => {
      try {
        // Process uptime
        processUptime.set(process.uptime());

        // Memory usage
        const memUsage = process.memoryUsage();
        Object.entries(memUsage).forEach(([key, value]) => {
          systemMemoryUsage.labels(`process_${key}`).set(value);
        });

        // File descriptors (Unix-like systems)
        if (this.platform !== 'win32') {
          try {
            const used = parseInt(require('fs').readFileSync('/proc/self/fd', 'utf8').split('\n').length.toString());
            processFileDescriptors.set(used);
          } catch (error) {
            // Ignore if not available
          }
        }

        this.logger.debug('Process metrics collected', {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        });

      } catch (error) {
        this.logger.error('Error collecting process metrics', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Network monitoring
   */
  private startNetworkMonitoring(): void {
    this.networkMonitoringInterval = setInterval(async () => {
      await this.monitorNetworkHealth();
    }, 60000); // Every minute
  }

  private async monitorNetworkHealth(): Promise<void> {
    const targets = [
      { name: 'google', url: 'https://google.com', protocol: 'https' },
      { name: 'cloudflare', url: 'https://1.1.1.1', protocol: 'https' }
    ];

    if (this.isRender) {
      targets.push({
        name: 'render-api',
        url: 'https://api.render.com',
        protocol: 'https'
      });
    }

    for (const target of targets) {
      try {
        const startTime = Date.now();
        const response = await fetch(target.url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        const latency = (Date.now() - startTime) / 1000;

        networkLatency
          .labels(target.name, target.protocol)
          .observe(latency);

        this.logger.debug('Network latency measured', {
          target: target.name,
          latency,
          status: response.status
        });

      } catch (error) {
        this.logger.warn('Network latency check failed', {
          target: target.name,
          error: error.message
        });

        this.metricsCollector.recordError(
          'network_check',
          'infrastructure',
          'medium',
          error as Error
        );
      }
    }
  }

  /**
   * Render.com specific monitoring
   */
  private startRenderMonitoring(): void {
    this.logger.info('Starting Render.com specific monitoring');

    // Monitor Render environment variables
    const renderServiceId = process.env.RENDER_SERVICE_ID;
    const renderServiceName = process.env.RENDER_SERVICE_NAME;
    const renderGitCommit = process.env.RENDER_GIT_COMMIT;

    if (renderServiceId) {
      renderDeploymentInfo
        .labels(renderServiceId, renderGitCommit || 'unknown', 'running')
        .set(1);

      this.logger.info('Render deployment info recorded', {
        serviceId: renderServiceId,
        serviceName: renderServiceName,
        commit: renderGitCommit
      });
    }

    // Monitor Render-specific metrics
    setInterval(() => {
      this.collectRenderMetrics();
    }, 30000);
  }

  private collectRenderMetrics(): void {
    try {
      const instanceId = process.env.RENDER_INSTANCE_ID || 'unknown';

      // CPU and memory from Render environment
      const memLimit = process.env.RENDER_MEMORY_LIMIT;
      const cpuLimit = process.env.RENDER_CPU_LIMIT;

      if (memLimit) {
        renderInstanceMetrics
          .labels('memory_limit', instanceId)
          .set(parseInt(memLimit) * 1024 * 1024); // Convert MB to bytes
      }

      if (cpuLimit) {
        renderInstanceMetrics
          .labels('cpu_limit', instanceId)
          .set(parseFloat(cpuLimit));
      }

      // Health check endpoint response time
      renderInstanceMetrics
        .labels('uptime', instanceId)
        .set(process.uptime());

      this.logger.debug('Render metrics collected', {
        instanceId,
        memLimit,
        cpuLimit,
        uptime: process.uptime()
      });

    } catch (error) {
      this.logger.error('Error collecting Render metrics', error);
    }
  }

  /**
   * Container limits monitoring
   */
  private monitorContainerLimits(): void {
    try {
      // Try to read container memory limit
      if (require('fs').existsSync('/sys/fs/cgroup/memory/memory.limit_in_bytes')) {
        const memLimit = parseInt(
          require('fs').readFileSync('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8')
        );
        containerMemoryLimit.set(memLimit);
      }

      // Try to read CPU limit
      if (require('fs').existsSync('/sys/fs/cgroup/cpu/cpu.cfs_quota_us')) {
        const cpuQuota = parseInt(
          require('fs').readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_quota_us', 'utf8')
        );
        const cpuPeriod = parseInt(
          require('fs').readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_period_us', 'utf8')
        );

        if (cpuQuota > 0 && cpuPeriod > 0) {
          const cpuLimit = cpuQuota / cpuPeriod;
          containerCpuLimit.set(cpuLimit);
        }
      }

      this.logger.debug('Container limits monitored');

    } catch (error) {
      this.logger.debug('Container limits not available', error);
    }
  }

  /**
   * Platform detection
   */
  private detectPlatform(): void {
    const platformInfo = {
      platform: this.platform,
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      isRender: this.isRender,
      isContainer: this.isContainer,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV
    };

    this.logger.info('Platform detected', platformInfo);

    // Record platform info as metrics
    renderInstanceMetrics
      .labels('platform_info', 'detected')
      .set(1);
  }

  /**
   * Get comprehensive infrastructure status
   */
  async getInfrastructureStatus(): Promise<any> {
    const memUsage = process.memoryUsage();
    const loadAvg = os.loadavg();

    return {
      system: {
        platform: this.platform,
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        loadAverage: loadAvg,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        },
        cpus: os.cpus().length
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: memUsage,
        nodeVersion: process.version
      },
      environment: {
        isRender: this.isRender,
        isContainer: this.isContainer,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    };
  }
}

export default InfrastructureMonitor;