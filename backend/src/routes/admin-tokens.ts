import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { requireSuperAdmin, adminAuditLogger } from '../middleware/admin-auth';
import { SupabaseService } from '../services/supabase';
import { logger } from '../utils/logger';
import { ApiResponse, PaginatedResponse } from '../types';

const router = Router();

// Apply super admin protection and audit logging to all routes
router.use(requireSuperAdmin);
router.use(adminAuditLogger);

const supabaseService = new SupabaseService();

// Validation schemas
const listTokenUsageSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  organizationId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  model: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

/**
 * GET /api/admin/tokens/metrics
 * Get system-wide token usage metrics
 */
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseService.supabase
      .from('admin_token_usage_metrics')
      .select('*')
      .single();

    if (error) throw error;

    const response: ApiResponse<any> = {
      success: true,
      data: data || {},
      message: 'Token usage metrics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting token usage metrics:', error);
    throw createError('Erro ao obter métricas de uso de tokens', 500);
  }
}));

/**
 * GET /api/admin/tokens/by-organization
 * Get token usage aggregated by organization
 */
router.get('/by-organization', asyncHandler(async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    let query = supabaseService.supabase
      .from('admin_token_usage_by_org')
      .select('*', { count: 'exact' });

    // Apply sorting - most tokens used first
    query = query
      .order('total_tokens', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const response: PaginatedResponse<any> = {
      success: true,
      data: data || [],
      message: 'Token usage by organization retrieved successfully',
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
    logger.error('Error getting token usage by organization:', error);
    throw createError('Erro ao obter uso de tokens por organização', 500);
  }
}));

/**
 * GET /api/admin/tokens/by-organization/:organizationId
 * Get detailed token usage for a specific organization
 */
router.get('/by-organization/:organizationId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      throw createError('ID da organização é obrigatório', 400);
    }

    const { data, error } = await supabaseService.supabase
      .from('admin_token_usage_by_org')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) throw error;

    const response: ApiResponse<any> = {
      success: true,
      data: data || null,
      message: 'Organization token usage retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting organization token usage:', error);
    throw createError('Erro ao obter uso de tokens da organização', 500);
  }
}));

/**
 * GET /api/admin/tokens/by-user
 * Get token usage aggregated by user
 */
router.get('/by-user', asyncHandler(async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const organizationId = req.query.organizationId as string;

    let query = supabaseService.supabase
      .from('admin_token_usage_by_user')
      .select('*', { count: 'exact' });

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    // Apply sorting - most tokens used first
    query = query
      .order('total_tokens', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const response: PaginatedResponse<any> = {
      success: true,
      data: data || [],
      message: 'Token usage by user retrieved successfully',
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
    logger.error('Error getting token usage by user:', error);
    throw createError('Erro ao obter uso de tokens por usuário', 500);
  }
}));

/**
 * GET /api/admin/tokens/by-user/:userId
 * Get detailed token usage for a specific user
 */
router.get('/by-user/:userId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw createError('ID do usuário é obrigatório', 400);
    }

    const { data, error } = await supabaseService.supabase
      .from('admin_token_usage_by_user')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const response: ApiResponse<any> = {
      success: true,
      data: data || null,
      message: 'User token usage retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting user token usage:', error);
    throw createError('Erro ao obter uso de tokens do usuário', 500);
  }
}));

/**
 * GET /api/admin/tokens/usage
 * Get raw token usage records with filters
 */
router.get('/usage', asyncHandler(async (req: Request, res: Response) => {
  try {
    const params = listTokenUsageSchema.parse(req.query);

    const page = params.page;
    const limit = params.limit;
    const offset = (page - 1) * limit;

    let query = supabaseService.supabase
      .from('token_usage')
      .select('*', { count: 'exact' });

    // Apply filters
    if (params.organizationId) {
      query = query.eq('organization_id', params.organizationId);
    }

    if (params.userId) {
      query = query.eq('user_id', params.userId);
    }

    if (params.model) {
      query = query.eq('model', params.model);
    }

    if (params.startDate) {
      query = query.gte('created_at', params.startDate);
    }

    if (params.endDate) {
      query = query.lte('created_at', params.endDate);
    }

    // Apply sorting and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const response: PaginatedResponse<any> = {
      success: true,
      data: data || [],
      message: 'Token usage records retrieved successfully',
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
    if (error.name === 'ZodError') {
      throw createError('Parâmetros de busca inválidos', 400);
    }
    logger.error('Error getting token usage records:', error);
    throw createError('Erro ao obter registros de uso de tokens', 500);
  }
}));

/**
 * GET /api/admin/tokens/trends
 * Get token usage trends over time
 */
router.get('/trends', asyncHandler(async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const organizationId = req.query.organizationId as string;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabaseService.supabase
      .from('token_usage')
      .select('created_at, total_tokens, estimated_cost_usd, model')
      .gte('created_at', startDate.toISOString());

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    query = query.order('created_at', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate by day
    const trendsByDay: Record<string, any> = {};

    data?.forEach(record => {
      const day = record.created_at.split('T')[0];

      if (!trendsByDay[day]) {
        trendsByDay[day] = {
          date: day,
          total_tokens: 0,
          total_cost: 0,
          requests: 0,
          by_model: {}
        };
      }

      trendsByDay[day].total_tokens += record.total_tokens;
      trendsByDay[day].total_cost += parseFloat(record.estimated_cost_usd || '0');
      trendsByDay[day].requests += 1;

      // Aggregate by model
      if (!trendsByDay[day].by_model[record.model]) {
        trendsByDay[day].by_model[record.model] = {
          tokens: 0,
          cost: 0,
          requests: 0
        };
      }

      trendsByDay[day].by_model[record.model].tokens += record.total_tokens;
      trendsByDay[day].by_model[record.model].cost += parseFloat(record.estimated_cost_usd || '0');
      trendsByDay[day].by_model[record.model].requests += 1;
    });

    const trends = Object.values(trendsByDay);

    const response: ApiResponse<any[]> = {
      success: true,
      data: trends,
      message: 'Token usage trends retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting token usage trends:', error);
    throw createError('Erro ao obter tendências de uso de tokens', 500);
  }
}));

/**
 * GET /api/admin/tokens/top-consumers
 * Get top token consumers (organizations or users)
 */
router.get('/top-consumers', asyncHandler(async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string || 'organization'; // 'organization' or 'user'
    const period = req.query.period as string || '30d'; // '7d', '30d', 'all'

    let dateFilter = '';
    if (period === '7d') {
      dateFilter = `created_at > NOW() - INTERVAL '7 days'`;
    } else if (period === '30d') {
      dateFilter = `created_at > NOW() - INTERVAL '30 days'`;
    }

    const viewName = type === 'user' ? 'admin_token_usage_by_user' : 'admin_token_usage_by_org';

    const { data, error } = await supabaseService.supabase
      .from(viewName)
      .select('*')
      .order('total_tokens', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const response: ApiResponse<any[]> = {
      success: true,
      data: data || [],
      message: 'Top token consumers retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting top token consumers:', error);
    throw createError('Erro ao obter maiores consumidores de tokens', 500);
  }
}));

export default router;