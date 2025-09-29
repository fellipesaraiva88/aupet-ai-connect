import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { WebSocketService } from '../services/websocket';
import { SupabaseService } from '../services/supabase';
import { logger } from '../utils/logger';

const router = Router();

// Lazy initialize services
let supabaseService: SupabaseService;

const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
};

/**
 * POST /api/webhook/user/:userId
 * Webhook específico para receber eventos da Evolution API de um usuário
 */
router.post('/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const webhookData = req.body;

  logger.info('User webhook received:', {
    userId,
    event: webhookData.event,
    instance: webhookData.instance
  });

  try {
    const wsService = req.app.get('wsService') as WebSocketService;

    // Processar diferentes tipos de eventos
    switch (webhookData.event) {
      case 'CONNECTION_UPDATE':
        await handleConnectionUpdate(userId, webhookData, wsService);
        break;

      case 'QRCODE_UPDATED':
        await handleQRCodeUpdate(userId, webhookData, wsService);
        break;

      case 'MESSAGES_UPSERT':
        await handleNewMessage(userId, webhookData, wsService);
        break;

      case 'MESSAGES_UPDATE':
        await handleMessageUpdate(userId, webhookData, wsService);
        break;

      default:
        logger.info('Unhandled webhook event:', webhookData.event);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error processing user webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}));

/**
 * Manipula atualizações de conexão
 */
async function handleConnectionUpdate(
  userId: string,
  webhookData: any,
  wsService: WebSocketService
) {
  const { instance, data } = webhookData;
  const connectionState = data?.state || data?.connectionState || 'unknown';

  logger.info('Connection update for user:', {
    userId,
    instance,
    state: connectionState
  });

  // Mapear estados da Evolution para estados simplificados
  const statusMap: Record<string, string> = {
    'open': 'connected',
    'connecting': 'connecting',
    'closed': 'disconnected',
    'qr': 'waiting_qr'
  };

  const simplifiedStatus = statusMap[connectionState] || 'disconnected';

  // Atualizar status no banco
  try {
    await getSupabaseService().updateInstanceStatus(
      `user_${userId}`,
      simplifiedStatus,
      connectionState
    );
  } catch (error) {
    logger.error('Error updating instance status:', error);
  }

  // Notificar via WebSocket
  if (wsService) {
    wsService.notifyUserWhatsAppStatus(userId, 'default', simplifiedStatus, {
      phoneNumber: data?.phoneNumber,
      connectionState
    });

    // Se conectou com sucesso, enviar notificação especial
    if (simplifiedStatus === 'connected') {
      wsService.sendNotification('default', {
        title: 'WhatsApp Conectado! 🎉',
        message: 'Seu WhatsApp está conectado e pronto para receber mensagens',
        type: 'success'
      });
    }
  }
}

/**
 * Manipula atualizações de QR Code
 */
async function handleQRCodeUpdate(
  userId: string,
  webhookData: any,
  wsService: WebSocketService
) {
  const { data } = webhookData;
  const qrCode = data?.qrcode || data?.qr;

  logger.info('QR Code update for user:', {
    userId,
    hasQRCode: !!qrCode
  });

  // Notificar via WebSocket com novo QR Code
  if (wsService && qrCode) {
    wsService.notifyUserWhatsAppStatus(userId, 'default', 'waiting_qr', {
      qrCode
    });
  }
}

/**
 * Manipula novas mensagens
 */
async function handleNewMessage(
  userId: string,
  webhookData: any,
  wsService: WebSocketService
) {
  const { data } = webhookData;

  logger.info('New message for user:', {
    userId,
    messageCount: data?.messages?.length || 0
  });

  // Aqui seria processado as mensagens
  // Por enquanto apenas log
  if (data?.messages) {
    data.messages.forEach((message: any) => {
      logger.info('Message received:', {
        userId,
        messageId: message.key?.id,
        from: message.key?.remoteJid,
        messageType: message.messageType
      });
    });
  }
}

/**
 * Manipula atualizações de mensagens
 */
async function handleMessageUpdate(
  userId: string,
  webhookData: any,
  wsService: WebSocketService
) {
  const { data } = webhookData;

  logger.info('Message update for user:', {
    userId,
    updateCount: data?.messages?.length || 0
  });

  // Processar atualizações de status de mensagem (enviado, entregue, lido)
  if (data?.messages) {
    data.messages.forEach((message: any) => {
      logger.info('Message status update:', {
        userId,
        messageId: message.key?.id,
        status: message.status
      });
    });
  }
}

export default router;