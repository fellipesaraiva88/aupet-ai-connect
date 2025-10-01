import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  severity: 'info' | 'warning' | 'error';
  status: 'success' | 'failed';
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface AuditLogFilters {
  organizationId?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  severity?: 'info' | 'warning' | 'error';
  status?: 'success' | 'failed';
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  const queryClient = useQueryClient();

  const {
    data: logs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:profiles(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.organizationId) {
        query = query.eq('organization_id', filters.organizationId);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      // Apply limit (default: 100)
      query = query.limit(filters.limit || 100);

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    },
  });

  // Get audit log stats
  const {
    data: stats,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ['audit-logs-stats', filters.organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('severity, status, action', { count: 'exact' })
        .eq('organization_id', filters.organizationId || '');

      if (error) throw error;

      // Calculate stats
      const total = data.length;
      const byStatus = {
        success: data.filter(log => log.status === 'success').length,
        failed: data.filter(log => log.status === 'failed').length,
      };
      const bySeverity = {
        info: data.filter(log => log.severity === 'info').length,
        warning: data.filter(log => log.severity === 'warning').length,
        error: data.filter(log => log.severity === 'error').length,
      };
      const byAction = data.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total,
        byStatus,
        bySeverity,
        byAction,
      };
    },
    enabled: !!filters.organizationId,
  });

  // Get recent activity
  const {
    data: recentActivity,
    isLoading: isLoadingRecent,
  } = useQuery({
    queryKey: ['audit-logs-recent', filters.organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:profiles(id, full_name, email)
        `)
        .eq('organization_id', filters.organizationId || '')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as AuditLog[];
    },
    enabled: !!filters.organizationId,
  });

  // Export logs
  const exportLogs = async (format: 'json' | 'csv' = 'json') => {
    if (!logs) return;

    if (format === 'json') {
      const dataStr = JSON.stringify(logs, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `audit-logs-${Date.now()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = ['Data/Hora', 'Usuário', 'Ação', 'Entidade', 'Status', 'Severidade'];
      const csvRows = [
        headers.join(','),
        ...logs.map(log => [
          new Date(log.created_at).toLocaleString(),
          log.user?.email || 'Sistema',
          log.action,
          log.entity_type,
          log.status,
          log.severity,
        ].join(','))
      ];

      const csvStr = csvRows.join('\n');
      const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvStr);
      const exportFileDefaultName = `audit-logs-${Date.now()}.csv`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  return {
    logs,
    stats,
    recentActivity,
    isLoading,
    isLoadingStats,
    isLoadingRecent,
    error,
    refetch,
    exportLogs,
  };
}
