import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SupabaseService } from '../services/supabase';
import { logger } from '../utils/logger';
import { ApiResponse, DashboardStats } from '../types';

const router = Router();
// Lazy initialize services
let supabaseService: SupabaseService;

const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
};

// Get dashboard stats
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const stats = await getSupabaseService().getDashboardStats(organizationId);

    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats,
      message: 'Dashboard stats retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting dashboard stats:', error);
    throw createError('Erro ao obter estatísticas do dashboard', 500);
  }
}));

// Get conversation analytics
router.get('/analytics/conversations', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const days = parseInt(req.query.days as string) || 7;

  try {
    const analytics = await getSupabaseService().getConversationAnalytics(organizationId, days);

    const response: ApiResponse<any[]> = {
      success: true,
      data: analytics,
      message: `Analytics for last ${days} days`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting conversation analytics:', error);
    throw createError('Erro ao obter analytics de conversas', 500);
  }
}));

export default router;