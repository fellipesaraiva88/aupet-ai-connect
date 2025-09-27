import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AIService } from '../services/ai';
import { SupabaseService } from '../services/supabase';
import { logger } from '../utils/logger';
import { ApiResponse, PaginatedResponse, AuthenticatedRequest } from '../types';
import { z } from 'zod';

const router = Router();

// Lazy initialize services
let aiService: AIService;
let supabaseService: SupabaseService;

const getAIService = () => {
  if (!aiService) {
    aiService = new AIService();
  }
  return aiService;
};

const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
};

// Analyze message
router.post('/analyze', asyncHandler(async (req: Request, res: Response) => {
  const { message, customerContext } = req.body;
  const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  if (!message) {
    throw createError('Message is required', 400);
  }

  try {
    const businessConfig = await getSupabaseService().getBusinessConfig(organizationId);

    if (!businessConfig) {
      throw createError('Business configuration not found', 404);
    }

    const analysis = await getAIService().analyzeMessage(message, customerContext, businessConfig);

    const response: ApiResponse<any> = {
      success: true,
      data: analysis,
      message: 'Message analyzed successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error analyzing message:', error);
    throw createError('Erro ao analisar mensagem', 500);
  }
}));

// Generate response
router.post('/generate-response', asyncHandler(async (req: Request, res: Response) => {
  const { intent, customerContext, previousMessages } = req.body;
  const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  if (!intent) {
    throw createError('Intent is required', 400);
  }

  try {
    const businessConfig = await getSupabaseService().getBusinessConfig(organizationId);

    if (!businessConfig) {
      throw createError('Business configuration not found', 404);
    }

    const response_text = await getAIService().generateResponse(
      intent,
      customerContext,
      businessConfig,
      previousMessages
    );

    const response: ApiResponse<{ response: string }> = {
      success: true,
      data: { response: response_text },
      message: 'Response generated successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error generating response:', error);
    throw createError('Erro ao gerar resposta', 500);
  }
}));

// GET /ai/configurations - List AI configurations
router.get('/configurations', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const supabase = getSupabaseService();
    let query = supabase.supabase
      .from('ai_configurations')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: configurations, error, count } = await query;

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);

    const response: PaginatedResponse<any> = {
      success: true,
      data: configurations || [],
      message: 'AI configurations retrieved successfully',
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
    logger.error('Error getting AI configurations:', error);
    throw createError('Erro ao obter configurações de IA', 500);
  }
}));

// POST /ai/configurations - Create AI configuration
router.post('/configurations', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  const configSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    system_prompt: z.string().min(1, 'Prompt do sistema é obrigatório'),
    personality: z.enum(['professional', 'friendly', 'casual', 'formal']).default('friendly'),
    temperature: z.number().min(0).max(2).default(0.7),
    max_tokens: z.number().positive().default(150),
    response_delay_seconds: z.number().min(0).max(30).default(2),
    escalation_keywords: z.array(z.string()).default(['humano', 'atendente', 'manager']),
    auto_reply_enabled: z.boolean().default(true),
    business_hours_only: z.boolean().default(false),
    is_active: z.boolean().default(false)
  });

  try {
    const validatedData = configSchema.parse(req.body);
    const supabase = getSupabaseService();

    // If setting as active, deactivate others
    if (validatedData.is_active) {
      await supabase.supabase
        .from('ai_configurations')
        .update({ is_active: false })
        .eq('organization_id', organizationId);
    }

    const { data: configuration, error } = await supabase.supabase
      .from('ai_configurations')
      .insert({
        ...validatedData,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('AI configuration created', { configurationId: configuration.id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: configuration,
      message: 'Configuração de IA criada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error creating AI configuration:', error);
    throw createError('Erro ao criar configuração de IA', 500);
  }
}));

// GET /ai/configurations/:id - Get AI configuration
router.get('/configurations/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();
    const { data: configuration, error } = await supabase.supabase
      .from('ai_configurations')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Configuração de IA não encontrada', 404);
      }
      throw error;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: configuration,
      message: 'AI configuration retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting AI configuration:', error);
    throw createError('Erro ao obter configuração de IA', 500);
  }
}));

