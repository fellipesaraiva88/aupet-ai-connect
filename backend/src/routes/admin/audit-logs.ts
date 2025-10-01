import { Router, Request, Response } from 'express';
import { supabase } from '../../services/supabase';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/admin/audit-logs - List audit logs with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      user_id,
      action,
      resource_type,
      start_date,
      end_date,
      search
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name,
          role
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    // Apply filters
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (resource_type) {
      query = query.eq('resource_type', resource_type);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    if (search) {
      query = query.or(`action.ilike.%${search}%,resource_type.ilike.%${search}%`);
    }

    const { data: logs, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error: any) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
});

// GET /api/admin/audit-logs/stats - Get audit log statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('audit_logs')
      .select('action, resource_type, created_at');

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total_logs: logs?.length || 0,
      by_action: {} as Record<string, number>,
      by_resource_type: {} as Record<string, number>,
      by_date: {} as Record<string, number>,
    };

    logs?.forEach(log => {
      // Count by action
      stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;

      // Count by resource type
      stats.by_resource_type[log.resource_type] = (stats.by_resource_type[log.resource_type] || 0) + 1;

      // Count by date
      const date = new Date(log.created_at).toISOString().split('T')[0];
      stats.by_date[date] = (stats.by_date[date] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Error fetching audit log stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log statistics'
    });
  }
});

// GET /api/admin/audit-logs/:id - Get specific audit log
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: log, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name,
          role
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error: any) {
    logger.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log'
    });
  }
});

// POST /api/admin/audit-logs/export - Export audit logs
router.post('/export', async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      action,
      resource_type,
      start_date,
      end_date,
      format = 'json'
    } = req.body;

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (resource_type) {
      query = query.eq('resource_type', resource_type);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    // Log the export action
    await supabase.from('audit_logs').insert({
      user_id: (req as any).user?.id,
      action: 'audit_logs.export',
      resource_type: 'audit_log',
      details: { filters: { user_id, action, resource_type, start_date, end_date }, format },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    if (format === 'csv') {
      // Convert to CSV
      const csvHeader = 'ID,User,Action,Resource Type,Resource ID,IP Address,Created At\n';
      const csvRows = logs?.map(log =>
        `${log.id},${(log as any).profiles?.email || 'N/A'},${log.action},${log.resource_type},${log.resource_id || 'N/A'},${log.ip_address || 'N/A'},${log.created_at}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      res.send(csvHeader + csvRows);
    } else {
      res.json({
        success: true,
        data: logs,
        count: logs?.length || 0
      });
    }
  } catch (error: any) {
    logger.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs'
    });
  }
});

export default router;
