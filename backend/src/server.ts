import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import evolutionRoutes from './routes/evolution';
import whatsappRoutes from './routes/whatsapp';
import whatsappV2Routes from './routes/whatsapp-v2';
import aiRoutes from './routes/ai';
import webhookRoutes from './routes/webhook';
import dashboardRoutes from './routes/dashboard';
import settingsRoutes from './routes/settings';
// import authRoutes from './routes/auth'; // Removido - usando apenas Supabase Auth
import customersRoutes from './routes/customers';
import petsRoutes from './routes/pets';
import appointmentsRoutes from './routes/appointments';
import conversationsRoutes from './routes/conversations';
import catalogRoutes from './routes/catalog';
import reportsRoutes from './routes/reports';
import monitoringRoutes from './routes/monitoring';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { authMiddleware } from './middleware/auth';
import { rateLimitAPI, rateLimitAuth, rateLimitWebhook } from './middleware/rate-limiter';
import { securityHeaders, corsConfig } from './middleware/security-headers';
import { auditLogger } from './middleware/audit-logger';
import { sanitizeInput } from './middleware/input-validator';
import { tenantIsolationMiddleware } from './middleware/tenant-isolation';

// Enhanced security and compliance features will be added in the future

// Import services
import { WebSocketService } from './services/websocket';
import { SupabaseService } from './services/supabase';
import { MonitoringService } from './services/monitoring';
import { initializeWhatsAppService } from './services/WhatsAppService';
import { logger } from './utils/logger';

// Environment variables already loaded above

