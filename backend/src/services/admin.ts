import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { SupabaseService } from './supabase';

/**
 * AdminService - Serviço para operações administrativas
 * Gerencia organizações, usuários, subscrições e métricas do sistema
 */
export class AdminService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseService = new SupabaseService();
    this.supabase = supabaseService.supabase;
  }

  // ==========================================
  // ORGANIZATIONS MANAGEMENT
  // ==========================================

  /**
   * Listar todas as organizações com filtros e paginação
   */
  async listOrganizations(params: {
    page?: number;
    limit?: number;
    search?: string;
    tier?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 50;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('admin_organization_stats')
        .select('*', { count: 'exact' });

      // Apply filters
      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,slug.ilike.%${params.search}%`);
      }

      if (params.tier) {
        query = query.eq('subscription_tier', params.tier);
      }

      if (params.isActive !== undefined) {
        query = query.eq('is_active', params.isActive);
      }

      // Apply sorting
      const sortBy = params.sortBy || 'created_at';
      const sortOrder = params.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('AdminService: Error listing organizations:', error);
      throw error;
    }
  }

  /**
   * Obter detalhes completos de uma organização
   */
  async getOrganization(organizationId: string) {
    try {
      const { data, error } = await this.supabase
        .from('admin_organization_stats')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) throw error;

      // Get organization users
      const { data: users } = await this.supabase
        .from('profiles')
        .select('user_id, email, full_name, role, is_active, created_at, last_login_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      return {
        ...data,
        users: users || []
      };
    } catch (error) {
      logger.error('AdminService: Error getting organization:', error);
      throw error;
    }
  }

  /**
   * Criar nova organização
   */
  async createOrganization(orgData: {
    name: string;
    subscription_tier: 'free' | 'pro' | 'enterprise';
    is_active?: boolean;
  }) {
    try {
      const slug = orgData.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data, error } = await this.supabase
        .from('organizations')
        .insert({
          name: orgData.name,
          slug,
          subscription_tier: orgData.subscription_tier,
          is_active: orgData.is_active !== undefined ? orgData.is_active : true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('AdminService: Organization created', { organizationId: data.id });
      return data;
    } catch (error) {
      logger.error('AdminService: Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Atualizar organização
   */
  async updateOrganization(organizationId: string, updates: {
    name?: string;
    subscription_tier?: 'free' | 'pro' | 'enterprise';
    is_active?: boolean;
  }) {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name) {
        updateData.name = updates.name;
        updateData.slug = updates.name.toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      if (updates.subscription_tier) {
        updateData.subscription_tier = updates.subscription_tier;
      }

      if (updates.is_active !== undefined) {
        updateData.is_active = updates.is_active;
      }

      const { data, error } = await this.supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organizationId)
        .select()
        .single();

      if (error) throw error;

      logger.info('AdminService: Organization updated', { organizationId });
      return data;
    } catch (error) {
      logger.error('AdminService: Error updating organization:', error);
      throw error;
    }
  }

  /**
   * Ativar/Desativar organização
   */
  async toggleOrganizationStatus(organizationId: string, isActive: boolean) {
    return this.updateOrganization(organizationId, { is_active: isActive });
  }

  // ==========================================
  // USERS MANAGEMENT
  // ==========================================

  /**
   * Listar todos os usuários (cross-organization)
   */
  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    organizationId?: string;
    role?: string;
    isActive?: boolean;
  }) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 50;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('admin_user_stats')
        .select('*', { count: 'exact' });

      // Apply filters
      if (params.search) {
        query = query.or(`email.ilike.%${params.search}%,full_name.ilike.%${params.search}%`);
      }

      if (params.organizationId) {
        query = query.eq('organization_id', params.organizationId);
      }

      if (params.role) {
        query = query.eq('role', params.role);
      }

      if (params.isActive !== undefined) {
        query = query.eq('is_active', params.isActive);
      }

      // Apply sorting and pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('AdminService: Error listing users:', error);
      throw error;
    }
  }

  /**
   * Obter detalhes de um usuário
   */
  async getUser(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('admin_user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('AdminService: Error getting user:', error);
      throw error;
    }
  }

  /**
   * Atualizar role de um usuário
   */
  async updateUserRole(userId: string, newRole: 'user' | 'admin' | 'super_admin') {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      logger.info('AdminService: User role updated', { userId, newRole });
      return data;
    } catch (error) {
      logger.error('AdminService: Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Mover usuário para outra organização
   */
  async moveUserToOrganization(userId: string, newOrganizationId: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          organization_id: newOrganizationId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      logger.info('AdminService: User moved to new organization', { userId, newOrganizationId });
      return data;
    } catch (error) {
      logger.error('AdminService: Error moving user:', error);
      throw error;
    }
  }

  /**
   * Ativar/Desativar usuário
   */
  async toggleUserStatus(userId: string, isActive: boolean) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      logger.info('AdminService: User status toggled', { userId, isActive });
      return data;
    } catch (error) {
      logger.error('AdminService: Error toggling user status:', error);
      throw error;
    }
  }

  // ==========================================
  // SYSTEM METRICS & STATS
  // ==========================================

  /**
   * Obter métricas gerais do sistema
   */
  async getSystemMetrics() {
    try {
      const { data, error } = await this.supabase
        .from('admin_system_metrics')
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('AdminService: Error getting system metrics:', error);
      throw error;
    }
  }

  /**
   * Obter logs de auditoria
   */
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    adminUserId?: string;
    resourceType?: string;
    organizationId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 100;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (params.adminUserId) {
        query = query.eq('admin_user_id', params.adminUserId);
      }

      if (params.resourceType) {
        query = query.eq('resource_type', params.resourceType);
      }

      if (params.organizationId) {
        query = query.eq('organization_id', params.organizationId);
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

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('AdminService: Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Obter configurações do sistema
   */
  async getSystemSettings() {
    try {
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('AdminService: Error getting system settings:', error);
      throw error;
    }
  }

  /**
   * Atualizar configuração do sistema
   */
  async updateSystemSetting(key: string, value: any, updatedBy: string) {
    try {
      const { data, error } = await this.supabase
        .from('system_settings')
        .update({
          value,
          updated_by: updatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('key', key)
        .select()
        .single();

      if (error) throw error;

      logger.info('AdminService: System setting updated', { key });
      return data;
    } catch (error) {
      logger.error('AdminService: Error updating system setting:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de receita por plano
   */
  async getRevenueStats() {
    try {
      // This would typically integrate with a billing system (Stripe, etc.)
      // For now, return organization count by tier
      const { data, error } = await this.supabase
        .from('organizations')
        .select('subscription_tier, is_active');

      if (error) throw error;

      const stats = {
        free: 0,
        pro: 0,
        enterprise: 0,
        total_active: 0
      };

      data?.forEach(org => {
        if (org.is_active) {
          stats.total_active++;
          stats[org.subscription_tier as keyof typeof stats]++;
        }
      });

      return stats;
    } catch (error) {
      logger.error('AdminService: Error getting revenue stats:', error);
      throw error;
    }
  }
}

export default AdminService;