import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { WhatsAppManager } from '../services/whatsapp-manager';
import { WebSocketService } from '../services/websocket';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /api/whatsapp/status
 * Retorna status atual do WhatsApp do usuário
 */
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const organizationId = req.user?.organizationId || req.headers['x-organization-id'] as string;

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  logger.info('Getting WhatsApp status', { userId, organizationId });

  const whatsappManager = new WhatsAppManager();

  try {
    const status = await whatsappManager.getUserWhatsAppStatus(userId);

    const response: ApiResponse<typeof status> = {
      success: true,
      data: status,
      message: `WhatsApp ${status.status}`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting WhatsApp status:', error);

    // Return disconnected status on error
    const status = {
      status: 'disconnected' as const,
      needsQR: false,
      lastUpdate: new Date().toISOString()
    };

    const response: ApiResponse<typeof status> = {
      success: true,
      data: status,
      message: 'WhatsApp desconectado',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  }
}));

/**
 * POST /api/whatsapp/connect
 * Inicia conexão WhatsApp (cria instância automaticamente se necessário)
 */
router.post('/connect', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const organizationId = req.user?.organizationId || req.headers['x-organization-id'] as string;

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  if (!organizationId) {
    throw createError('Organization ID não encontrado', 400);
  }

  logger.info('Connecting WhatsApp', { userId, organizationId });

  const whatsappManager = new WhatsAppManager();

  try {
    const result = await whatsappManager.connectUserWhatsApp(userId, organizationId);

    // Notificar via WebSocket se QR code foi gerado
    if (result.qrCode) {
      const wsService = req.app.get('wsService') as WebSocketService;
      if (wsService) {
        wsService.notifyUserWhatsAppStatus(userId, organizationId, 'waiting_qr', {
          qrCode: result.qrCode
        });
      }
    }

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: result.message,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error connecting WhatsApp:', error);
    throw createError(error.message || 'Erro ao conectar WhatsApp', 500);
  }
}));

/**
 * GET /api/whatsapp/qrcode
 * Obtém QR Code atual se disponível
 */
router.get('/qrcode', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  logger.info('Getting QR code', { userId });

  const whatsappManager = new WhatsAppManager();

  try {
    const result = await whatsappManager.getUserQRCode(userId);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: result.available ? 'QR Code disponível' : 'QR Code não disponível',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting QR code:', error);

    const result = {
      available: false,
      qrCode: undefined
    };

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'QR Code não disponível',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  }
}));

/**
 * POST /api/whatsapp/disconnect
 * Desconecta WhatsApp do usuário
 */
router.post('/disconnect', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const organizationId = req.user?.organizationId || req.headers['x-organization-id'] as string;

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  logger.info('Disconnecting WhatsApp', { userId, organizationId });

  const whatsappManager = new WhatsAppManager();

  try {
    const result = await whatsappManager.disconnectUserWhatsApp(userId);

    // Notificar via WebSocket
    if (result.success && organizationId) {
      const wsService = req.app.get('wsService') as WebSocketService;
      if (wsService) {
        wsService.notifyUserWhatsAppStatus(userId, organizationId, 'disconnected');

        wsService.sendNotification(organizationId, {
          title: 'WhatsApp Desconectado',
          message: 'Seu WhatsApp foi desconectado com sucesso',
          type: 'info'
        });
      }
    }

    const response: ApiResponse<typeof result> = {
      success: result.success,
      data: result,
      message: result.message,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error disconnecting WhatsApp:', error);
    throw createError(error.message || 'Erro ao desconectar WhatsApp', 500);
  }
}));

export default router;
