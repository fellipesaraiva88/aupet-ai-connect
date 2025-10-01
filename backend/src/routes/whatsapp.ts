import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SupabaseService } from '../services/supabase';
import { getEvolutionAPIService } from '../services/evolution-api';
import { WebhookProcessor } from '../services/webhookProcessor';
import { WebSocketService } from '../services/websocket';
import { logger } from '../utils/logger';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { z } from 'zod';

const router = Router();

// Webhook fixo do Auzap
const AUZAP_WEBHOOK_URL = 'https://webhook.auzap.com.br';

// Lazy initialize services
let supabaseService: SupabaseService;
let webhookProcessor: WebhookProcessor;

const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
};

const getEvolutionService = () => {
  return getEvolutionAPIService();
};

const getWebhookProcessor = () => {
  if (!webhookProcessor) {
    const wsService = (global as any).wsService as WebSocketService;
    webhookProcessor = new WebhookProcessor(wsService);
  }
  return webhookProcessor;
};

/**
 * Helper para obter ou criar instância do usuário
 */
const getOrCreateUserInstance = async (userId: string, organizationId: string) => {
  const supabase = getSupabaseService();

  // Buscar instância existente do usuário
  const { data: existingInstance } = await supabase.supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (existingInstance) {
    return existingInstance;
  }

  // Criar nova instância automaticamente
  const instanceName = `auzap_${userId.substring(0, 8)}_${Date.now()}`;
  const evolution = getEvolutionService();

  try {
    // Criar no Evolution API com webhook já configurado
    const evolutionResponse = await evolution.createInstance({
      instanceName,
      qrcode: true,
      webhook: {
        url: AUZAP_WEBHOOK_URL,
        byEvents: true,
        events: [
          'QRCODE_UPDATED',
          'CONNECTION_UPDATE',
          'MESSAGES_SET',
          'MESSAGES_UPSERT',
          'CONTACTS_UPSERT',
          'PRESENCE_UPDATE',
          'CHATS_SET'
        ]
      }
    });

    // Salvar no Supabase
    const { data: newInstance, error } = await supabase.supabase
      .from('whatsapp_instances')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        instance_name: instanceName,
        status: 'created',
        connection_status: 'disconnected',
        is_connected: false,
        webhook_url: AUZAP_WEBHOOK_URL,
        metadata: {
          evolution_data: evolutionResponse,
          auto_created: true,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('Auto-created user instance', {
      userId,
      instanceName,
      webhookUrl: AUZAP_WEBHOOK_URL
    });

    return newInstance;
  } catch (error: any) {
    logger.error('Error auto-creating instance', {
      userId,
      error: error.message
    });
    throw error;
  }
};

// Webhook endpoint para Evolution API
router.post('/webhook/evolution', asyncHandler(async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    logger.webhook('WEBHOOK_RECEIVED', payload.event || 'unknown', {
      instance: payload.instance,
      event: payload.event,
      hasData: !!payload.data
    });

    const processor = getWebhookProcessor();
    await processor.processWebhook(payload);

    res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error: any) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}));

/**
 * @route GET /api/whatsapp/status
 * @desc Obter status simplificado da conexão WhatsApp do usuário
 * @access Private
 */
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  try {
    const instance = await getOrCreateUserInstance(userId, organizationId);
    const evolution = getEvolutionService();

    // Buscar status atual da Evolution API
    let connectionState = 'close';
    try {
      const statusResponse = await evolution.getConnectionState(instance.instance_name);
      connectionState = statusResponse.instance.state;
    } catch (error) {
      logger.warn('Could not get instance status from Evolution API', {
        instanceName: instance.instance_name
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        status: connectionState === 'open' ? 'connected' :
                instance.qr_code ? 'waiting_qr' : 'disconnected',
        needsQR: connectionState !== 'open' && !instance.qr_code,
        lastUpdate: instance.updated_at || instance.created_at
      },
      message: 'Status obtido com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting WhatsApp status:', error);
    throw createError('Erro ao obter status', 500);
  }
}));

/**
 * @route POST /api/whatsapp/connect
 * @desc Conectar WhatsApp e obter QR Code (cria instância automaticamente se necessário)
 * @access Private
 */
