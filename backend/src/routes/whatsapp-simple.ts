import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { WhatsAppManager } from '../services/whatsapp-manager';
import { WebSocketService } from '../services/websocket';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

const router = Router();

// Lazy initialize service
let whatsappManager: WhatsAppManager;

const getWhatsAppManager = () => {
  if (!whatsappManager) {
    whatsappManager = new WhatsAppManager();
  }
  return whatsappManager;
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

  try {
    logger.info('Getting WhatsApp status for user', { userId });

    // Garantir que o usuário tenha uma instância antes de verificar status
    const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
    const instance = await getWhatsAppManager().ensureUserInstance(userId, organizationId);
    logger.info('Instance ensured for status check', { userId, instanceName: instance.name });

    const status = await getWhatsAppManager().getUserWhatsAppStatus(userId);

    const response: ApiResponse<typeof status> = {
      success: true,
      data: status,
      message: `WhatsApp ${status.status}`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting WhatsApp status:', error);
    throw createError(error.message || 'Erro ao obter status do WhatsApp', 500);
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

  try {
    logger.info('Starting WhatsApp connection process', { userId, organizationId });

    // 1. Garantir que o usuário tenha uma instância (cria se não existir)
    const instance = await getWhatsAppManager().ensureUserInstance(userId, organizationId);
    logger.info('Instance ensured for user', { userId, instanceName: instance.name });

    // 2. Conectar na instância (existente ou recém-criada)
    const result = await getWhatsAppManager().connectUserWhatsApp(userId, organizationId);
    logger.info('Connection initiated', { userId, hasQRCode: !!result.qrCode });

    // 3. Notificar via WebSocket sobre o início da conexão
    const wsService = req.app.get('wsService') as WebSocketService;
    if (wsService) {
      wsService.notifyUserWhatsAppStatus(userId, organizationId, 'connecting', {
        qrCode: result.qrCode,
        instanceName: instance.name
      });
      logger.info('WebSocket notification sent', { userId, status: 'connecting' });
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

  try {
    logger.info('Getting QR code for user', { userId });

    // Garantir que o usuário tenha uma instância antes de buscar QR code
    const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
    const instance = await getWhatsAppManager().ensureUserInstance(userId, organizationId);
    logger.info('Instance ensured for QR code fetch', { userId, instanceName: instance.name });

    const qrData = await getWhatsAppManager().getUserQRCode(userId);

    const response: ApiResponse<typeof qrData> = {
      success: true,
      data: qrData,
      message: qrData.available ? 'QR Code disponível' : 'QR Code não disponível',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting QR code:', error);
    throw createError(error.message || 'Erro ao obter QR Code', 500);
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

  try {
    const result = await getWhatsAppManager().disconnectUserWhatsApp(userId);

    // Notificar via WebSocket
    const wsService = req.app.get('wsService') as WebSocketService;
    if (wsService && result.success) {
      wsService.notifyUserWhatsAppStatus(userId, organizationId, 'disconnected');

      wsService.sendNotification(organizationId, {
        title: 'WhatsApp Desconectado',
        message: 'Seu WhatsApp foi desconectado com sucesso',
        type: 'info'
      });
    }

    const response: ApiResponse<typeof result> = {
      success: result.success,
      data: result,
      message: result.message,
      timestamp: new Date().toISOString()
    };

    if (result.success) {
      res.json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error: any) {
    logger.error('Error disconnecting WhatsApp:', error);
    throw createError(error.message || 'Erro ao desconectar WhatsApp', 500);
  }
}));

/**
 * GET /api/whatsapp/info
 * Retorna informações detalhadas da instância (para debug/admin)
 */
router.get('/info', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  try {
    const instance = await getWhatsAppManager().findUserInstance(userId);
    const status = await getWhatsAppManager().getUserWhatsAppStatus(userId);

    const info = {
      hasInstance: !!instance,
      instance: instance ? {
        id: instance.id,
        name: instance.name,
        status: instance.status,
        created: instance.created_at
      } : null,
      currentStatus: status,
      userId: userId
    };

    const response: ApiResponse<typeof info> = {
      success: true,
      data: info,
      message: 'Informações da instância WhatsApp',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting WhatsApp info:', error);
    throw createError(error.message || 'Erro ao obter informações', 500);
  }
}));

/**
 * POST /api/whatsapp/migrate (Admin only - for migrating old instances)
 * Migra instâncias antigas para o novo formato
 */
router.post('/migrate', asyncHandler(async (req: Request, res: Response) => {
  // Verificar se é admin/desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    throw createError('Endpoint disponível apenas em desenvolvimento', 403);
  }

  try {
    const result = await getWhatsAppManager().migrateOldInstances();

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: `Migração concluída: ${result.migrated} instâncias migradas, ${result.errors} erros`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error during migration:', error);
    throw createError(error.message || 'Erro durante migração', 500);
  }
}));

/**
 * POST /api/whatsapp/refresh
 * Força atualização do status da instância
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  try {
    // Busca status atualizado
    const status = await getWhatsAppManager().getUserWhatsAppStatus(userId);

    // Notifica via WebSocket
    const wsService = req.app.get('wsService') as WebSocketService;
    if (wsService) {
      wsService.notifyUserWhatsAppStatus(userId, organizationId, status.status, {
        phoneNumber: status.phoneNumber
      });
    }

    const response: ApiResponse<typeof status> = {
      success: true,
      data: status,
      message: 'Status atualizado',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error refreshing status:', error);
    throw createError(error.message || 'Erro ao atualizar status', 500);
  }
}));

export default router;