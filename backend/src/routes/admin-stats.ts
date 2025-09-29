import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { requireSuperAdmin, adminAuditLogger } from '../middleware/admin-auth';
import AdminService from '../services/admin';
import { logger } from '../utils/logger';
import { ApiResponse, PaginatedResponse } from '../types';

const router = Router();

// Apply super admin protection and audit logging to all routes
router.use(requireSuperAdmin);
router.use(adminAuditLogger);

// Validation schemas
const auditLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  adminUserId: z.string().uuid().optional(),
  resourceType: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

/**
 * GET /api/admin/stats/system
 * Get system-wide metrics and statistics
 */
router.get('/system', asyncHandler(async (req: Request, res: Response) => {
  try {
    const adminService = new AdminService();
    const metrics = await adminService.getSystemMetrics();

    const response: ApiResponse<any> = {
      success: true,
      data: metrics,
      message: 'System metrics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting system metrics:', error);
    throw createError('Erro ao obter métricas do sistema', 500);
  }
}));

/**
 * GET /api/admin/stats/revenue
 * Get revenue statistics by subscription tier
 */
router.get('/revenue', asyncHandler(async (req: Request, res: Response) => {
  try {
    const adminService = new AdminService();
    const revenueStats = await adminService.getRevenueStats();

    const response: ApiResponse<any> = {
      success: true,
      data: revenueStats,
      message: 'Revenue statistics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting revenue stats:', error);
    throw createError('Erro ao obter estatísticas de receita', 500);
  }
}));

/**
 * GET /api/admin/stats/activity
 * Get system activity overview (recent actions, trends, etc.)
 */
router.get('/activity', asyncHandler(async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;

    const adminService = new AdminService();

    // Get recent audit logs to analyze activity
    const recentLogs = await adminService.getAuditLogs({
      limit: 1000,
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    });

    // Analyze activity patterns
    const activityByResourceType: Record<string, number> = {};
    const activityByDay: Record<string, number> = {};
    const activeAdmins: Set<string> = new Set();

    recentLogs.data.forEach(log => {
      // Count by resource type
      activityByResourceType[log.resource_type] = (activityByResourceType[log.resource_type] || 0) + 1;

      // Count by day
      const day = log.created_at.split('T')[0];
      activityByDay[day] = (activityByDay[day] || 0) + 1;

      // Track active admins
      activeAdmins.add(log.admin_user_id);
    });

    const activity = {
      period_days: days,
      total_actions: recentLogs.data.length,
      active_admins: activeAdmins.size,
      activity_by_resource_type: activityByResourceType,
      activity_by_day: activityByDay,
      average_actions_per_day: recentLogs.data.length / days
    };

    const response: ApiResponse<any> = {
      success: true,
      data: activity,
      message: 'Activity statistics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting activity stats:', error);
    throw createError('Erro ao obter estatísticas de atividade', 500);
  }
}));

/**
 * GET /api/admin/stats/growth
 * Get growth statistics (new orgs, new users, trends)
 */
router.get('/growth', asyncHandler(async (req: Request, res: Response) => {
  try {
    const adminService = new AdminService();
    const metrics = await adminService.getSystemMetrics();

    // Calculate growth rates
    const growth = {
      new_organizations_last_7_days: metrics.new_orgs_last_7_days || 0,
      new_users_last_7_days: metrics.new_users_last_7_days || 0,
      messages_last_7_days: metrics.messages_last_7_days || 0,
      total_organizations: metrics.active_organizations + metrics.inactive_organizations,
      total_users: metrics.total_active_users,
      growth_rate_orgs: calculateGrowthRate(
        metrics.new_orgs_last_7_days || 0,
        metrics.active_organizations
      ),
      growth_rate_users: calculateGrowthRate(
        metrics.new_users_last_7_days || 0,
        metrics.total_active_users
      )
    };

    const response: ApiResponse<any> = {
      success: true,
      data: growth,
      message: 'Growth statistics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting growth stats:', error);
    throw createError('Erro ao obter estatísticas de crescimento', 500);
  }
}));

/**
 * GET /api/admin/logs
 * Get audit logs with filters
 */
router.get('/logs', asyncHandler(async (req: Request, res: Response) => {
  try {
    const params = auditLogsSchema.parse(req.query);

    const adminService = new AdminService();
    const result = await adminService.getAuditLogs(params);

    const response: PaginatedResponse<any> = {
      success: true,
      data: result.data,
      message: 'Audit logs retrieved successfully',
      timestamp: new Date().toISOString(),
      pagination: result.pagination
    };

    res.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw createError('Parâmetros de busca inválidos', 400);
    }
    logger.error('Error getting audit logs:', error);
    throw createError('Erro ao obter logs de auditoria', 500);
  }
}));

/**
 * GET /api/admin/logs/recent
 * Get recent audit logs (last 100)
 */
router.get('/logs/recent', asyncHandler(async (req: Request, res: Response) => {
  try {
    const adminService = new AdminService();
    const result = await adminService.getAuditLogs({
      page: 1,
      limit: 100
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: result.data,
      message: 'Recent audit logs retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting recent audit logs:', error);
    throw createError('Erro ao obter logs recentes', 500);
  }
}));

/**
 * GET /api/admin/logs/by-admin/:adminUserId
 * Get audit logs for a specific admin
 */
router.get('/logs/by-admin/:adminUserId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { adminUserId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;

    if (!adminUserId) {
      throw createError('ID do admin é obrigatório', 400);
    }

    const adminService = new AdminService();
    const result = await adminService.getAuditLogs({
      adminUserId,
      page,
      limit
    });

    const response: PaginatedResponse<any> = {
      success: true,
      data: result.data,
      message: 'Admin audit logs retrieved successfully',
      timestamp: new Date().toISOString(),
      pagination: result.pagination
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting admin audit logs:', error);
    throw createError('Erro ao obter logs do admin', 500);
  }
}));

/**
 * GET /api/admin/settings
 * Get all system settings
 */
router.get('/settings', asyncHandler(async (req: Request, res: Response) => {
  try {
    const adminService = new AdminService();
    const settings = await adminService.getSystemSettings();

    const response: ApiResponse<any[]> = {
      success: true,
      data: settings,
      message: 'System settings retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting system settings:', error);
    throw createError('Erro ao obter configurações do sistema', 500);
  }
}));

/**
 * PUT /api/admin/settings/:key
 * Update a system setting
 */
router.put('/settings/:key', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const updatedBy = (req as any).user?.id;

    if (!key) {
      throw createError('Chave da configuração é obrigatória', 400);
    }

    if (value === undefined) {
      throw createError('Valor da configuração é obrigatório', 400);
    }

    const adminService = new AdminService();
    const setting = await adminService.updateSystemSetting(key, value, updatedBy);

    logger.info('System setting updated by admin', { key, updatedBy });

    const response: ApiResponse<any> = {
      success: true,
      data: setting,
      message: 'Configuração do sistema atualizada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error updating system setting:', error);
    throw createError('Erro ao atualizar configuração do sistema', 500);
  }
}));

// Helper function to calculate growth rate
function calculateGrowthRate(newItems: number, totalItems: number): number {
  if (totalItems === 0) return 0;
  return (newItems / totalItems) * 100;
}

export default router;