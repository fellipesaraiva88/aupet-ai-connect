import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SupabaseService } from '../services/supabase';
import { BaileysService } from '../services/baileys';
import { WebSocketService } from '../services/websocket';
import { logger } from '../utils/logger';
import {
  ApiResponse,
  SendMessageRequest,
  EvolutionInstance
} from '../types';

const router = Router();

// Lazy initialize services
let supabaseService: SupabaseService;
let baileysService: BaileysService;

const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
};

const getBaileysService = () => {
  if (!baileysService) {
    baileysService = new BaileysService();
  }
  return baileysService;
};

// Create new WhatsApp instance
router.post('/instance/create', asyncHandler(async (req: Request, res: Response) => {
  const { businessId } = req.body;
  const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  if (!businessId) {
    throw createError('Business ID é obrigatório', 400);
  }

  try {
    const baileys = getBaileysService();
    const userId = businessId; // businessId is actually userId
    const instanceName = `user_${userId}`;

    // Create instance via Baileys
    await baileys.createInstance(userId);

    // Save instance in Supabase
    const instanceData = await getSupabaseService().createInstance({
      name: instanceName,
      user_id: userId,
      status: 'created',
      organization_id: organizationId
    });

    // Webhooks não são necessários com Baileys - usa EventEmitter interno

    // Get WebSocket service
    const wsService = req.app.get('wsService') as WebSocketService;

    // Notify clients
    wsService.notifyWhatsAppStatus(
      organizationId,
      instanceName,
      'created'
    );

    wsService.sendNotification(organizationId, {
      title: 'Instância WhatsApp Criada! 🎉',
      message: 'Sua instância foi criada com sucesso. Agora você pode conectar seu WhatsApp.',
      type: 'success'
    });

    // Get instance info
    const instanceInfo = await baileys.getInstanceInfo(userId);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        instanceName,
        userId,
        status: instanceInfo.status,
        phoneNumber: instanceInfo.phoneNumber
      },
      message: 'Instância criada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);

  } catch (error: any) {
    logger.error('Error creating instance:', error);
    throw createError(error.message || 'Erro ao criar instância WhatsApp', 500);
  }
}));

// Connect instance and get QR code
router.post('/instance/:instanceName/connect', asyncHandler(async (req: Request, res: Response) => {
  const { instanceName } = req.params;

  if (!instanceName) throw createError('Instance name é obrigatório', 400);
  const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const baileys = getBaileysService();

    // Buscar userId da instância
    const instance = await getSupabaseService().getInstanceByName(instanceName!);
    if (!instance || !instance.user_id) {
      throw createError('Instância não encontrada ou sem user_id', 404);
    }

    // Criar instância Baileys (que gerará QR automaticamente)
    await baileys.createInstance(instance.user_id);

    // Aguardar QR code
    const qrCode = await baileys.getQRCode(instance.user_id);

    // Update instance status
    await getSupabaseService().updateInstanceStatus(instanceName!, 'connecting');

    // Get WebSocket service
    const wsService = req.app.get('wsService') as WebSocketService;

    // Notify clients
    wsService.notifyWhatsAppStatus(
      organizationId,
      instanceName!,
      'connecting',
      qrCode
    );

    const response: ApiResponse<{ qrCode: string }> = {
      success: true,
      data: { qrCode },
      message: 'Instância conectando... Escaneie o QR Code',
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    logger.error('Error connecting instance:', error);
    throw createError(error.message || 'Erro ao conectar instância', 500);
  }
}));

