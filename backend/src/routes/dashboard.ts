import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { SupabaseService } from '../services/supabase';
import { AnalyticsService } from '../services/analytics';
import { cache, orgCache } from '../middleware/cache';
import { logger } from '../utils/logger';
import { ApiResponse, DashboardStats, AuthenticatedRequest } from '../types';
import { z } from 'zod';

const router = Router();
// Lazy initialize services
let supabaseService: SupabaseService;
let analyticsService: AnalyticsService;

const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
};

const getAnalyticsService = () => {
  if (!analyticsService) {
    analyticsService = new AnalyticsService();
  }
  return analyticsService;
};

// Validation schemas
const analyticsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  days: z.string().transform(val => parseInt(val) || 30),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional()
});

// GET /dashboard/overview - Complete dashboard overview (cached for 1 minute)
router.get('/overview', orgCache(60), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const overview = await getAnalyticsService().getDashboardOverview(organizationId);

    const response: ApiResponse<any> = {
      success: true,
      data: overview,
      message: 'Dashboard overview retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting dashboard overview:', error);
    throw createError('Erro ao obter visão geral do dashboard', 500);
  }
}));

// GET /dashboard/stats - Legacy dashboard stats
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

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

// GET /dashboard/analytics/revenue - Revenue analytics
router.get('/analytics/revenue', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const { period } = analyticsQuerySchema.parse(req.query);
    const analytics = await getAnalyticsService().getRevenueAnalytics(organizationId, period);

    const response: ApiResponse<any> = {
      success: true,
      data: analytics,
      message: `Revenue analytics for ${period}`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting revenue analytics:', error);
    if (error.name === 'ZodError') {
      throw createError('Parâmetros de consulta inválidos', 400);
    }
    throw createError('Erro ao obter analytics de receita', 500);
  }
}));

// GET /dashboard/analytics/appointments - Appointment analytics
router.get('/analytics/appointments', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const { days } = analyticsQuerySchema.parse(req.query);
    const analytics = await getAnalyticsService().getAppointmentAnalytics(organizationId, days);

    const response: ApiResponse<any> = {
      success: true,
      data: analytics,
      message: `Appointment analytics for last ${days} days`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting appointment analytics:', error);
    if (error.name === 'ZodError') {
      throw createError('Parâmetros de consulta inválidos', 400);
    }
    throw createError('Erro ao obter analytics de agendamentos', 500);
  }
}));

// GET /dashboard/analytics/customers - Customer analytics
router.get('/analytics/customers', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const analytics = await getAnalyticsService().getCustomerAnalytics(organizationId);

    const response: ApiResponse<any> = {
      success: true,
      data: analytics,
      message: 'Customer analytics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting customer analytics:', error);
    throw createError('Erro ao obter analytics de clientes', 500);
  }
}));

// GET /dashboard/analytics/pets - Pet health analytics
router.get('/analytics/pets', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const analytics = await getAnalyticsService().getPetHealthAnalytics(organizationId);

    const response: ApiResponse<any> = {
      success: true,
      data: analytics,
      message: 'Pet health analytics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting pet health analytics:', error);
    throw createError('Erro ao obter analytics de saúde dos pets', 500);
  }
}));

// GET /dashboard/analytics/conversations - Legacy conversation analytics
router.get('/analytics/conversations', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
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

// GET /dashboard/performance - Performance metrics
router.get('/performance', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const supabase = getSupabaseService();

    // Get key performance indicators
    const [
      avgResponseTime,
      appointmentCompletionRate,
      customerSatisfaction,
      revenueGrowth
    ] = await Promise.all([
      getAvgResponseTime(supabase, organizationId),
      getAppointmentCompletionRate(supabase, organizationId),
      getCustomerSatisfactionScore(supabase, organizationId),
      getRevenueGrowthRate(supabase, organizationId)
    ]);

    const performance = {
      avg_response_time_minutes: avgResponseTime,
      appointment_completion_rate: appointmentCompletionRate,
      customer_satisfaction_score: customerSatisfaction,
      revenue_growth_rate: revenueGrowth,
      last_updated: new Date().toISOString()
    };

    const response: ApiResponse<any> = {
      success: true,
      data: performance,
      message: 'Performance metrics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting performance metrics:', error);
    throw createError('Erro ao obter métricas de performance', 500);
  }
}));

// Helper functions for performance metrics
async function getAvgResponseTime(supabase: SupabaseService, organizationId: string): Promise<number> {
  // Simulate average response time calculation
  // In real implementation, this would calculate time between customer message and response
  return 2.5; // minutes
}

async function getAppointmentCompletionRate(supabase: SupabaseService, organizationId: string): Promise<number> {
  const { data: appointments } = await supabase.supabase
    .from('appointments')
    .select('status')
    .eq('organization_id', organizationId);

  if (!appointments || appointments.length === 0) return 0;

  const completed = appointments.filter(apt => apt.status === 'completed').length;
  return (completed / appointments.length) * 100;
}

async function getCustomerSatisfactionScore(supabase: SupabaseService, organizationId: string): Promise<number> {
  // Simulate customer satisfaction score
  // In real implementation, this would be based on feedback/ratings
  return 4.2; // out of 5
}

async function getRevenueGrowthRate(supabase: SupabaseService, organizationId: string): Promise<number> {
  const currentMonth = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [currentRevenue, lastRevenue] = await Promise.all([
    getMonthlyRevenue(supabase, organizationId, currentMonth),
    getMonthlyRevenue(supabase, organizationId, lastMonth)
  ]);

  if (lastRevenue === 0) return currentRevenue > 0 ? 100 : 0;
  return ((currentRevenue - lastRevenue) / lastRevenue) * 100;
}

async function getMonthlyRevenue(supabase: SupabaseService, organizationId: string, month: Date): Promise<number> {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const { data } = await supabase.supabase
    .from('appointments')
    .select('actual_cost, price')
    .eq('organization_id', organizationId)
    .eq('status', 'completed')
    .gte('completed_at', startOfMonth.toISOString())
    .lte('completed_at', endOfMonth.toISOString());

  return data?.reduce((sum, apt) => sum + (apt.actual_cost || apt.price || 0), 0) || 0;
}

export default router;