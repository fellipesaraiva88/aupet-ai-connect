import { SupabaseService } from '../supabase';
import { logger } from '../../utils/logger';

export interface AuditLogEntry {
  organizationId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  status?: 'success' | 'failure';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export class AuditLoggerService {
  private supabase: SupabaseService;

  constructor() {
    this.supabase = new SupabaseService();
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await this.supabase.supabase
        .from('audit_logs')
        .insert({
          organization_id: entry.organizationId,
          user_id: entry.userId,
          action: entry.action,
          entity_type: entry.entityType,
          entity_id: entry.entityId,
          old_values: entry.oldValues,
          new_values: entry.newValues,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          severity: entry.severity || 'info',
          status: entry.status || 'success',
          error_message: entry.errorMessage,
          metadata: entry.metadata || {},
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.error('Failed to write audit log:', error);
      }
    } catch (error) {
      logger.error('Error in audit logger:', error);
    }
  }

  /**
   * Log user authentication events
   */
  async logAuth(
    action: 'login' | 'logout' | 'failed_login' | 'password_reset',
    userId?: string,
    email?: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true
  ): Promise<void> {
    await this.log({
      userId,
      action: `auth.${action}`,
      entityType: 'user',
      entityId: userId,
      newValues: { email },
      ipAddress,
      userAgent,
      severity: success ? 'info' : 'warning',
      status: success ? 'success' : 'failure'
    });
  }

  /**
   * Log user CRUD operations
   */
  async logUserOperation(
    action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate',
    userId: string,
    performedBy: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    organizationId?: string
  ): Promise<void> {
    await this.log({
      organizationId,
      userId: performedBy,
      action: `user.${action}`,
      entityType: 'user',
      entityId: userId,
      oldValues,
      newValues,
      severity: action === 'delete' ? 'warning' : 'info'
    });
  }

  /**
   * Log organization operations
   */
  async logOrganizationOperation(
    action: 'create' | 'update' | 'delete' | 'suspend' | 'activate',
    organizationId: string,
    performedBy: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    await this.log({
      organizationId,
      userId: performedBy,
      action: `organization.${action}`,
      entityType: 'organization',
      entityId: organizationId,
      oldValues,
      newValues,
      severity: ['delete', 'suspend'].includes(action) ? 'warning' : 'info'
    });
  }

  /**
   * Log role and permission changes
   */
  async logRoleOperation(
    action: 'create' | 'update' | 'delete' | 'assign' | 'revoke',
    roleId: string,
    performedBy: string,
    targetUserId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    organizationId?: string
  ): Promise<void> {
    await this.log({
      organizationId,
      userId: performedBy,
      action: `role.${action}`,
      entityType: 'role',
      entityId: roleId,
      oldValues,
      newValues,
      metadata: { targetUserId },
      severity: 'warning' // Role changes are security-sensitive
    });
  }

  /**
   * Log settings changes
   */
  async logSettingsChange(
    settingKey: string,
    oldValue: any,
    newValue: any,
    performedBy: string,
    organizationId?: string
  ): Promise<void> {
    await this.log({
      organizationId,
      userId: performedBy,
      action: 'settings.update',
      entityType: 'settings',
      entityId: settingKey,
      oldValues: { [settingKey]: oldValue },
      newValues: { [settingKey]: newValue },
      severity: 'info'
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    event: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    userId?: string,
    organizationId?: string,
    details?: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      organizationId,
      userId,
      action: `security.${event}`,
      entityType: 'security',
      severity,
      metadata: details,
      ipAddress
    });
  }

  /**
   * Log API errors
   */
  async logError(
    error: Error,
    context: string,
    userId?: string,
    organizationId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      organizationId,
      userId,
      action: `error.${context}`,
      entityType: 'error',
      severity: 'error',
      status: 'failure',
      errorMessage: error.message,
      metadata: {
        ...metadata,
        stack: error.stack
      }
    });
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters: {
    organizationId?: string;
    userId?: string;
    action?: string;
    entityType?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = this.supabase.supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

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

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

      if (error) throw error;

      return { data, count };
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Clean old audit logs (retention policy)
   */
  async cleanOldLogs(retentionDays: number = 180): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data, error } = await this.supabase.supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;

      const deletedCount = data?.length || 0;
      logger.info(`Cleaned ${deletedCount} old audit logs (older than ${retentionDays} days)`);

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning old audit logs:', error);
      throw error;
    }
  }
}

// Singleton instance
export const auditLogger = new AuditLoggerService();
