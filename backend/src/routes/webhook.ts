import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { WebhookProcessor } from '../services/webhookProcessor';
import { WebhookHandler } from '../services/webhook-handler';
import { WebSocketService } from '../services/websocket';
import { logger } from '../utils/logger';
import {
  WebhookPayload,
  ApiResponse
} from '../types';

const router = Router();

// Initialize webhook processors
let webhookProcessor: WebhookProcessor;
let webhookHandler: WebhookHandler;

const getWebhookProcessor = (wsService?: WebSocketService) => {
  if (!webhookProcessor) {
    webhookProcessor = new WebhookProcessor(wsService);
  }
  return webhookProcessor;
};

const getWebhookHandler = () => {
  if (!webhookHandler) {
    webhookHandler = new WebhookHandler();
  }
  return webhookHandler;
};

// User-specific webhook endpoint
router.post('/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const payload = req.body;

    logger.webhook('USER_WEBHOOK_RECEIVED', payload.event || 'unknown', {
      userId,
      instance: payload.instance,
      event: payload.event,
      hasData: !!payload.data
    });

    // Get WebSocket service from app
    const wsService = req.app.get('wsService') as WebSocketService;

    // Process webhook with user context
    const handler = getWebhookHandler();
    handler.setWebSocketService(wsService);
    await handler.handleWebhookEvent(payload, userId);

    const response: ApiResponse = {
      success: true,
      message: 'User webhook processado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error processing user webhook:', error);
    // Return success to avoid webhook retry
    res.status(200).json({
      success: false,
      error: 'Internal processing error',
      timestamp: new Date().toISOString()
    });
  }
}));

// Main WhatsApp webhook endpoint
router.post('/whatsapp', asyncHandler(async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    logger.webhook('WEBHOOK_RECEIVED', payload.event || 'unknown', {
      instance: payload.instance,
      event: payload.event,
      hasData: !!payload.data
    });

    // Get WebSocket service from app
    const wsService = req.app.get('wsService') as WebSocketService;

    // Use the new comprehensive webhook handler
    const handler = getWebhookHandler();
    handler.setWebSocketService(wsService);
    await handler.handleWebhookEvent(payload);

    // Also process with legacy processor for backward compatibility
    const processor = getWebhookProcessor(wsService);
    await processor.processWebhook(payload);

    const response: ApiResponse = {
      success: true,
      message: 'Webhook processado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error processing webhook:', error);

    const response: ApiResponse = {
      success: false,
      error: 'Erro ao processar webhook',
      timestamp: new Date().toISOString()
    };

    res.status(500).json(response);
  }
}));

// Evolution API specific webhook (legacy support)
router.post('/evolution', asyncHandler(async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    logger.webhook('EVOLUTION_WEBHOOK', payload.event || 'unknown', {
      instance: payload.instance,
      event: payload.event
    });

    // Get WebSocket service from app
    const wsService = req.app.get('wsService') as WebSocketService;

    // Use both processors
    const handler = getWebhookHandler();
    handler.setWebSocketService(wsService);
    await handler.handleWebhookEvent(payload);

    const processor = getWebhookProcessor(wsService);
    await processor.processWebhook(payload);

    res.status(200).json({ success: true });

  } catch (error) {
    logger.error('Error processing Evolution webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}));

// Health check endpoint
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Webhook service is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    timestamp: new Date().toISOString()
  };

  res.json(response);
}));

// Test endpoint for development
router.post('/test', asyncHandler(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      error: 'Test endpoint not available in production',
      timestamp: new Date().toISOString()
    });
  }

  logger.info('Test webhook called', req.body);

  const response: ApiResponse = {
    success: true,
    message: 'Test webhook received',
    data: req.body,
    timestamp: new Date().toISOString()
  };

  return res.json(response);
}));

export default router;