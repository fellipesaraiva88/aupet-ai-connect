import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AIService } from '../services/ai';
import { SupabaseService } from '../services/supabase';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

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
  const organizationId = req.user?.organizationId || 'default-org';

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
  const organizationId = req.user?.organizationId || 'default-org';

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