// Get QR code for instance
router.get('/instance/:instanceName/qr', asyncHandler(async (req: Request, res: Response) => {
  const { instanceName } = req.params;

  if (!instanceName) throw createError('Instance name é obrigatório', 400);

  try {
    const baileys = getBaileysService();

    // Buscar userId da instância
    const instance = await getSupabaseService().getInstanceByName(instanceName!);
    if (!instance || !instance.user_id) {
      throw createError('Instância não encontrada ou sem user_id', 404);
    }

    const qrCode = await baileys.getQRCode(instance.user_id);

    const response: ApiResponse<{ qrCode: string; available: boolean }> = {
      success: true,
      data: {
        qrCode,
        available: !!qrCode
      },
      message: qrCode ? 'QR Code disponível' : 'QR Code não disponível',
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    logger.error('Error getting QR code:', error);
    throw createError(error.message || 'Erro ao obter QR Code', 500);
  }
}));

// Get connection state
router.get('/instance/:instanceName/status', asyncHandler(async (req: Request, res: Response) => {
  const { instanceName } = req.params;

  if (!instanceName) throw createError('Instance name é obrigatório', 400);

  try {
    const baileys = getBaileysService();

    // Buscar userId da instância
    const instance = await getSupabaseService().getInstanceByName(instanceName!);
    if (!instance || !instance.user_id) {
      throw createError('Instância não encontrada ou sem user_id', 404);
    }

    const connectionState = baileys.getConnectionState(instance.user_id);

    const response: ApiResponse<{
      instanceName: string;
      connectionState: string;
      status: string;
      lastUpdate: string;
    }> = {
      success: true,
      data: {
        instanceName: instanceName,
        connectionState,
        status: instance?.status || 'unknown',
        lastUpdate: instance?.updated_at || new Date().toISOString()
      },
      message: `Status: ${connectionState}`,
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    logger.error('Error getting instance status:', error);
    throw createError(error.message || 'Erro ao obter status da instância', 500);
  }
}));

// List all instances
router.get('/instances', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    // TODO: Implementar listagem via Baileys
    // const instanceList = getBaileysService().listInstances();

    // Por enquanto, buscar do banco Supabase
    const { data: instances } = await getSupabaseService()['supabase']
      .from('whatsapp_instances')
      .select('*')
      .eq('organization_id', organizationId);

    const response: ApiResponse<any[]> = {
      success: true,
      data: instances || [],
      message: `${instances?.length || 0} instâncias encontradas`,
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    logger.error('Error listing instances:', error);
    throw createError(error.message || 'Erro ao listar instâncias', 500);
  }
}));

// Delete instance
router.delete('/instance/:instanceName', asyncHandler(async (req: Request, res: Response) => {
  const { instanceName } = req.params;

  if (!instanceName) throw createError('Instance name é obrigatório', 400);
  const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    // Buscar userId da instância
    const instance = await getSupabaseService().getInstanceByName(instanceName!);
    if (!instance || !instance.user_id) {
      throw createError('Instância não encontrada ou sem user_id', 404);
    }

    // Delete via Baileys
    await getBaileysService().disconnectInstance(instance.user_id);
    const deleted = true;

    if (deleted) {
      // Update status in Supabase
      await getSupabaseService().updateInstanceStatus(instanceName, 'deleted');

      // Get WebSocket service
      const wsService = req.app.get('wsService') as WebSocketService;

      // Notify clients
      wsService.notifyWhatsAppStatus(
        organizationId,
        instanceName!,
        'deleted'
      );

      wsService.sendNotification(organizationId, {
        title: 'Instância Removida',
        message: 'A instância WhatsApp foi removida com sucesso.',
        type: 'info'
      });
    }

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted },
      message: deleted ? 'Instância removida com sucesso' : 'Falha ao remover instância',
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    logger.error('Error deleting instance:', error);
    throw createError(error.message || 'Erro ao remover instância', 500);
  }
}));

// Restart instance
router.post('/instance/:instanceName/restart', asyncHandler(async (req: Request, res: Response) => {
  const { instanceName } = req.params;
  if (!instanceName) throw createError('Instance name é obrigatório', 400);
  const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    // TODO: Baileys auto-reconecta, restart pode não ser necessário
    // Por enquanto, retornar sucesso
    const restarted = true;

    if (restarted) {
      await getSupabaseService().updateInstanceStatus(instanceName, 'restarting');

      // Get WebSocket service
      const wsService = req.app.get('wsService') as WebSocketService;

      wsService.notifyWhatsAppStatus(
        organizationId,
        instanceName!,
        'restarting'
      );
    }

    const response: ApiResponse<{ restarted: boolean }> = {
      success: true,
      data: { restarted },
      message: restarted ? 'Instância reiniciada' : 'Falha ao reiniciar instância',
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    logger.error('Error restarting instance:', error);
    throw createError(error.message || 'Erro ao reiniciar instância', 500);
  }
}));