// PUT /ai/configurations/:id - Update AI configuration
router.put('/configurations/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  const updateSchema = z.object({
    name: z.string().min(1).optional(),
    system_prompt: z.string().min(1).optional(),
    personality: z.enum(['professional', 'friendly', 'casual', 'formal']).optional(),
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().positive().optional(),
    response_delay_seconds: z.number().min(0).max(30).optional(),
    escalation_keywords: z.array(z.string()).optional(),
    auto_reply_enabled: z.boolean().optional(),
    business_hours_only: z.boolean().optional(),
    is_active: z.boolean().optional()
  });

  try {
    const validatedData = updateSchema.parse(req.body);
    const supabase = getSupabaseService();

    // If setting as active, deactivate others
    if (validatedData.is_active) {
      await supabase.supabase
        .from('ai_configurations')
        .update({ is_active: false })
        .eq('organization_id', organizationId)
        .neq('id', id);
    }

    const { data: configuration, error } = await supabase.supabase
      .from('ai_configurations')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Configuração de IA não encontrada', 404);
      }
      throw error;
    }

    logger.info('AI configuration updated', { configurationId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: configuration,
      message: 'Configuração de IA atualizada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error updating AI configuration:', error);
    throw createError('Erro ao atualizar configuração de IA', 500);
  }
}));

// DELETE /ai/configurations/:id - Delete AI configuration
router.delete('/configurations/:id', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();

    // Check if it's the active configuration
    const { data: configuration } = await supabase.supabase
      .from('ai_configurations')
      .select('is_active')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!configuration) {
      throw createError('Configuração de IA não encontrada', 404);
    }

    if (configuration.is_active) {
      throw createError('Não é possível excluir a configuração ativa', 409);
    }

    const { error } = await supabase.supabase
      .from('ai_configurations')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;

    logger.info('AI configuration deleted', { configurationId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: null,
      message: 'Configuração de IA excluída com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error deleting AI configuration:', error);
    throw createError('Erro ao excluir configuração de IA', 500);
  }
}));

// POST /ai/configurations/:id/test - Test AI configuration
router.post('/configurations/:id/test', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  const testSchema = z.object({
    test_message: z.string().min(1, 'Mensagem de teste é obrigatória'),
    customer_context: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      pets: z.array(z.any()).optional()
    }).optional()
  });

  try {
    const validatedData = testSchema.parse(req.body);
    const supabase = getSupabaseService();

    // Get AI configuration
    const { data: configuration, error } = await supabase.supabase
      .from('ai_configurations')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !configuration) {
      throw createError('Configuração de IA não encontrada', 404);
    }

    // Test the configuration
    const aiService = getAIService();

    // Create a mock business config from the AI configuration
    const mockBusinessConfig = {
      organization_id: organizationId,
      business_name: 'Test Pet Shop',
      welcome_message: 'Olá! Como posso ajudar você e seu pet hoje?',
      ai_personality: configuration.personality,
      response_delay_seconds: configuration.response_delay_seconds,
      escalation_keywords: configuration.escalation_keywords,
      auto_reply: configuration.auto_reply_enabled,
      business_hours: {
        enabled: !configuration.business_hours_only,
        timezone: 'America/Sao_Paulo',
        schedule: {
          monday: { start: '08:00', end: '18:00', enabled: true },
          tuesday: { start: '08:00', end: '18:00', enabled: true },
          wednesday: { start: '08:00', end: '18:00', enabled: true },
          thursday: { start: '08:00', end: '18:00', enabled: true },
          friday: { start: '08:00', end: '18:00', enabled: true },
          saturday: { start: '08:00', end: '16:00', enabled: true },
          sunday: { start: '08:00', end: '12:00', enabled: false }
        }
      }
    };

    const analysis = await aiService.analyzeMessage(
      validatedData.test_message,
      validatedData.customer_context || {},
      mockBusinessConfig
    );

    const suggestedResponse = await aiService.generateResponse(
      analysis.intent,
      validatedData.customer_context || {},
      mockBusinessConfig,
      [{ content: validatedData.test_message, direction: 'inbound' }]
    );

    const testResult = {
      configuration: {
        id: configuration.id,
        name: configuration.name,
        personality: configuration.personality
      },
      test_input: validatedData.test_message,
      analysis,
      suggested_response: suggestedResponse,
      test_completed_at: new Date().toISOString()
    };

    logger.info('AI configuration tested', { configurationId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: testResult,
      message: 'Teste de configuração de IA concluído',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error testing AI configuration:', error);
    throw createError('Erro ao testar configuração de IA', 500);
  }
}));

