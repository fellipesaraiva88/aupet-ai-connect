import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SupabaseService } from '../services/supabase';
import { logger } from '../utils/logger';
import { ApiResponse, BusinessConfig } from '../types';

const router = Router();
// Lazy initialize services
let supabaseService: SupabaseService;

const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
};

// Get business settings
router.get('/business', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId || 'default-org';

  try {
    const config = await getSupabaseService().getBusinessConfig(organizationId);

    const response: ApiResponse<BusinessConfig | null> = {
      success: true,
      data: config,
      message: 'Business configuration retrieved',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting business config:', error);
    throw createError('Erro ao obter configurações', 500);
  }
}));

// Save business settings
router.put('/business', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId || 'default-org';
  const configData = { ...req.body, organization_id: organizationId };

  try {
    const config = await getSupabaseService().saveBusinessConfig(configData);

    const response: ApiResponse<BusinessConfig> = {
      success: true,
      data: config,
      message: 'Configurações salvas com sucesso! 💝',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error saving business config:', error);
    throw createError('Erro ao salvar configurações', 500);
  }
}));

// Get AI settings
router.get('/ai', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId || 'default-org';

  try {
    const config = await getSupabaseService().getAIConfig(organizationId);

    const response: ApiResponse<any> = {
      success: true,
      data: config,
      message: 'AI configuration retrieved',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting AI config:', error);
    throw createError('Erro ao obter configurações de IA', 500);
  }
}));

// Save AI settings
router.put('/ai', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId || 'default-org';
  const aiConfig = { ...req.body, organization_id: organizationId };

  try {
    const config = await getSupabaseService().saveAIConfig(aiConfig);

    const response: ApiResponse<any> = {
      success: true,
      data: config,
      message: 'Configurações de IA salvas! 🤖',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error saving AI config:', error);
    throw createError('Erro ao salvar configurações de IA', 500);
  }
}));

export default router;