router.post('/connect', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  try {
    const instance = await getOrCreateUserInstance(userId, organizationId);
    const evolution = getEvolutionService();
    const supabase = getSupabaseService();

    logger.info('Connecting WhatsApp instance', {
      userId,
      instanceName: instance.instance_name
    });

    // Conectar e obter QR code
    const connectResponse = await evolution.connect(instance.instance_name);

    // Extrair QR code da resposta (pode vir em diferentes formatos)
    const qrCodeData = connectResponse.qrcode?.base64 || connectResponse.code;

    if (!qrCodeData) {
      logger.warn('No QR code in connect response', {
        instanceName: instance.instance_name,
        response: connectResponse
      });
      throw createError('Não foi possível gerar QR Code', 500);
    }

    // Atualizar instância com QR code
    await supabase.supabase
      .from('whatsapp_instances')
      .update({
        qr_code: qrCodeData,
        status: 'connecting',
        connection_status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        qrCode: qrCodeData,
        pairingCode: connectResponse.pairingCode,
        status: 'waiting_qr'
      },
      message: 'QR Code gerado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error connecting WhatsApp:', error);
    throw createError(error.message || 'Erro ao conectar WhatsApp', 500);
  }
}));

/**
 * @route POST /api/whatsapp/disconnect
 * @desc Desconectar WhatsApp
 * @access Private
 */
router.post('/disconnect', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  try {
    const supabase = getSupabaseService();

    // Buscar instância do usuário
    const { data: instance } = await supabase.supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (!instance) {
      throw createError('Nenhuma instância encontrada', 404);
    }

    const evolution = getEvolutionService();

    // Desconectar da Evolution API
    await evolution.logout(instance.instance_name);

    // Atualizar status no banco
    await supabase.supabase
      .from('whatsapp_instances')
      .update({
        status: 'disconnected',
        connection_status: 'disconnected',
        is_connected: false,
        qr_code: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    const response: ApiResponse<any> = {
      success: true,
      data: { disconnected: true },
      message: 'WhatsApp desconectado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error disconnecting WhatsApp:', error);
    throw createError('Erro ao desconectar WhatsApp', 500);
  }
}));

/**
 * @route GET /api/whatsapp/qrcode
 * @desc Obter QR Code atual
 * @access Private
 */
router.get('/qrcode', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  try {
    const supabase = getSupabaseService();

    // Buscar instância do usuário
    const { data: instance } = await supabase.supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (!instance) {
      const response: ApiResponse<any> = {
        success: true,
        data: {
          available: false,
          qrCode: null
        },
        message: 'Nenhuma instância encontrada',
        timestamp: new Date().toISOString()
      };
      return res.json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        available: !!instance.qr_code,
        qrCode: instance.qr_code
      },
      message: instance.qr_code ? 'QR Code disponível' : 'QR Code não disponível',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting QR code:', error);
    throw createError('Erro ao obter QR Code', 500);
  }
}));

// Configurações de instância
router.get('/instance/:instanceName/settings', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { instanceName } = req.params;

  try {
    const supabase = getSupabaseService();

    // Buscar instância
    const { data: instance } = await supabase.supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('instance_name', instanceName)
      .eq('organization_id', organizationId)
      .single();

    if (!instance) {
      throw createError('Instância não encontrada', 404);
    }

    // Buscar configurações
    const { data: settings, error } = await supabase.supabase
      .from('whatsapp_instance_settings')
      .select('*')
      .eq('instance_id', instance.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: settings || {
        auto_reply: false,
        ai_enabled: true,
        business_hours: { start: '08:00', end: '18:00', days: [1,2,3,4,5] },
        welcome_message: 'Olá! Bem-vindo ao nosso petshop! 🐾',
        away_message: 'Estamos fora do horário de atendimento. Em breve retornaremos!'
      },
      message: 'Configurações obtidas com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting instance settings:', error);
    throw createError('Erro ao obter configurações', 500);
  }
}));

router.put('/instance/:instanceName/settings', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { instanceName } = req.params;

  const settingsSchema = z.object({
    auto_reply: z.boolean().optional(),
    ai_enabled: z.boolean().optional(),
    business_hours: z.object({
      start: z.string(),
      end: z.string(),
      days: z.array(z.number())
    }).optional(),
    welcome_message: z.string().optional(),
    away_message: z.string().optional(),
    max_daily_messages: z.number().optional()
  });

  try {
    const validatedData = settingsSchema.parse(req.body);
    const supabase = getSupabaseService();

    // Buscar instância
    const { data: instance } = await supabase.supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('instance_name', instanceName)
      .eq('organization_id', organizationId)
      .single();

    if (!instance) {
      throw createError('Instância não encontrada', 404);
    }

    // Atualizar ou inserir configurações
    const { data: settings, error } = await supabase.supabase
      .from('whatsapp_instance_settings')
      .upsert({
        instance_id: instance.id,
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    const response: ApiResponse<any> = {
      success: true,
      data: settings,
      message: 'Configurações atualizadas com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error updating instance settings:', error);
    throw createError('Erro ao atualizar configurações', 500);
  }
}));

