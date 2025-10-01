import { SupabaseService } from './supabase';
import { WebSocketService } from './websocket';
import { logger } from '../utils/logger';

export type HandoffHandler = 'ai' | 'human' | 'queue';
export type HandoffReason = 'manual' | 'auto' | 'keyword' | 'low_confidence' | 'escalation' | 'urgent';

interface HandoffStatus {
  conversationId: string;
  currentHandler: HandoffHandler;
  aiHandoffEnabled: boolean;
  needsHumanAttention: boolean;
  lastHandedOffAt?: string;
  handedOffBy?: string;
}

interface TransferOptions {
  reason: string;
  triggeredBy: 'manual' | 'auto' | 'keyword';
  userId?: string;
  notifyCustomer?: boolean;
}

export class HandoffManager {
  private supabaseService: SupabaseService;
  private wsService?: WebSocketService;

  constructor(wsService?: WebSocketService) {
    this.supabaseService = new SupabaseService();
    this.wsService = wsService;
  }

  /**
   * Verifica o status atual do handoff para uma conversa
   */
  async getHandoffStatus(conversationId: string): Promise<HandoffStatus | null> {
    try {
      const { data: conversation, error } = await this.supabaseService.supabase
        .from('whatsapp_conversations')
        .select('id, ai_handoff_enabled, current_handler, needs_human_attention, handed_off_at, handed_off_by')
        .eq('id', conversationId)
        .single();

      if (error || !conversation) {
        logger.error('Error getting handoff status:', error);
        return null;
      }

      return {
        conversationId: conversation.id,
        currentHandler: conversation.current_handler || 'ai',
        aiHandoffEnabled: conversation.ai_handoff_enabled !== false,
        needsHumanAttention: conversation.needs_human_attention || false,
        lastHandedOffAt: conversation.handed_off_at,
        handedOffBy: conversation.handed_off_by
      };
    } catch (error) {
      logger.error('Error in getHandoffStatus:', error);
      return null;
    }
  }

