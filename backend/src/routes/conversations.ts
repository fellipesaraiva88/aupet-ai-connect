import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SupabaseService } from '../services/supabase';
import { logger } from '../utils/logger';
import { ApiResponse, PaginatedResponse, AuthenticatedRequest } from '../types';
import { z } from 'zod';

const router = Router();
let supabaseService: SupabaseService;

const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
};

// GET /conversations - List WhatsApp conversations
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const assigned_to = req.query.assigned_to as string;
  const priority = req.query.priority as string;
  const search = req.query.search as string;
  const date_range = req.query.date_range as string;

  try {
    const supabase = getSupabaseService();
    let query = supabase.supabase
      .from('whatsapp_conversations')
      .select(`
        *,
        whatsapp_contacts (
          id,
          name,
          phone
        ),
        latest_message:whatsapp_messages (
          id,
          content,
          direction,
          message_type,
          created_at
        ),
        unread_count:whatsapp_messages (count)
      `, { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    if (search) {
      // Search in conversation content through related messages
      query = query.or(`whatsapp_contacts.name.ilike.%${search}%,whatsapp_contacts.phone.ilike.%${search}%`);
    }

    if (date_range) {
      const [startDate, endDate] = date_range.split(',');
      if (startDate) query = query.gte('created_at', `${startDate}T00:00:00.000Z`);
      if (endDate) query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('last_message_at', { ascending: false });

    const { data: conversations, error, count } = await query;

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);

    const response: PaginatedResponse<any> = {
      success: true,
      data: conversations || [],
      message: 'Conversations retrieved successfully',
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting conversations:', error);
    throw createError('Erro ao obter conversas', 500);
  }
}));

