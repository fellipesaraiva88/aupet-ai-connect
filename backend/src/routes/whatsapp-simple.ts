import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { getEvolutionAPIService } from '../services/evolution-api';
import { WebSocketService } from '../services/websocket';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

const router = Router();

// Get user instance name (simple format: user_{userId})
const getUserInstanceName = (userId: string): string => {
  return `user_${userId}`;
};

/**
 * GET /api/whatsapp/status
 * Retorna status atual do WhatsApp do usuário
 */
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  const instanceName = getUserInstanceName(userId);
  const evolutionAPI = getEvolutionAPIService();

  try {
    const instanceStatus = await evolutionAPI.getInstanceStatus(instanceName);

    const status = {
      status: instanceStatus.instance.state === 'open' ? 'connected' :
              instanceStatus.instance.state === 'connecting' ? 'connecting' :
              instanceStatus.instance.state === 'close' ? 'disconnected' : 'disconnected',
      needsQR: instanceStatus.instance.state === 'connecting',
      phoneNumber: null,
      instanceName: instanceName,
      lastUpdate: new Date().toISOString()
    };

    const response: ApiResponse<typeof status> = {
      success: true,
      data: status,
      message: `WhatsApp ${status.status}`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.warn('Instance not found or error, returning disconnected status');

    const status = {
      status: 'disconnected' as const,
      needsQR: false,
      phoneNumber: null,
      instanceName: instanceName,
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
 * Inicia conexão WhatsApp (cria instância se necessário)
 */
router.post('/connect', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  const instanceName = getUserInstanceName(userId);
  const evolutionAPI = getEvolutionAPIService();

  try {
    // First try to get existing instance status
    try {
      const status = await evolutionAPI.getInstanceStatus(instanceName);

      // If already open, just notify user
      if (status.instance.state === 'open') {
        const result = {
          qrCode: null,
          message: 'WhatsApp já está conectado!'
        };

        const response: ApiResponse<typeof result> = {
          success: true,
          data: result,
          message: result.message,
          timestamp: new Date().toISOString()
        };

        return res.json(response);
      }
    } catch (error) {
      // Instance doesn't exist, will create below
      logger.info('Instance not found, creating new one');
    }

    // Create instance with QR code
    logger.info('Creating new instance', { instanceName });
    const createResult = await evolutionAPI.createInstance(instanceName, true);

    // Get QR code via connect endpoint
    const connectResult = await evolutionAPI.connect(instanceName);

    const qrCodeBase64 = connectResult.qrcode?.base64;

    // Notificar via WebSocket
    const wsService = req.app.get('wsService') as WebSocketService;
    if (wsService && qrCodeBase64) {
      wsService.notifyUserWhatsAppStatus(userId, organizationId, 'waiting_qr', {
        qrCode: qrCodeBase64
      });
    }

    const result = {
      qrCode: qrCodeBase64,
      message: 'QR Code gerado! Escaneie com seu WhatsApp para conectar'
    };

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

  const instanceName = getUserInstanceName(userId);
  const evolutionAPI = getEvolutionAPIService();

  try {
    const connectResult = await evolutionAPI.connect(instanceName);

    const qrData = {
      available: !!connectResult.qrcode?.base64,
      qrCode: connectResult.qrcode?.base64 || null
    };

    const response: ApiResponse<typeof qrData> = {
      success: true,
      data: qrData,
      message: qrData.available ? 'QR Code disponível' : 'QR Code não disponível',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting QR code:', error);

    const qrData = {
      available: false,
      qrCode: null
    };

    const response: ApiResponse<typeof qrData> = {
      success: true,
      data: qrData,
      message: 'QR Code não disponível',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  }
}));

/**
 * POST /api/whatsapp/disconnect
 * Desconecta WhatsApp (mas mantém instância para reconexão futura)
 */
router.post('/disconnect', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  const instanceName = getUserInstanceName(userId);
  const evolutionAPI = getEvolutionAPIService();

  try {
    await evolutionAPI.logout(instanceName);

    // Notificar via WebSocket
    const wsService = req.app.get('wsService') as WebSocketService;
    if (wsService) {
      wsService.notifyUserWhatsAppStatus(userId, organizationId, 'disconnected');

      wsService.sendNotification(organizationId, {
        title: 'WhatsApp Desconectado',
        message: 'Seu WhatsApp foi desconectado com sucesso',
        type: 'info'
      });
    }

    const result = {
      success: true,
      message: 'WhatsApp desconectado com sucesso'
    };

    const response: ApiResponse<typeof result> = {
      success: true,
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