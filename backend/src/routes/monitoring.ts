import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { MonitoringService } from '../services/monitoring';
import { logger } from '../utils/logger';

const router = Router();

// Get monitoring service from app
const getMonitoringService = (req: Request): MonitoringService => {
  return req.app.get('monitoringService');
};

// System status overview
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const monitoringService = getMonitoringService(req);
    const status = await monitoringService.getHealthStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status'
    });
  }
});

// Detailed metrics
router.get('/metrics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const monitoringService = getMonitoringService(req);
    const metrics = await monitoringService.getMetrics();

    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Error getting metrics:', error);
    res.status(500).send('Error collecting metrics');
  }
});

// System performance data
router.get('/performance', authMiddleware, async (req: Request, res: Response) => {
  try {
    const performance = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      application: {
        environment: process.env.NODE_ENV,
        port: process.env.PORT,
        pid: process.pid
      }
    };

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Error getting performance data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance data'
    });
  }
});

// Error logs (recent)
router.get('/errors', authMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    // In a real implementation, you would fetch from a logging system
    // For now, return a simplified response
    const errors = {
      timestamp: new Date().toISOString(),
      total_errors: 0,
      recent_errors: [],
      error_rate: 0.1
    };

    res.json({
      success: true,
      data: errors
    });
  } catch (error) {
    logger.error('Error getting error logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get error logs'
    });
  }
});

// Service dependencies status
router.get('/dependencies', authMiddleware, async (req: Request, res: Response) => {
  try {
    const monitoringService = getMonitoringService(req);
    const healthStatus = await monitoringService.getHealthStatus();

    const dependencies = {
      timestamp: new Date().toISOString(),
      services: healthStatus.services || {},
      overall_status: healthStatus.status
    };

    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    logger.error('Error getting dependencies status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dependencies status'
    });
  }
});

// Application logs (recent)
router.get('/logs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const level = req.query.level as string || 'info';
    const limit = parseInt(req.query.limit as string) || 100;

    // In a real implementation, you would fetch from your logging system
    const logs = {
      timestamp: new Date().toISOString(),
      level: level,
      limit: limit,
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Monitoring system active',
          service: 'monitoring'
        }
      ]
    };

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error('Error getting logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get logs'
    });
  }
});

// Alert rules status
router.get('/alerts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const alerts = {
      timestamp: new Date().toISOString(),
      active_alerts: [],
      alert_rules: [
        {
          name: 'High Error Rate',
          condition: 'error_rate > 5%',
          status: 'active',
          severity: 'warning'
        },
        {
          name: 'Database Connectivity',
          condition: 'database_status != healthy',
          status: 'active',
          severity: 'critical'
        },
        {
          name: 'Memory Usage',
          condition: 'memory_usage > 90%',
          status: 'active',
          severity: 'warning'
        }
      ]
    };

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts'
    });
  }
});

export default router;