// Sincronização de contatos
router.post('/instance/:instanceName/sync/contacts', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { instanceName } = req.params;

  try {
    const evolution = getEvolutionService();
    const supabase = getSupabaseService();

    // Buscar instância
    const { data: instance } = await supabase.supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('instance_name', instanceName)
      .eq('organization_id', organizationId)
      .single();

    if (!instance) {
      throw createError('Instância não encontrada', 404);
    }

    // Obter contatos da Evolution API
    const contacts = await evolution.fetchContacts(instanceName);

    let syncedCount = 0;
    let errorCount = 0;

    // Sincronizar cada contato
    for (const contact of contacts) {
      try {
        await supabase.supabase
          .from('whatsapp_contacts')
          .upsert({
            phone: contact.phone,
            name: contact.name,
            profile_picture_url: contact.profilePicUrl,
            is_group: contact.isGroup,
            organization_id: organizationId,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'phone,organization_id'
          });

        syncedCount++;
      } catch (error) {
        logger.error('Error syncing contact:', { contact: contact.phone, error });
        errorCount++;
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        total: contacts.length,
        synced: syncedCount,
        errors: errorCount
      },
      message: `${syncedCount} contatos sincronizados com sucesso`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error syncing contacts:', error);
    throw createError('Erro ao sincronizar contatos', 500);
  }
}));

// Sincronização de conversas
router.post('/instance/:instanceName/sync/chats', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { instanceName } = req.params;

  try {
    const evolution = getEvolutionService();
    const supabase = getSupabaseService();

    // Buscar instância
    const { data: instance } = await supabase.supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('instance_name', instanceName)
      .eq('organization_id', organizationId)
      .single();

    if (!instance) {
      throw createError('Instância não encontrada', 404);
    }

    // Obter conversas da Evolution API
    const chats = await evolution.fetchChats(instanceName);

    let syncedCount = 0;

    for (const chat of chats) {
      try {
        const phoneNumber = chat.id.split('@')[0];

        // Buscar ou criar contato
        const { data: contact } = await supabase.supabase
          .from('whatsapp_contacts')
          .select('id')
          .eq('phone', phoneNumber)
          .eq('organization_id', organizationId)
          .single();

        if (contact) {
          // Criar ou atualizar conversa
          await supabase.supabase
            .from('whatsapp_conversations')
            .upsert({
              contact_id: contact.id,
              instance_id: instance.id,
              chat_id: phoneNumber,
              organization_id: organizationId,
              is_archived: chat.archived || false,
              is_pinned: chat.pinned || false,
              unread_count: chat.unreadCount || 0,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'contact_id,instance_id'
            });

          syncedCount++;
        }
      } catch (error) {
        logger.error('Error syncing chat:', { chat: chat.id, error });
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        total: chats.length,
        synced: syncedCount
      },
      message: `${syncedCount} conversas sincronizadas com sucesso`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error syncing chats:', error);
    throw createError('Erro ao sincronizar conversas', 500);
  }
}));

// Templates de mensagens
router.get('/templates', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const category = req.query.category as string;

  try {
    const supabase = getSupabaseService();
    let query = supabase.supabase
      .from('whatsapp_templates')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('usage_count', { ascending: false });

    const { data: templates, error, count } = await query;

    if (error) throw error;

    const response: any = {
      success: true,
      data: templates || [],
      message: 'Templates obtidos com sucesso',
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting templates:', error);
    throw createError('Erro ao obter templates', 500);
  }
}));

router.post('/templates', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  const templateSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    content: z.string().min(1, 'Conteúdo é obrigatório'),
    variables: z.array(z.string()).optional().default([]),
    category: z.string().default('general'),
    description: z.string().optional()
  });

  try {
    const validatedData = templateSchema.parse(req.body);
    const supabase = getSupabaseService();

    const { data: template, error } = await supabase.supabase
      .from('whatsapp_templates')
      .insert({
        ...validatedData,
        organization_id: organizationId,
        created_by: authReq.user?.id
      })
      .select()
      .single();

    if (error) throw error;

    const response: ApiResponse<any> = {
      success: true,
      data: template,
      message: 'Template criado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error creating template:', error);
    throw createError('Erro ao criar template', 500);
  }
}));

