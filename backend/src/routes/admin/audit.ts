import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../../middleware/errorHandler';
import { requirePermission } from '../../middleware/permissions';
import { SupabaseService } from '../../services/supabase';
import { logger } from '../../utils/logger';
import { PaginatedResponse } from '../../types';

const router = Router();
let supabaseService: SupabaseService;

const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
};

// =====================================================
// GET /admin/audit - List audit logs with filters
// =====================================================
router.get('/', requirePermission('audit.read'), asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 50,
    userId,
    action,
    entityType,
    severity,
    startDate,
    endDate
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  try {
    let query = getSupabaseService().supabase
      .from('audit_logs')
      .select(`
        id,
        organization_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        severity,
        status,
        error_message,
        metadata,
        created_at,
        profiles!audit_logs_user_id_fkey (
          id,
          email,
          full_name
        )
      `, { count: 'exact' });

    // Filter by organization (non-super admins)
    if (req.user?.role !== 'super_admin') {
      query = query.eq('organization_id', req.user?.organizationId);
    }

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination and ordering
    const { data: logs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    const response: PaginatedResponse<any> = {
      success: true,
      data: logs || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error fetching audit logs:', error);
    throw createError('Erro ao buscar logs de auditoria', 500);
  }
}));

// =====================================================
// GET /admin/audit/:id - Get specific audit log
// =====================================================
router.get('/:id', requirePermission('audit.read'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    let query = getSupabaseService().supabase
      .from('audit_logs')
      .select(`
        *,
        profiles!audit_logs_user_id_fkey (
          id,
          email,
          full_name,
          roles (
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    const { data: log, error } = await query;

    if (error) throw error;
    if (!log) throw createError('Log não encontrado', 404);

    // Check organization access
    if (req.user?.role !== 'super_admin' && log.organization_id !== req.user?.organizationId) {
      throw createError('Acesso negado', 403);
    }

    res.json({
      success: true,
      data: log,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Error fetching audit log:', error);
    throw error;
  }
}));

// =====================================================
// GET /admin/audit/stats - Get audit statistics
// =====================================================
router.get('/stats/summary', requirePermission('audit.read'), asyncHandler(async (req: Request, res: Response) => {
  const { period = '7d' } = req.query;

  try {
    // Calculate start date based on period
    const now = new Date();
    const startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    let query = getSupabaseService().supabase
      .from('audit_logs')
      .select('action, entity_type, severity, status, created_at')
      .gte('created_at', startDate.toISOString());

    // Filter by organization
    if (req.user?.role !== 'super_admin') {
      query = query.eq('organization_id', req.user?.organizationId);
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: logs?.length || 0,
      byAction: {} as Record<string, number>,
      byEntityType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      timeline: [] as { date: string; count: number }[]
    };

    logs?.forEach(log => {
      // Count by action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // Count by entity type
      stats.byEntityType[log.entity_type] = (stats.byEntityType[log.entity_type] || 0) + 1;

      // Count by severity
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;

      // Count by status
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
    });

    // Generate timeline
    const timelineMap = new Map<string, number>();
    logs?.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
    });

    stats.timeline = Array.from(timelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: stats,
      period,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Error calculating audit stats:', error);
    throw createError('Erro ao calcular estatísticas', 500);
  }
}));

// =====================================================
// POST /admin/audit/export - Export audit logs
// =====================================================
router.post('/export', requirePermission('audit.read'), asyncHandler(async (req: Request, res: Response) => {
  const { format = 'json', filters = {} } = req.body;

  try {
    let query = getSupabaseService().supabase
      .from('audit_logs')
      .select(`
        id,
        organization_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        severity,
        status,
        created_at,
        profiles!audit_logs_user_id_fkey (
          email,
          full_name
        )
      `);

    // Filter by organization
    if (req.user?.role !== 'super_admin') {
      query = query.eq('organization_id', req.user?.organizationId);
    }

    // Apply filters
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data: logs, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['Date', 'User', 'Action', 'Entity Type', 'Entity ID', 'Severity', 'Status', 'IP Address'];
      const rows = logs?.map(log => [
        log.created_at,
        (log as any).profiles?.email || 'Unknown',
        log.action,
        log.entity_type,
        log.entity_id || '',
        log.severity,
        log.status,
        log.ip_address || ''
      ]) || [];

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString()}.csv`);
      res.send(csv);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString()}.json`);
      res.json({
        success: true,
        data: logs,
        exportedAt: new Date().toISOString(),
        count: logs?.length || 0
      });
    }
  } catch (error: any) {
    logger.error('Error exporting audit logs:', error);
    throw createError('Erro ao exportar logs', 500);
  }
}));

export default router;