// GET /conversations/:id - Get conversation details with messages
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  try {
    const supabase = getSupabaseService();

    // Get conversation details
    const { data: conversation, error: convError } = await supabase.supabase
      .from('whatsapp_conversations')
      .select(`
        *,
        whatsapp_contacts (
          id,
          name,
          phone
        )
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (convError) {
      if (convError.code === 'PGRST116') {
        throw createError('Conversa não encontrada', 404);
      }
      throw convError;
    }

    // Get messages with pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: messages, error: msgError, count } = await supabase.supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', id)
      .eq('organization_id', organizationId)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (msgError) throw msgError;

    const totalPages = Math.ceil((count || 0) / limit);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        conversation,
        messages: messages || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages
        }
      },
      message: 'Conversation details retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting conversation details:', error);
    throw createError('Erro ao obter detalhes da conversa', 500);
  }
}));

// PUT /conversations/:id - Update conversation (assign, priority, tags)
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;

  const updateSchema = z.object({
    assigned_to: z.string().uuid().optional(),
    priority: z.enum(['normal', 'high', 'urgent']).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['active', 'resolved', 'escalated', 'archived']).optional(),
    notes: z.string().optional()
  });

  try {
    const validatedData = updateSchema.parse(req.body);
    const supabase = getSupabaseService();

    const { data: conversation, error } = await supabase.supabase
      .from('whatsapp_conversations')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        whatsapp_contacts (id, name, phone),
        assigned_staff:assigned_to (id, name)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Conversa não encontrada', 404);
      }
      throw error;
    }

    logger.info('Conversation updated', { conversationId: id, organizationId, updates: validatedData });

    const response: ApiResponse<any> = {
      success: true,
      data: conversation,
      message: 'Conversa atualizada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error updating conversation:', error);
    throw createError('Erro ao atualizar conversa', 500);
  }
}));

// POST /conversations/:id/messages - Send message in conversation
router.post('/:id/messages', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;

  const messageSchema = z.object({
    content: z.string().min(1, 'Conteúdo da mensagem é obrigatório'),
    message_type: z.enum(['text', 'image', 'audio', 'document', 'video']).default('text'),
    sender_type: z.enum(['human', 'ai']).default('human'),
    media_url: z.string().url().optional()
  });

  try {
    const validatedData = messageSchema.parse(req.body);
    const supabase = getSupabaseService();

    // Verify conversation exists
    const { data: conversation } = await supabase.supabase
      .from('whatsapp_conversations')
      .select('id, contact_id, instance_id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!conversation) {
      throw createError('Conversa não encontrada', 404);
    }

    // Save message to database
    const { data: message, error } = await supabase.supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: id,
        instance_id: conversation.instance_id,
        content: validatedData.content,
        direction: 'outbound',
        message_type: validatedData.message_type,
        sender_type: validatedData.sender_type,
        external_id: `manual_${Date.now()}`,
        organization_id: organizationId,
        metadata: validatedData.media_url ? { media_url: validatedData.media_url } : {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last_message_at
    await supabase.supabase
      .from('whatsapp_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // TODO: Send actual WhatsApp message through Evolution API
    // This would integrate with the Evolution service to send the message

    logger.info('Message sent in conversation', { conversationId: id, messageId: message.id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: message,
      message: 'Mensagem enviada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error sending message:', error);
    throw createError('Erro ao enviar mensagem', 500);
  }
}));

// GET /conversations/:id/messages - Get conversation messages
router.get('/:id/messages', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const before = req.query.before as string; // For infinite scroll
  const after = req.query.after as string;

  try {
    const supabase = getSupabaseService();

    // Verify conversation exists
    const { data: conversation } = await supabase.supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!conversation) {
      throw createError('Conversa não encontrada', 404);
    }

    let query = supabase.supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', id)
      .eq('organization_id', organizationId);

    // Apply date filters for infinite scroll
    if (before) {
      query = query.lt('created_at', before);
    }

    if (after) {
      query = query.gt('created_at', after);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: messages, error, count } = await query;

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);

    const response: PaginatedResponse<any> = {
      success: true,
      data: messages || [],
      message: 'Messages retrieved successfully',
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting conversation messages:', error);
    throw createError('Erro ao obter mensagens', 500);
  }
}));

// POST /conversations/:id/escalate - Escalate conversation to human
router.post('/:id/escalate', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;

  const escalateSchema = z.object({
    reason: z.string().min(1, 'Motivo da escalação é obrigatório'),
    assigned_to: z.string().uuid().optional(),
    priority: z.enum(['normal', 'high', 'urgent']).default('high')
  });

  try {
    const validatedData = escalateSchema.parse(req.body);
    const supabase = getSupabaseService();

    const { data: conversation, error } = await supabase.supabase
      .from('whatsapp_conversations')
      .update({
        status: 'escalated',
        priority: validatedData.priority,
        assigned_to: validatedData.assigned_to,
        escalation_reason: validatedData.reason,
        escalated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        whatsapp_contacts (id, name, phone),
        assigned_staff:assigned_to (id, name)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Conversa não encontrada', 404);
      }
      throw error;
    }

    // TODO: Send notification to assigned staff or general escalation queue

    logger.info('Conversation escalated', { conversationId: id, reason: validatedData.reason, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: conversation,
      message: 'Conversa escalada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error escalating conversation:', error);
    throw createError('Erro ao escalar conversa', 500);
  }
}));

// POST /conversations/:id/resolve - Mark conversation as resolved
router.post('/:id/resolve', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;

  const resolveSchema = z.object({
    resolution_notes: z.string().optional(),
    customer_satisfied: z.boolean().optional(),
    follow_up_required: z.boolean().default(false),
    follow_up_date: z.string().datetime().optional()
  });

  try {
    const validatedData = resolveSchema.parse(req.body);
    const supabase = getSupabaseService();

    const { data: conversation, error } = await supabase.supabase
      .from('whatsapp_conversations')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: validatedData.resolution_notes,
        customer_satisfied: validatedData.customer_satisfied,
        follow_up_required: validatedData.follow_up_required,
        follow_up_date: validatedData.follow_up_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        whatsapp_contacts (id, name, phone)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Conversa não encontrada', 404);
      }
      throw error;
    }

    logger.info('Conversation resolved', { conversationId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: conversation,
      message: 'Conversa resolvida com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error resolving conversation:', error);
    throw createError('Erro ao resolver conversa', 500);
  }
}));

// POST /conversations/:id/assign - Assign conversation to staff member
router.post('/:id/assign', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';
  const { id } = req.params;

  const assignSchema = z.object({
    assigned_to: z.string().uuid('Staff ID inválido'),
    notes: z.string().optional()
  });

  try {
    const validatedData = assignSchema.parse(req.body);
    const supabase = getSupabaseService();

    // TODO: Verify staff member exists and belongs to organization

    const { data: conversation, error } = await supabase.supabase
      .from('whatsapp_conversations')
      .update({
        assigned_to: validatedData.assigned_to,
        assignment_notes: validatedData.notes,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        whatsapp_contacts (id, name, phone),
        assigned_staff:assigned_to (id, name)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Conversa não encontrada', 404);
      }
      throw error;
    }

    logger.info('Conversation assigned', { conversationId: id, assignedTo: validatedData.assigned_to, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: conversation,
      message: 'Conversa atribuída com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error assigning conversation:', error);
    throw createError('Erro ao atribuir conversa', 500);
  }
}));

// GET /conversations/pending - Get conversations pending human response
router.get('/pending/human', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const supabase = getSupabaseService();
    let query = supabase.supabase
      .from('whatsapp_conversations')
      .select(`
        *,
        whatsapp_contacts (id, name, phone),
        latest_message:whatsapp_messages (
          id,
          content,
          direction,
          created_at
        )
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .in('status', ['escalated', 'active'])
      .or('assigned_to.is.null,priority.eq.urgent,priority.eq.high');

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('escalated_at', { ascending: true });

    const { data: conversations, error, count } = await query;

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);

    const response: PaginatedResponse<any> = {
      success: true,
      data: conversations || [],
      message: 'Pending conversations retrieved successfully',
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting pending conversations:', error);
    throw createError('Erro ao obter conversas pendentes', 500);
  }
}));