// Auto-respostas
router.get('/instance/:instanceName/auto-replies', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { instanceName } = req.params;

  try {
    const supabase = getSupabaseService();

    // Buscar instância
    const { data: instance } = await supabase.supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('instance_name', instanceName)
      .eq('organization_id', organizationId)
      .single();

    if (!instance) {
      throw createError('Instância não encontrada', 404);
    }

    const { data: autoReplies, error } = await supabase.supabase
      .from('whatsapp_auto_replies')
      .select('*')
      .eq('instance_id', instance.id)
      .order('priority', { ascending: false });

    if (error) throw error;

    const response: ApiResponse<any> = {
      success: true,
      data: autoReplies || [],
      message: 'Auto-respostas obtidas com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting auto-replies:', error);
    throw createError('Erro ao obter auto-respostas', 500);
  }
}));

router.post('/instance/:instanceName/auto-replies', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { instanceName } = req.params;

  const autoReplySchema = z.object({
    trigger_type: z.enum(['keyword', 'welcome', 'away', 'business_hours']),
    trigger_value: z.string().optional(),
    reply_message: z.string().min(1, 'Mensagem de resposta é obrigatória'),
    reply_type: z.enum(['text', 'template', 'buttons', 'list']).default('text'),
    reply_data: z.any().optional(),
    conditions: z.any().optional().default({}),
    priority: z.number().default(0),
    is_active: z.boolean().default(true)
  });

  try {
    const validatedData = autoReplySchema.parse(req.body);
    const supabase = getSupabaseService();

    // Buscar instância
    const { data: instance } = await supabase.supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('instance_name', instanceName)
      .eq('organization_id', organizationId)
      .single();

    if (!instance) {
      throw createError('Instância não encontrada', 404);
    }

    const { data: autoReply, error } = await supabase.supabase
      .from('whatsapp_auto_replies')
      .insert({
        ...validatedData,
        instance_id: instance.id
      })
      .select()
      .single();

    if (error) throw error;

    const response: ApiResponse<any> = {
      success: true,
      data: autoReply,
      message: 'Auto-resposta criada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error creating auto-reply:', error);
    throw createError('Erro ao criar auto-resposta', 500);
  }
}));

// Fila de mensagens
router.get('/message-queue', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  const status = req.query.status as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const supabase = getSupabaseService();
    let query = supabase.supabase
      .from('whatsapp_message_queue')
      .select(`
        *,
        whatsapp_instances (instance_name)
      `, { count: 'exact' })
      .eq('organization_id', organizationId);

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('priority', { ascending: false });

    const { data: queue, error, count } = await query;

    if (error) throw error;

    const response: any = {
      success: true,
      data: queue || [],
      message: 'Fila de mensagens obtida com sucesso',
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting message queue:', error);
    throw createError('Erro ao obter fila de mensagens', 500);
  }
}));

// Estatísticas
router.get('/stats/:instanceName', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { instanceName } = req.params;
  const days = parseInt(req.query.days as string) || 7;

  try {
    const supabase = getSupabaseService();

    // Buscar instância
    const { data: instance } = await supabase.supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('instance_name', instanceName)
      .eq('organization_id', organizationId)
      .single();

    if (!instance) {
      throw createError('Instância não encontrada', 404);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Estatísticas das mensagens
    const { data: messageStats } = await supabase.supabase
      .from('whatsapp_messages')
      .select('direction, message_type, created_at')
      .eq('instance_id', instance.id)
      .gte('created_at', startDate.toISOString());

    // Estatísticas das conversas
    const { data: conversationStats } = await supabase.supabase
      .from('whatsapp_conversations')
      .select('status, created_at')
      .eq('instance_id', instance.id)
      .gte('created_at', startDate.toISOString());

    const stats = {
      period: {
        days,
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString()
      },
      messages: {
        total: messageStats?.length || 0,
        sent: messageStats?.filter(m => m.direction === 'outbound').length || 0,
        received: messageStats?.filter(m => m.direction === 'inbound').length || 0,
        by_type: {
          text: messageStats?.filter(m => m.message_type === 'text').length || 0,
          image: messageStats?.filter(m => m.message_type === 'image').length || 0,
          video: messageStats?.filter(m => m.message_type === 'video').length || 0,
          audio: messageStats?.filter(m => m.message_type === 'audio').length || 0,
          document: messageStats?.filter(m => m.message_type === 'document').length || 0
        }
      },
      conversations: {
        total: conversationStats?.length || 0,
        active: conversationStats?.filter(c => c.status === 'active').length || 0,
        resolved: conversationStats?.filter(c => c.status === 'resolved').length || 0
      }
    };

    const response: ApiResponse<any> = {
      success: true,
      data: stats,
      message: 'Estatísticas obtidas com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting stats:', error);
    throw createError('Erro ao obter estatísticas', 500);
  }
}));

export default router;