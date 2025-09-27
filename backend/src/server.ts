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
import aiRoutes from './routes/ai';
import webhookRoutes from './routes/webhook';
import dashboardRoutes from './routes/dashboard';
import settingsRoutes from './routes/settings';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { authMiddleware } from './middleware/auth';

// Import services
import { WebSocketService } from './services/websocket';
import { SupabaseService } from './services/supabase';
import { logger } from './utils/logger';

// Environment variables already loaded above

class AuzapServer {
  private app: express.Application;
  private server: any;
  private io: Server;
  private wsService: WebSocketService;
  private supabaseService: SupabaseService;

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

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:8083',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
    }));

    // Rate limiting - basic implementation without external library
    const requestCounts = new Map<string, { count: number; resetTime: number }>();

    this.app.use('/api/', (req, res, next) => {
      const ip = req.ip || 'unknown';
      const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
      const max = parseInt(process.env.RATE_LIMIT_MAX || '100');
      const now = Date.now();

      const clientData = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

      if (now > clientData.resetTime) {
        clientData.count = 0;
        clientData.resetTime = now + windowMs;
      }

      clientData.count++;
      requestCounts.set(ip, clientData);

      if (clientData.count > max) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests from this IP, please try again later.',
          timestamp: new Date().toISOString()
        });
      }

      return next();
    });

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Auzap Backend is healthy! 💝',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      });
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
    this.app.use('/api/webhook', webhookRoutes);
    this.app.use('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

    // Protected routes (auth required)
    this.app.use('/api/evolution', authMiddleware, evolutionRoutes);
    this.app.use('/api/ai', authMiddleware, aiRoutes);
    this.app.use('/api/dashboard', authMiddleware, dashboardRoutes);
    this.app.use('/api/settings', authMiddleware, settingsRoutes);

    // Serve static files
    this.app.use('/public', express.static('public'));
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Join organization room
      socket.on('join_organization', (organizationId: string) => {
        socket.join(`org_${organizationId}`);
        logger.info(`Socket ${socket.id} joined organization ${organizationId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error: ${error}`);
      });
    });

    // Store WebSocket service globally for access in routes
    this.app.set('wsService', this.wsService);
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

  public start(): void {
    const port = process.env.PORT || 3001;

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
      logger.info('   POST /api/ai/* - AI service routes');
      logger.info('   GET  /api/dashboard/* - Dashboard routes');
      logger.info('   PUT  /api/settings/* - Settings routes');
    });
  }
}

// Start server
const server = new AuzapServer();
server.start();

export default server;