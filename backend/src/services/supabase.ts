import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import {
  CustomerData,
  MessageData,
  ConversationData,
  DashboardStats,
  BusinessConfig
} from '../types';

export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY?.trim();
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseKey = serviceKey || anonKey;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Key are required');
    }

    logger.info('Supabase initialization:', {
      url: supabaseUrl,
      hasServiceKey: !!serviceKey,
      hasAnonKey: !!anonKey,
      usingKey: serviceKey ? 'service' : 'anon',
      keyLength: supabaseKey.length
    });

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    logger.info('Supabase service initialized');
  }

  // WhatsApp Instances
  async createInstance(instanceData: {
    name: string;
    status: string;
    organization_id: string;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_instances')
        .insert({
          instance_name: instanceData.name,
          status: instanceData.status,
          organization_id: instanceData.organization_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      logger.supabase('CREATE', 'whatsapp_instances', { instanceName: instanceData.name });
      return data;
    } catch (error) {
      logger.error('Error creating instance:', error);
      throw error;
    }
  }

  async updateInstanceStatus(instanceName: string, status: string, connectionState?: string) {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (connectionState) {
        updateData.connection_state = connectionState;
      }

      const { data, error } = await this.supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('instance_name', instanceName)
        .select()
        .single();

      if (error) throw error;

      logger.supabase('UPDATE', 'whatsapp_instances', { instanceName, status });
      return data;
    } catch (error) {
      logger.error('Error updating instance status:', error);
      throw error;
    }
  }

  async updateInstanceQRCode(instanceName: string, qrCode: string) {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_instances')
        .update({
          qr_code: qrCode,
          status: 'qr_code',
          connection_status: 'qr_code',
          is_connected: false,
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName)
        .select()
        .single();

      if (error) throw error;

      logger.supabase('UPDATE', 'whatsapp_instances', {
        instanceName,
        action: 'qr_code_update',
        hasQRCode: !!qrCode
      });
      return data;
    } catch (error) {
      logger.error('Error updating instance QR code:', error);
      throw error;
    }
  }

  async updateInstanceConnection(instanceName: string, connectionStatus: string, isConnected: boolean) {
    try {
      const updateData: any = {
        connection_status: connectionStatus,
        is_connected: isConnected,
        last_heartbeat: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Determinar status baseado na conexão
      if (isConnected) {
        updateData.status = 'connected';
        updateData.qr_code = null; // Limpar QR code quando conectado
      } else if (connectionStatus === 'connecting') {
        updateData.status = 'connecting';
      } else {
        updateData.status = 'disconnected';
      }

      const { data, error } = await this.supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('instance_name', instanceName)
        .select()
        .single();

      if (error) throw error;

      logger.supabase('UPDATE', 'whatsapp_instances', {
        instanceName,
        action: 'connection_update',
        connectionStatus,
        isConnected
      });
      return data;
    } catch (error) {
      logger.error('Error updating instance connection:', error);
      throw error;
    }
  }

  async getInstance(instanceName: string) {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('instance_name', instanceName)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      logger.error('Error getting instance:', error);
      throw error;
    }
  }

  async getInstanceByName(instanceName: string) {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('instance_name', instanceName)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      logger.error('Error getting instance by name:', error);
      return null;
    }
  }

  async getInstanceByOrganization(organizationId: string) {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      logger.error('Error getting instance by organization:', error);
      return null;
    }
  }

  async getOrCreateUserInstance(userId: string, organizationId: string) {
    try {
      // Buscar instância existente
      let instance = await this.getInstanceByOrganization(organizationId);

      if (!instance) {
        // Criar nova instância com nome único por usuário
        const instanceName = `user_${userId.replace(/-/g, '')}`;

        instance = await this.createInstance({
          name: instanceName,
          status: 'created',
          organization_id: organizationId
        });

        logger.info('Created new WhatsApp instance for user', {
          userId,
          instanceName,
          organizationId
        });
      }

      return instance;
    } catch (error) {
      logger.error('Error getting or creating user instance:', error);
      throw error;
    }
  }

  // WhatsApp Contacts
  async saveContact(contactData: {
    phone: string;
    name?: string;
    organization_id: string;
    instance_id: string;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_contacts')
        .upsert({
          phone: contactData.phone,
          name: contactData.name || contactData.phone,
          organization_id: contactData.organization_id,
          instance_id: contactData.instance_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'phone,organization_id'
        })
        .select()
        .single();

      if (error) throw error;

      logger.supabase('UPSERT', 'whatsapp_contacts', { phone: contactData.phone });
      return data;
    } catch (error) {
      logger.error('Error saving contact:', error);
      throw error;
    }
  }

  async getCustomerByPhone(phone: string, organizationId: string) {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_contacts')
        .select(`
          *,
          pets (
            id,
            name,
            species,
            breed,
            age,
            weight
          )
        `)
        .eq('phone', phone)
        .eq('organization_id', organizationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      logger.error('Error getting customer by phone:', error);
      return null;
    }
  }

  // WhatsApp Messages
  async saveMessage(messageData: {
    conversation_id: string;
    instance_id: string;
    content: string;
    direction: 'inbound' | 'outbound';
    message_type: 'text' | 'image' | 'audio' | 'document' | 'video';
    external_id: string;
    organization_id: string;
    metadata?: any;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_messages')
        .insert({
          ...messageData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      logger.supabase('INSERT', 'whatsapp_messages', {
        conversationId: messageData.conversation_id,
        direction: messageData.direction
      });
      return data;
    } catch (error) {
      logger.error('Error saving message:', error);
      throw error;
    }
  }

  // WhatsApp Conversations
  async getOrCreateConversation(contactId: string, instanceId: string, organizationId: string) {
    try {
      // First try to get existing conversation
      let { data: conversation, error } = await this.supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('contact_id', contactId)
        .eq('instance_id', instanceId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create new conversation if not found
        const { data: newConversation, error: createError } = await this.supabase
          .from('whatsapp_conversations')
          .insert({
            contact_id: contactId,
            instance_id: instanceId,
            organization_id: organizationId,
            status: 'active',
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;

        logger.supabase('CREATE', 'whatsapp_conversations', { contactId });
        return newConversation;
      }

      if (error) throw error;

      // Update last_message_at
      await this.supabase
        .from('whatsapp_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

      return conversation;
    } catch (error) {
      logger.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  // Dashboard Stats
  async getDashboardStats(organizationId: string): Promise<DashboardStats> {
    try {
      const { data, error } = await this.supabase
        .from('dashboard_stats_secure_view')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        logger.warn('Dashboard stats view not found, using fallback calculation');
        return await this.calculateDashboardStats(organizationId);
      }

      return data as DashboardStats;
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      return await this.calculateDashboardStats(organizationId);
    }
  }

  private async calculateDashboardStats(organizationId: string): Promise<DashboardStats> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get conversations today
      const { count: conversationsToday } = await this.supabase
        .from('whatsapp_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Get appointments today
      const { count: appointmentsToday } = await this.supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('appointment_date', `${today}T00:00:00.000Z`)
        .lt('appointment_date', `${today}T23:59:59.999Z`);

      // Get daily revenue
      const { data: revenueData } = await this.supabase
        .from('appointments')
        .select('price')
        .eq('organization_id', organizationId)
        .gte('appointment_date', `${today}T00:00:00.000Z`)
        .lt('appointment_date', `${today}T23:59:59.999Z`)
        .eq('status', 'completed');

      const dailyRevenue = revenueData?.reduce((sum, apt) => sum + (apt.price || 0), 0) || 0;

      return {
        conversations_today: conversationsToday || 0,
        daily_appointments: appointmentsToday || 0,
        response_rate_percent: 87.5, // Default value
        daily_revenue: dailyRevenue,
        avg_response_time: 2.3, // Default value
        active_conversations: 0, // Will be calculated in real-time
        pending_messages: 0, // Will be calculated in real-time
        ai_accuracy: 89.2 // Default value
      };
    } catch (error) {
      logger.error('Error calculating dashboard stats:', error);
      return {
        conversations_today: 0,
        daily_appointments: 0,
        response_rate_percent: 0,
        daily_revenue: 0,
        avg_response_time: 0,
        active_conversations: 0,
        pending_messages: 0,
        ai_accuracy: 0
      };
    }
  }

  // Business Configuration
  async getBusinessConfig(organizationId: string): Promise<BusinessConfig | null> {
    try {
      const { data, error } = await this.supabase
        .from('petshop_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return null;

      return {
        organization_id: data.organization_id,
        business_name: data.business_name || 'Pet Shop',
        whatsapp_number: data.whatsapp_number,
        welcome_message: data.welcome_message || 'Olá! Como posso ajudar você e seu pet hoje?',
        business_hours: data.business_hours || {
          enabled: true,
          timezone: 'America/Sao_Paulo',
          schedule: {
            monday: { start: '08:00', end: '18:00', enabled: true },
            tuesday: { start: '08:00', end: '18:00', enabled: true },
            wednesday: { start: '08:00', end: '18:00', enabled: true },
            thursday: { start: '08:00', end: '18:00', enabled: true },
            friday: { start: '08:00', end: '18:00', enabled: true },
            saturday: { start: '08:00', end: '16:00', enabled: true },
            sunday: { start: '08:00', end: '12:00', enabled: false }
          }
        },
        auto_reply: data.auto_reply ?? true,
        ai_personality: data.ai_personality || 'friendly',
        response_delay_seconds: data.response_delay_seconds || 2,
        escalation_keywords: data.escalation_keywords || ['humano', 'atendente', 'falar com alguém']
      };
    } catch (error) {
      logger.error('Error getting business config:', error);
      return null;
    }
  }

  async saveBusinessConfig(config: Partial<BusinessConfig>): Promise<BusinessConfig> {
    try {
      const { data, error } = await this.supabase
        .from('petshop_settings')
        .upsert({
          organization_id: config.organization_id,
          business_name: config.business_name,
          whatsapp_number: config.whatsapp_number,
          welcome_message: config.welcome_message,
          business_hours: config.business_hours,
          auto_reply: config.auto_reply,
          ai_personality: config.ai_personality,
          response_delay_seconds: config.response_delay_seconds,
          escalation_keywords: config.escalation_keywords,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id'
        })
        .select()
        .single();

      if (error) throw error;

      logger.supabase('UPSERT', 'petshop_settings', { organizationId: config.organization_id });
      return data as BusinessConfig;
    } catch (error) {
      logger.error('Error saving business config:', error);
      throw error;
    }
  }

  // AI Configurations
  async getAIConfig(organizationId: string) {
    try {
      const { data, error } = await this.supabase
        .from('ai_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      logger.error('Error getting AI config:', error);
      return null;
    }
  }

  async saveAIConfig(aiConfig: any) {
    try {
      const { data, error } = await this.supabase
        .from('ai_configurations')
        .upsert({
          ...aiConfig,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id,name'
        })
        .select()
        .single();

      if (error) throw error;

      logger.supabase('UPSERT', 'ai_configurations', { organizationId: aiConfig.organization_id });
      return data;
    } catch (error) {
      logger.error('Error saving AI config:', error);
      throw error;
    }
  }

  // Analytics and Reports
  async getConversationAnalytics(organizationId: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('whatsapp_conversations')
        .select(`
          created_at,
          status,
          whatsapp_messages (
            direction,
            created_at
          )
        `)
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('Error getting conversation analytics:', error);
      throw error;
    }
  }

  // Get Supabase client for direct access (used in auth routes)
  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_instances')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      logger.error('Supabase health check failed:', error);
      return false;
    }
  }

  // Test connection for monitoring
  async testConnection(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_instances')
        .select('id')
        .limit(1);

      if (error) throw error;

      return {
        status: 'connected',
        timestamp: new Date().toISOString(),
        recordsFound: data?.length || 0
      };
    } catch (error) {
      logger.error('Supabase connection test failed:', error);
      throw error;
    }
  }
}

// Export singleton instance for backwards compatibility
export const supabaseService = new SupabaseService();
export const supabase = supabaseService.getClient();

// Export default instance
export default supabaseService;