// GET /conversations/metrics - Conversation analytics and metrics
router.get('/metrics/analytics', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '00000000-0000-0000-0000-000000000001';

  const days = parseInt(req.query.days as string) || 7;

  try {
    const supabase = getSupabaseService();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get conversation metrics
    const { data: conversations } = await supabase.supabase
      .from('whatsapp_conversations')
      .select(`
        id,
        status,
        priority,
        created_at,
        resolved_at,
        escalated_at,
        whatsapp_messages (
          id,
          direction,
          sender_type,
          created_at
        )
      `)
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString());

    if (!conversations) {
      throw createError('Erro ao obter dados de métricas', 500);
    }

    // Calculate metrics
    const totalConversations = conversations.length;
    const resolvedConversations = conversations.filter(c => c.status === 'resolved').length;
    const escalatedConversations = conversations.filter(c => c.status === 'escalated').length;
    const activeConversations = conversations.filter(c => c.status === 'active').length;

    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;

    conversations.forEach(conv => {
      const messages = conv.whatsapp_messages || [];
      const inboundMessages = messages.filter(m => m.direction === 'inbound');
      const outboundMessages = messages.filter(m => m.direction === 'outbound');

      inboundMessages.forEach(inbound => {
        const nextOutbound = outboundMessages.find(outbound =>
          new Date(outbound.created_at) > new Date(inbound.created_at)
        );

        if (nextOutbound) {
          const responseTime = new Date(nextOutbound.created_at).getTime() - new Date(inbound.created_at).getTime();
          totalResponseTime += responseTime;
          responseCount++;
        }
      });
    });

    const avgResponseTimeMs = responseCount > 0 ? totalResponseTime / responseCount : 0;
    const avgResponseTimeMinutes = Math.round(avgResponseTimeMs / (1000 * 60));

    // Calculate AI vs Human message ratio
    const allMessages = conversations.flatMap(c => c.whatsapp_messages || []);
    const aiMessages = allMessages.filter(m => m.sender_type === 'ai').length;
    const humanMessages = allMessages.filter(m => m.sender_type === 'human').length;
    const aiHandlingRate = totalConversations > 0 ? ((totalConversations - escalatedConversations) / totalConversations) * 100 : 0;

    const metrics = {
      period: {
        days,
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString()
      },
      conversations: {
        total: totalConversations,
        active: activeConversations,
        resolved: resolvedConversations,
        escalated: escalatedConversations,
        resolution_rate: totalConversations > 0 ? (resolvedConversations / totalConversations) * 100 : 0,
        escalation_rate: totalConversations > 0 ? (escalatedConversations / totalConversations) * 100 : 0
      },
      response_time: {
        average_minutes: avgResponseTimeMinutes,
        average_seconds: Math.round(avgResponseTimeMs / 1000)
      },
      ai_performance: {
        ai_messages: aiMessages,
        human_messages: humanMessages,
        ai_handling_rate: aiHandlingRate,
        total_messages: allMessages.length
      }
    };

    const response: ApiResponse<any> = {
      success: true,
      data: metrics,
      message: 'Conversation metrics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting conversation metrics:', error);
    throw createError('Erro ao obter métricas de conversas', 500);
  }
}));

export default router;