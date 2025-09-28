import { Router, Request, Response } from 'express';
import { getWhatsAppService } from '../services/WhatsAppService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const connectSchema = z.object({
  instanceId: z.string().min(1),
  businessId: z.string().uuid()
});

const sendMessageSchema = z.object({
  instanceId: z.string().min(1),
  to: z.string().min(10),
  text: z.string().min(1).optional(),
  mediaUrl: z.string().url().optional(),
  caption: z.string().optional()
}).refine(data => data.text || data.mediaUrl, {
  message: "Either text or mediaUrl must be provided"
});

const sendButtonsSchema = z.object({
  instanceId: z.string().min(1),
  to: z.string().min(10),
  text: z.string().min(1),
  buttons: z.array(z.object({
    id: z.string(),
    title: z.string()
  })).min(1).max(3)
});

const scheduleMessageSchema = z.object({
  instanceId: z.string().min(1),
  to: z.string().min(10),
  text: z.string().min(1),
  sendAt: z.string().datetime()
});

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: Function) => Promise<any>) =>
  (req: Request, res: Response, next: Function) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// === CONNECTION ENDPOINTS ===

/**
 * POST /api/v2/whatsapp/connect
 * Conecta uma instância WhatsApp
 */
router.post('/connect', asyncHandler(async (req: Request, res: Response) => {
  const validation = connectSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: validation.error.errors
    });
  }

  const { instanceId, businessId } = validation.data;

  try {
    logger.info(`Connecting WhatsApp instance via API: ${instanceId}`);

    const whatsappService = getWhatsAppService();
    const result = await whatsappService.connect(instanceId, businessId);

    if ('qrCode' in result) {
      res.json({
        success: true,
        action: 'scan_qr',
        qrCode: result.qrCode,
        qrCodeUrl: result.url
      });
    } else {
      res.json({
        success: true,
        action: 'already_connected',
        status: result
      });
    }
  } catch (error: any) {
    logger.error(`Failed to connect instance ${instanceId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * POST /api/v2/whatsapp/disconnect
 * Desconecta uma instância WhatsApp
 */
router.post('/disconnect', asyncHandler(async (req: Request, res: Response) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      error: 'instanceId is required'
    });
  }

  try {
    const whatsappService = getWhatsAppService();
    await whatsappService.disconnect(instanceId);

    res.json({
      success: true,
      message: 'Instance disconnected successfully'
    });
  } catch (error: any) {
    logger.error(`Failed to disconnect instance ${instanceId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * GET /api/v2/whatsapp/status/:instanceId
 * Obtém status de uma instância
 */
router.get('/status/:instanceId', asyncHandler(async (req: Request, res: Response) => {
  const { instanceId } = req.params;

  try {
    const whatsappService = getWhatsAppService();
    const status = await whatsappService.getConnectionStatus(instanceId);

    if (!status) {
      return res.status(404).json({
        error: 'Instance not found'
      });
    }

    res.json({
      success: true,
      status
    });
  } catch (error: any) {
    logger.error(`Failed to get status for instance ${instanceId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * GET /api/v2/whatsapp/qr/:instanceId
 * Obtém QR Code de uma instância
 */
router.get('/qr/:instanceId', asyncHandler(async (req: Request, res: Response) => {
  const { instanceId } = req.params;

  try {
    const whatsappService = getWhatsAppService();
    const qrData = await whatsappService.getQRCode(instanceId);

    if (!qrData) {
      return res.status(404).json({
        error: 'QR Code not available'
      });
    }

    res.json({
      success: true,
      qrCode: qrData.qrCode,
      qrCodeUrl: qrData.url
    });
  } catch (error: any) {
    logger.error(`Failed to get QR code for instance ${instanceId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * POST /api/v2/whatsapp/restart
 * Reinicia uma instância
 */
router.post('/restart', asyncHandler(async (req: Request, res: Response) => {
  const { instanceId } = req.body;

  if (!instanceId) {
    return res.status(400).json({
      error: 'instanceId is required'
    });
  }

  try {
    const whatsappService = getWhatsAppService();
    await whatsappService.restart(instanceId);

    res.json({
      success: true,
      message: 'Instance restarted successfully'
    });
  } catch (error: any) {
    logger.error(`Failed to restart instance ${instanceId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// === MESSAGING ENDPOINTS ===

/**
 * POST /api/v2/whatsapp/send/text
 * Envia mensagem de texto
 */
router.post('/send/text', asyncHandler(async (req: Request, res: Response) => {
  const validation = sendMessageSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: validation.error.errors
    });
  }

  const { instanceId, to, text } = validation.data;

  if (!text) {
    return res.status(400).json({
      error: 'text is required for text messages'
    });
  }

  try {
    const whatsappService = getWhatsAppService();
    const result = await whatsappService.sendText(instanceId, to, text);

    res.json({
      success: true,
      messageId: result.id,
      status: result.status,
      timestamp: result.timestamp
    });
  } catch (error: any) {
    logger.error(`Failed to send text message:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * POST /api/v2/whatsapp/send/media
 * Envia mensagem com mídia
 */
router.post('/send/media', asyncHandler(async (req: Request, res: Response) => {
  const validation = sendMessageSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: validation.error.errors
    });
  }

  const { instanceId, to, mediaUrl, caption } = validation.data;

  if (!mediaUrl) {
    return res.status(400).json({
      error: 'mediaUrl is required for media messages'
    });
  }

  try {
    const whatsappService = getWhatsAppService();
    const result = await whatsappService.sendMedia(instanceId, to, mediaUrl, caption);

    res.json({
      success: true,
      messageId: result.id,
      status: result.status,
      timestamp: result.timestamp
    });
  } catch (error: any) {
    logger.error(`Failed to send media message:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * POST /api/v2/whatsapp/send/buttons
 * Envia mensagem com botões
 */
router.post('/send/buttons', asyncHandler(async (req: Request, res: Response) => {
  const validation = sendButtonsSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: validation.error.errors
    });
  }

  const { instanceId, to, text, buttons } = validation.data;

  try {
    const whatsappService = getWhatsAppService();
    const result = await whatsappService.sendButtons(instanceId, to, text, buttons as Array<{id: string, title: string}>);

    res.json({
      success: true,
      messageId: result.id,
      status: result.status,
      timestamp: result.timestamp
    });
  } catch (error: any) {
    logger.error(`Failed to send buttons message:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * POST /api/v2/whatsapp/schedule
 * Agenda mensagem para envio futuro
 */
router.post('/schedule', asyncHandler(async (req: Request, res: Response) => {
  const validation = scheduleMessageSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: validation.error.errors
    });
  }

  const { instanceId, to, text, sendAt } = validation.data;

  try {
    const whatsappService = getWhatsAppService();
    const jobId = await whatsappService.scheduleMessage(instanceId, to, text, new Date(sendAt));

    res.json({
      success: true,
      jobId,
      scheduledFor: sendAt,
      message: 'Message scheduled successfully'
    });
  } catch (error: any) {
    logger.error(`Failed to schedule message:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// === MANAGEMENT ENDPOINTS ===

/**
 * GET /api/v2/whatsapp/instances
 * Lista todas as instâncias
 */
router.get('/instances', asyncHandler(async (req: Request, res: Response) => {
  try {
    const whatsappService = getWhatsAppService();
    const instances = await whatsappService.listInstances();

    res.json({
      success: true,
      instances
    });
  } catch (error: any) {
    logger.error(`Failed to list instances:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * GET /api/v2/whatsapp/instance/:instanceId
 * Obtém informações de uma instância
 */
router.get('/instance/:instanceId', asyncHandler(async (req: Request, res: Response) => {
  const { instanceId } = req.params;

  try {
    const whatsappService = getWhatsAppService();
    const instance = await whatsappService.getInstanceInfo(instanceId);

    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found'
      });
    }

    res.json({
      success: true,
      instance
    });
  } catch (error: any) {
    logger.error(`Failed to get instance info:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// === HEALTH & MONITORING ===

/**
 * GET /api/v2/whatsapp/health
 * Obtém status de saúde do sistema
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  try {
    const whatsappService = getWhatsAppService();
    const health = await whatsappService.getHealthStatus();

    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 207 : 503;

    res.status(statusCode).json(health);
  } catch (error: any) {
    logger.error(`Failed to get health status:`, error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    });
  }
}));

/**
 * GET /api/v2/whatsapp/metrics
 * Obtém métricas do sistema
 */
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  try {
    const whatsappService = getWhatsAppService();
    const metrics = await whatsappService.getMetrics();

    res.json({
      success: true,
      metrics
    });
  } catch (error: any) {
    logger.error(`Failed to get metrics:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * POST /api/v2/whatsapp/recovery
 * Força tentativa de recuperação
 */
router.post('/recovery', asyncHandler(async (req: Request, res: Response) => {
  try {
    const whatsappService = getWhatsAppService();
    await whatsappService.forceRecovery();

    res.json({
      success: true,
      message: 'Recovery attempt completed'
    });
  } catch (error: any) {
    logger.error(`Failed to perform recovery:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// === QUEUE MANAGEMENT ===

/**
 * POST /api/v2/whatsapp/queue/pause
 * Pausa processamento de mensagens
 */
router.post('/queue/pause', asyncHandler(async (req: Request, res: Response) => {
  try {
    const whatsappService = getWhatsAppService();
    await whatsappService.pauseMessageProcessing();

    res.json({
      success: true,
      message: 'Message processing paused'
    });
  } catch (error: any) {
    logger.error(`Failed to pause message processing:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * POST /api/v2/whatsapp/queue/resume
 * Resume processamento de mensagens
 */
router.post('/queue/resume', asyncHandler(async (req: Request, res: Response) => {
  try {
    const whatsappService = getWhatsAppService();
    await whatsappService.resumeMessageProcessing();

    res.json({
      success: true,
      message: 'Message processing resumed'
    });
  } catch (error: any) {
    logger.error(`Failed to resume message processing:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

/**
 * POST /api/v2/whatsapp/queue/retry
 * Reprocessa mensagens falhadas
 */
router.post('/queue/retry', asyncHandler(async (req: Request, res: Response) => {
  try {
    const whatsappService = getWhatsAppService();
    const result = await whatsappService.retryFailedMessages();

    res.json({
      success: true,
      retriedMessages: result,
      message: 'Failed messages retry completed'
    });
  } catch (error: any) {
    logger.error(`Failed to retry failed messages:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

export default router;