// GET /ai/configurations/:id/metrics - AI performance metrics
router.get('/configurations/:id/metrics', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;
  const days = parseInt(req.query.days as string) || 7;

  try {
    const supabase = getSupabaseService();

    // Verify configuration exists
    const { data: configuration } = await supabase.supabase
      .from('ai_configurations')
      .select('id, name')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!configuration) {
      throw createError('Configuração de IA não encontrada', 404);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get conversations and messages for metrics
    const { data: conversations } = await supabase.supabase
      .from('whatsapp_conversations')
      .select(`
        id,
        status,
        created_at,
        escalated_at,
        resolved_at,
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
    const aiHandledConversations = conversations.filter(c =>
      c.whatsapp_messages.some(m => m.sender_type === 'ai') && c.status !== 'escalated'
    ).length;
    const escalatedConversations = conversations.filter(c => c.status === 'escalated').length;
    const resolvedConversations = conversations.filter(c => c.status === 'resolved').length;

    const aiSuccessRate = totalConversations > 0 ? (aiHandledConversations / totalConversations) * 100 : 0;
    const escalationRate = totalConversations > 0 ? (escalatedConversations / totalConversations) * 100 : 0;
    const resolutionRate = totalConversations > 0 ? (resolvedConversations / totalConversations) * 100 : 0;

    // Calculate response times
    let totalResponseTime = 0;
    let responseCount = 0;

    conversations.forEach(conv => {
      const messages = conv.whatsapp_messages || [];
      const inboundMessages = messages.filter(m => m.direction === 'inbound');
      const aiResponses = messages.filter(m => m.direction === 'outbound' && m.sender_type === 'ai');

      inboundMessages.forEach(inbound => {
        const nextAIResponse = aiResponses.find(response =>
          new Date(response.created_at) > new Date(inbound.created_at)
        );

        if (nextAIResponse) {
          const responseTime = new Date(nextAIResponse.created_at).getTime() - new Date(inbound.created_at).getTime();
          totalResponseTime += responseTime;
          responseCount++;
        }
      });
    });

    const avgResponseTimeMs = responseCount > 0 ? totalResponseTime / responseCount : 0;

    const metrics = {
      configuration: {
        id: configuration.id,
        name: configuration.name
      },
      period: {
        days,
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString()
      },
      performance: {
        total_conversations: totalConversations,
        ai_handled_conversations: aiHandledConversations,
        ai_success_rate: aiSuccessRate,
        escalation_rate: escalationRate,
        resolution_rate: resolutionRate,
        avg_response_time_seconds: Math.round(avgResponseTimeMs / 1000),
        avg_response_time_minutes: Math.round(avgResponseTimeMs / (1000 * 60))
      }
    };

    const response: ApiResponse<any> = {
      success: true,
      data: metrics,
      message: 'AI configuration metrics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting AI configuration metrics:', error);
    throw createError('Erro ao obter métricas da configuração de IA', 500);
  }
}));

// POST /ai/configurations/:id/activate - Activate AI configuration
router.post('/configurations/:id/activate', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const { id } = req.params;

  try {
    const supabase = getSupabaseService();

    // Deactivate all other configurations
    await supabase.supabase
      .from('ai_configurations')
      .update({ is_active: false })
      .eq('organization_id', organizationId);

    // Activate the selected configuration
    const { data: configuration, error } = await supabase.supabase
      .from('ai_configurations')
      .update({
        is_active: true,
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError('Configuração de IA não encontrada', 404);
      }
      throw error;
    }

    logger.info('AI configuration activated', { configurationId: id, organizationId });

    const response: ApiResponse<any> = {
      success: true,
      data: configuration,
      message: 'Configuração de IA ativada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error activating AI configuration:', error);
    throw createError('Erro ao ativar configuração de IA', 500);
  }
}));

// Health check
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  try {
    const isHealthy = await getAIService().healthCheck();

    const response: ApiResponse<{ healthy: boolean }> = {
      success: isHealthy,
      data: { healthy: isHealthy },
      message: isHealthy ? 'AI service is healthy' : 'AI service is not available',
      timestamp: new Date().toISOString()
    };

    res.status(isHealthy ? 200 : 503).json(response);
  } catch (error: any) {
    logger.error('Error checking AI health:', error);
    throw createError('Erro ao verificar saúde da IA', 500);
  }
}));

export default router;