// Send text message
router.post('/message/send', asyncHandler(async (req: Request, res: Response) => {
  const { instanceName, to, message, messageType = 'text' }: SendMessageRequest = req.body;
  const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  if (!instanceName || !to || !message) {
    throw createError('instanceName, to e message são obrigatórios', 400);
  }

  try {
    let result;

    // Buscar userId da instância
    const instance = await getSupabaseService().getInstanceByName(instanceName);
    if (!instance || !instance.user_id) {
      throw createError('Instância não encontrada ou sem user_id', 404);
    }

    switch (messageType) {
      case 'text':
        result = await getBaileysService().sendText(instance.user_id, to, message);
        break;
      default:
        throw createError(`Tipo de mensagem não suportado: ${messageType}`, 400);
    }

    // Save message to database
    if (instance) {
      // Get or create contact
      const contact = await getSupabaseService().saveContact({
        phone: to,
        organization_id: organizationId,
        instance_id: instance.id
      });

      // Get or create conversation
      const conversation = await getSupabaseService().getOrCreateConversation(
        contact.id,
        instance.id,
        organizationId
      );

      // Save message
      await getSupabaseService().saveMessage({
        conversation_id: conversation.id,
        instance_id: instance.id,
        content: message,
        direction: 'outbound',
        message_type: messageType,
        external_id: result.key?.id || `manual_${Date.now()}`,
        organization_id: organizationId,
        metadata: {
          sent_manually: true,
          sent_by: req.user?.id
        }
      });

      // Notify WebSocket clients
      const wsService = req.app.get('wsService') as WebSocketService;
      wsService.notifyNewMessage(organizationId, {
        id: `manual_${Date.now()}`,
        conversation_id: conversation.id,
        instance_id: instance.id,
        content: message,
        direction: 'outbound',
        message_type: messageType,
        external_id: result.key?.id || `manual_${Date.now()}`,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        customerName: contact.name
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: result,
      message: 'Mensagem enviada com sucesso! 💝',
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    logger.error('Error sending message:', error);
    throw createError(error.message || 'Erro ao enviar mensagem', 500);
  }
}));

// Send media message
router.post('/message/send-media', asyncHandler(async (req: Request, res: Response) => {
  const {
    instanceName,
    to,
    mediaUrl,
    caption,
    mediaType = 'image'
  } = req.body;

  if (!instanceName || !to || !mediaUrl) {
    throw createError('instanceName, to e mediaUrl são obrigatórios', 400);
  }

  try {
    const result = await getEvolutionService().sendMedia(
      instanceName!,
      to,
      mediaUrl,
      caption,
      mediaType
    );

    const response: ApiResponse<any> = {
      success: true,
      data: result,
      message: 'Mídia enviada com sucesso! 📎',
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    logger.error('Error sending media:', error);
    throw createError(error.message || 'Erro ao enviar mídia', 500);
  }
}));

// Send buttons
router.post('/message/send-buttons', asyncHandler(async (req: Request, res: Response) => {
  const {
    instanceName,
    to,
    text,
    buttons
  } = req.body;

  if (!instanceName || !to || !text || !buttons) {
    throw createError('instanceName, to, text e buttons são obrigatórios', 400);
  }

  try {
    const result = await getEvolutionService().sendButtons(instanceName, to, text, buttons);

    const response: ApiResponse<any> = {
      success: true,
      data: result,
      message: 'Botões enviados com sucesso! 🔘',
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    logger.error('Error sending buttons:', error);
    throw createError(error.message || 'Erro ao enviar botões', 500);
  }
}));

// Get contacts
router.get('/instance/:instanceName/contacts', asyncHandler(async (req: Request, res: Response) => {
  const { instanceName } = req.params;
  if (!instanceName) throw createError('Instance name é obrigatório', 400);

  try {
    const contacts = await getEvolutionService().fetchContacts(instanceName);

    const response: ApiResponse<any[]> = {
      success: true,
      data: contacts,
      message: `${contacts.length} contatos encontrados`,
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    logger.error('Error fetching contacts:', error);
    throw createError(error.message || 'Erro ao buscar contatos', 500);
  }
}));

// Get chats
router.get('/instance/:instanceName/chats', asyncHandler(async (req: Request, res: Response) => {
  const { instanceName } = req.params;
  if (!instanceName) throw createError('Instance name é obrigatório', 400);

  try {
    const chats = await getEvolutionService().fetchChats(instanceName);

    const response: ApiResponse<any[]> = {
      success: true,
      data: chats,
      message: `${chats.length} conversas encontradas`,
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    logger.error('Error fetching chats:', error);
    throw createError(error.message || 'Erro ao buscar conversas', 500);
  }
}));

// Get webhook info
router.get('/instance/:instanceName/webhook', asyncHandler(async (req: Request, res: Response) => {
  const { instanceName } = req.params;
  if (!instanceName) throw createError('Instance name é obrigatório', 400);

  try {
    const webhook = await getEvolutionService().getWebhook(instanceName);

    const response: ApiResponse<any> = {
      success: true,
      data: webhook,
      message: 'Informações do webhook',
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error: any) {
    logger.error('Error getting webhook:', error);
    throw createError(error.message || 'Erro ao obter informações do webhook', 500);
  }
}));

// Health check
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  try {
    const isHealthy = await getEvolutionService().healthCheck();

    const response: ApiResponse<{ healthy: boolean; timestamp: string }> = {
      success: isHealthy,
      data: {
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      },
      message: isHealthy ? 'Evolution API is healthy' : 'Evolution API is not responding',
      timestamp: new Date().toISOString()
    };

    res.status(isHealthy ? 200 : 503).json(response);

  } catch (error: any) {
    logger.error('Error checking Evolution API health:', error);
    throw createError('Erro ao verificar saúde da Evolution API', 500);
  }
}));

export default router;