  /**
   * Ativa a IA para uma conversa (desativa atendimento humano)
   */
  async enableAI(conversationId: string, userId?: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('whatsapp_conversations')
        .update({
          ai_handoff_enabled: true,
          current_handler: 'ai',
          needs_human_attention: false,
          handed_off_at: new Date().toISOString(),
          handed_off_by: userId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select('organization_id')
        .single();

      if (error) {
        logger.error('Error enabling AI:', error);
        return false;
      }

      // Registrar no histórico
      await this.recordHandoffHistory(conversationId, 'human', 'ai', 'Manual activation', 'manual');

      // Notificar via WebSocket
      if (this.wsService && data) {
        this.wsService.emit('handoff:enabled', {
          conversationId,
          handler: 'ai',
          timestamp: new Date().toISOString()
        }, data.organization_id);
      }

      logger.info('AI enabled for conversation', { conversationId, userId });
      return true;
    } catch (error) {
      logger.error('Error in enableAI:', error);
      return false;
    }
  }

  /**
   * Desativa a IA para uma conversa (ativa atendimento humano)
   */
  async disableAI(conversationId: string, userId?: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('whatsapp_conversations')
        .update({
          ai_handoff_enabled: false,
          current_handler: 'human',
          needs_human_attention: true,
          handed_off_at: new Date().toISOString(),
          handed_off_by: userId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select('organization_id')
        .single();

      if (error) {
        logger.error('Error disabling AI:', error);
        return false;
      }

      // Registrar no histórico
      await this.recordHandoffHistory(conversationId, 'ai', 'human', 'Manual deactivation', 'manual');

      // Notificar via WebSocket
      if (this.wsService && data) {
        this.wsService.emit('handoff:disabled', {
          conversationId,
          handler: 'human',
          timestamp: new Date().toISOString()
        }, data.organization_id);
      }

      logger.info('AI disabled for conversation', { conversationId, userId });
      return true;
    } catch (error) {
      logger.error('Error in disableAI:', error);
      return false;
    }
  }

  /**
   * Transfere conversa de IA para humano
   */
  async transferToHuman(
    conversationId: string,
    options: TransferOptions
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('whatsapp_conversations')
        .update({
          current_handler: 'human',
          needs_human_attention: true,
          ai_handoff_enabled: false,
          handed_off_at: new Date().toISOString(),
          handed_off_by: options.userId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select('organization_id, instance_id, contact_id')
        .single();

      if (error) {
        logger.error('Error transferring to human:', error);
        return false;
      }

      // Registrar no histórico
      await this.recordHandoffHistory(
        conversationId,
        'ai',
        'human',
        options.reason,
        options.triggeredBy
      );

      // Enviar mensagem de transição para o cliente (se habilitado)
      if (options.notifyCustomer !== false && data) {
        await this.sendHandoffMessage(data.instance_id, conversationId, 'to_human');
      }

      // Notificar via WebSocket
      if (this.wsService && data) {
        this.wsService.emit('handoff:transferred', {
          conversationId,
          from: 'ai',
          to: 'human',
          reason: options.reason,
          timestamp: new Date().toISOString()
        }, data.organization_id);

        // Notificar que precisa atenção humana
        this.wsService.emit('human:required', {
          conversationId,
          reason: options.reason,
          timestamp: new Date().toISOString()
        }, data.organization_id);
      }

      logger.info('Conversation transferred to human', {
        conversationId,
        reason: options.reason,
        triggeredBy: options.triggeredBy
      });

      return true;
    } catch (error) {
      logger.error('Error in transferToHuman:', error);
      return false;
    }
  }

  /**
   * Transfere conversa de humano para IA
   */
  async transferToAI(
    conversationId: string,
    options: Omit<TransferOptions, 'notifyCustomer'>
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('whatsapp_conversations')
        .update({
          current_handler: 'ai',
          needs_human_attention: false,
          ai_handoff_enabled: true,
          handed_off_at: new Date().toISOString(),
          handed_off_by: options.userId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select('organization_id')
        .single();

      if (error) {
        logger.error('Error transferring to AI:', error);
        return false;
      }

      // Registrar no histórico
      await this.recordHandoffHistory(
        conversationId,
        'human',
        'ai',
        options.reason,
        options.triggeredBy
      );

      // Notificar via WebSocket
      if (this.wsService && data) {
        this.wsService.emit('handoff:transferred', {
          conversationId,
          from: 'human',
          to: 'ai',
          reason: options.reason,
          timestamp: new Date().toISOString()
        }, data.organization_id);
      }

      logger.info('Conversation transferred to AI', {
        conversationId,
        reason: options.reason,
        triggeredBy: options.triggeredBy
      });

      return true;
    } catch (error) {
      logger.error('Error in transferToAI:', error);
      return false;
    }
  }

  /**
   * Obtém histórico de handoffs de uma conversa
   */
  async getHandoffHistory(conversationId: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('handoff_history')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error getting handoff history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getHandoffHistory:', error);
      return [];
    }
  }

  /**
   * Obtém métricas de handoff para uma organização
   */
  async getHandoffMetrics(organizationId: string, days: number = 7): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Buscar todas as conversas do período
      const { data: conversations } = await this.supabaseService.supabase
        .from('whatsapp_conversations')
        .select('id, current_handler, ai_handoff_enabled, needs_human_attention, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString());

      // Buscar histórico de handoffs do período
      const { data: history } = await this.supabaseService.supabase
        .from('handoff_history')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString());

      const totalConversations = conversations?.length || 0;
      const aiHandled = conversations?.filter(c => c.current_handler === 'ai' && !c.needs_human_attention).length || 0;
      const humanHandled = conversations?.filter(c => c.current_handler === 'human').length || 0;
      const totalHandoffs = history?.length || 0;
      const aiToHuman = history?.filter(h => h.from_handler === 'ai' && h.to_handler === 'human').length || 0;
      const humanToAI = history?.filter(h => h.from_handler === 'human' && h.to_handler === 'ai').length || 0;

      // Calcular taxas
      const aiResolutionRate = totalConversations > 0 ? (aiHandled / totalConversations) * 100 : 0;
      const escalationRate = totalConversations > 0 ? (aiToHuman / totalConversations) * 100 : 0;

      // Agrupar por razão de handoff
      const handoffReasons: Record<string, number> = {};
      history?.forEach(h => {
        handoffReasons[h.reason] = (handoffReasons[h.reason] || 0) + 1;
      });

      return {
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        },
        conversations: {
          total: totalConversations,
          aiHandled,
          humanHandled,
          needingAttention: conversations?.filter(c => c.needs_human_attention).length || 0
        },
        handoffs: {
          total: totalHandoffs,
          aiToHuman,
          humanToAI
        },
        rates: {
          aiResolutionRate: Math.round(aiResolutionRate * 100) / 100,
          escalationRate: Math.round(escalationRate * 100) / 100
        },
        topReasons: Object.entries(handoffReasons)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([reason, count]) => ({ reason, count }))
      };
    } catch (error) {
      logger.error('Error getting handoff metrics:', error);
      return null;
    }
  }

  /**
   * Registra handoff no histórico
   */
  private async recordHandoffHistory(
    conversationId: string,
    fromHandler: string,
    toHandler: string,
    reason: string,
    triggeredBy: string
  ): Promise<void> {
    try {
      // Obter organization_id da conversa
      const { data: conversation } = await this.supabaseService.supabase
        .from('whatsapp_conversations')
        .select('organization_id')
        .eq('id', conversationId)
        .single();

      if (!conversation) {
        logger.error('Conversation not found for handoff history');
        return;
      }

      await this.supabaseService.supabase
        .from('handoff_history')
        .insert({
          conversation_id: conversationId,
          from_handler: fromHandler,
          to_handler: toHandler,
          reason,
          triggered_by: triggeredBy,
          organization_id: conversation.organization_id,
          created_at: new Date().toISOString()
        });

      logger.info('Handoff history recorded', {
        conversationId,
        fromHandler,
        toHandler,
        reason
      });
    } catch (error) {
      logger.error('Error recording handoff history:', error);
    }
  }

  /**
   * Envia mensagem de transição ao cliente
   */
  private async sendHandoffMessage(
    instanceId: string,
    conversationId: string,
    direction: 'to_human' | 'to_ai'
  ): Promise<void> {
    try {
      // Buscar número do cliente
      const { data: conversation } = await this.supabaseService.supabase
        .from('whatsapp_conversations')
        .select('contact_id, whatsapp_contacts!inner(phone), organization_id')
        .eq('id', conversationId)
        .single();

      if (!conversation || !conversation.whatsapp_contacts) {
        return;
      }

      // Type assertion para corrigir tipo retornado pelo Supabase
      const contacts = conversation.whatsapp_contacts as any;
      const phoneNumber = Array.isArray(contacts) ? contacts[0]?.phone : contacts?.phone;

      if (!phoneNumber) {
        logger.warn('No phone number found for handoff message', { conversationId });
        return;
      }

      const message = direction === 'to_human'
        ? 'Obrigado pela sua mensagem! 💝 Um atendente vai te responder em instantes.'
        : 'Olá! 🐾 Nossa assistente virtual está de volta para te ajudar!';

      // Adicionar à fila de mensagens
      await this.supabaseService.supabase
        .from('whatsapp_message_queue')
        .insert({
          instance_id: instanceId,
          conversation_id: conversationId,
          to_number: phoneNumber,
          message_content: message,
          message_type: 'text',
          status: 'pending',
          priority: 10, // Alta prioridade
          organization_id: conversation.organization_id,
          scheduled_at: new Date().toISOString()
        });

      logger.info('Handoff message queued', { conversationId, direction });
    } catch (error) {
      logger.error('Error sending handoff message:', error);
    }
  }
}