class AuzapServer {
  private app: express.Application;
  private server: any;
  private io: Server;
  private wsService: WebSocketService;
  private supabaseService: SupabaseService;
  private monitoringService: MonitoringService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:8083',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.wsService = new WebSocketService(this.io);
    this.supabaseService = new SupabaseService();
    this.monitoringService = new MonitoringService();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false,  // We'll handle CSP manually
      crossOriginEmbedderPolicy: false
    }));

    // Custom security headers
    this.app.use(securityHeaders);

    // CORS with enhanced configuration
    this.app.use(cors(corsConfig));

    // Input sanitization
    this.app.use(sanitizeInput);

    // Audit logging
    this.app.use(auditLogger);

    // Advanced rate limiting
    this.app.use('/api/', rateLimitAPI);

    // Request metrics tracking
    this.app.use(this.monitoringService.requestMetricsMiddleware());

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Enhanced health check
    this.app.get('/health', async (req, res) => {
      try {
        const healthStatus = await this.monitoringService.getHealthStatus();
        const statusCode = healthStatus.status === 'healthy' ? 200 :
                          healthStatus.status === 'degraded' ? 200 : 503;

        res.status(statusCode).json(healthStatus);
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: 'Health check failed',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Readiness probe (for Kubernetes)
    this.app.get('/ready', async (req, res) => {
      try {
        const readiness = await this.monitoringService.getReadiness();
        const statusCode = readiness.status === 'ready' ? 200 : 503;
        res.status(statusCode).json(readiness);
      } catch (error) {
        res.status(503).json({
          status: 'not_ready',
          error: 'Readiness check failed',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Liveness probe (for Kubernetes)
    this.app.get('/live', (req, res) => {
      const liveness = this.monitoringService.getLiveness();
      res.status(200).json(liveness);
    });

    // Prometheus metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      try {
        const metrics = await this.monitoringService.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
      } catch (error) {
        res.status(500).send('Error collecting metrics');
      }
    });

    // API info
    this.app.get('/api', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Auzap API - Transformando Pet Care com IA 🐾',
        version: '1.0.0',
        docs: '/api/docs',
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupRoutes(): void {
    // Public routes (no auth required)
    this.app.use('/api/webhook', rateLimitWebhook, webhookRoutes);
    // this.app.use('/api/auth', rateLimitAuth, authRoutes); // Removido - usando apenas Supabase Auth
    this.app.use('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

    // Protected routes (auth + tenant isolation required)
    this.app.use('/api/evolution', authMiddleware, tenantIsolationMiddleware, evolutionRoutes);
    this.app.use('/api/whatsapp', authMiddleware, tenantIsolationMiddleware, whatsappRoutes);
    this.app.use('/api/v2/whatsapp', authMiddleware, tenantIsolationMiddleware, whatsappV2Routes);
    this.app.use('/api/ai', authMiddleware, tenantIsolationMiddleware, aiRoutes);
    this.app.use('/api/dashboard', authMiddleware, tenantIsolationMiddleware, dashboardRoutes);
    this.app.use('/api/settings', authMiddleware, tenantIsolationMiddleware, settingsRoutes);
    this.app.use('/api/customers', authMiddleware, tenantIsolationMiddleware, customersRoutes);
    this.app.use('/api/pets', authMiddleware, tenantIsolationMiddleware, petsRoutes);
    this.app.use('/api/appointments', authMiddleware, tenantIsolationMiddleware, appointmentsRoutes);
    this.app.use('/api/conversations', authMiddleware, tenantIsolationMiddleware, conversationsRoutes);
    this.app.use('/api/catalog', authMiddleware, tenantIsolationMiddleware, catalogRoutes);
    this.app.use('/api/reports', authMiddleware, tenantIsolationMiddleware, reportsRoutes);
    this.app.use('/api/monitoring', authMiddleware, tenantIsolationMiddleware, monitoringRoutes);

    // Serve static files
    this.app.use('/public', express.static('public'));
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Update active connections count
      this.monitoringService.updateActiveConnections(this.io.engine.clientsCount);

      // Join organization room
      socket.on('join_organization', (organizationId: string) => {
        socket.join(`org_${organizationId}`);
        logger.info(`Socket ${socket.id} joined organization ${organizationId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
        // Update active connections count
        this.monitoringService.updateActiveConnections(this.io.engine.clientsCount);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error: ${error}`);
        this.monitoringService.recordError('websocket', 'connection');
      });
    });

    // Store WebSocket service globally for access in routes
    this.app.set('wsService', this.wsService);
    this.app.set('monitoringService', this.monitoringService);
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFound);

    // Global error handler
    this.app.use(errorHandler);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      this.server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      this.server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  public async start(): Promise<void> {
    const port = process.env.PORT || 3001;

    try {
      // Initialize WhatsApp Service V2
      logger.info('🔄 Initializing WhatsApp Service V2...');
      await initializeWhatsAppService({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0')
        },
        queue: {
          concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '10'),
          rateLimiter: {
            max: parseInt(process.env.QUEUE_RATE_LIMIT_MAX || '100'),
            duration: parseInt(process.env.QUEUE_RATE_LIMIT_DURATION || '60000')
          }
        },
        healthCheck: {
          enabled: process.env.NODE_ENV !== 'test',
          interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000')
        }
      });
      logger.info('✅ WhatsApp Service V2 initialized successfully!');
    } catch (error) {
      logger.error('❌ Failed to initialize WhatsApp Service V2:', error);
      // Não falhar o servidor se WhatsApp Service falhar
      // O sistema pode funcionar sem ele
    }

    this.server.listen(port, () => {
      logger.info(`🚀 Auzap Backend started successfully!`);
      logger.info(`📡 Server running on port ${port}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`💝 Ready to transform pet care with AI!`);

      // Log available endpoints
      logger.info('📋 Available endpoints:');
      logger.info('   GET  /health - Health check');
      logger.info('   GET  /api - API information');
      logger.info('   POST /api/webhook/whatsapp - WhatsApp webhook');
      logger.info('   GET  /api/evolution/* - Evolution API routes');
      logger.info('   GET  /api/v2/whatsapp/* - WhatsApp V2 API routes');
      logger.info('   POST /api/ai/* - AI service routes');
      logger.info('   GET  /api/dashboard/* - Dashboard routes');
      logger.info('   PUT  /api/settings/* - Settings routes');
    });
  }
}

// Start server
const server = new AuzapServer();
server.start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default server;