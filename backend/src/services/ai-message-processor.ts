import { AIService } from './ai';
import { SupabaseService } from './supabase';
import { logger } from '../utils/logger';
import { BusinessConfig } from '../types';

interface MessageContext {
  messageId: string;
  messageContent: string;
  fromNumber: string;
  instanceId: string;
  organizationId: string;
  conversationId: string;
}

export class AIMessageProcessor {
  private aiService: AIService;
  private supabaseService: SupabaseService;

  constructor() {
    this.aiService = new AIService();
    this.supabaseService = new SupabaseService();
  }

  /**
   * Processa mensagem recebida e gera resposta automática via IA
   */
  async processIncomingMessage(context: MessageContext): Promise<void> {
    try {
      logger.info('Processing incoming message with AI', {
        messageId: context.messageId,
        fromNumber: context.fromNumber
      });

      // 1. Buscar configurações da instância
      const instanceConfig = await this.getInstanceConfig(context.instanceId);

      // Verificar se auto-reply está habilitado
      if (!instanceConfig.settings?.auto_reply || !instanceConfig.settings?.ai_enabled) {
        logger.info('Auto-reply or AI disabled for instance', {
          instanceId: context.instanceId,
          autoReply: instanceConfig.settings?.auto_reply,
          aiEnabled: instanceConfig.settings?.ai_enabled
        });
        return;
      }

      // 2. Verificar horário comercial
      const businessConfig = await this.getBusinessConfig(context.organizationId);

      if (!this.aiService.isWithinBusinessHours(businessConfig)) {
        logger.info('Outside business hours, sending away message');
        await this.queueAwayMessage(context, businessConfig);
        return;
      }

      // 3. Buscar contexto do cliente
      const customerContext = await this.getCustomerContext(context.fromNumber, context.organizationId);

      // 4. Buscar histórico recente de mensagens
      const recentMessages = await this.getRecentMessages(context.conversationId, 5);

      // 5. Analisar mensagem com IA
      const analysis = await this.aiService.analyzeMessage(
        context.messageContent,
        customerContext,
        businessConfig
      );

      logger.ai('MESSAGE_ANALYSIS', {
        messageId: context.messageId,
        intent: analysis.intent,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        needsHuman: analysis.needsHuman,
        confidence: analysis.confidence
      });

      // 6. Verificar se precisa escalar para humano
      if (this.aiService.shouldEscalateToHuman(context.messageContent, analysis, businessConfig)) {
        logger.info('Message escalated to human', {
          messageId: context.messageId,
          reason: analysis.needsHuman ? 'AI flagged' : 'Low confidence'
        });

        // Marcar conversa como precisando atendimento humano
        await this.supabaseService.supabase
          .from('whatsapp_conversations')
          .update({
            needs_human_attention: true,
            last_human_alert: new Date().toISOString()
          })
          .eq('id', context.conversationId);

        // Enviar mensagem de espera
        await this.queueMessage(
          context,
          'Obrigado pela sua mensagem! Um atendente irá responder em breve. 💝',
          'high'
        );

        return;
      }

      // 7. Gerar resposta personalizada com IA
      const aiResponse = await this.aiService.generateResponse(
        analysis.intent,
        customerContext,
        businessConfig,
        recentMessages
      );

      if (!aiResponse || aiResponse.trim().length === 0) {
        logger.warn('Empty AI response generated', { messageId: context.messageId });
        return;
      }

      // 8. Adicionar resposta na fila para envio
      await this.queueMessage(context, aiResponse, 'normal');

      // 9. Salvar análise no banco
      await this.saveAnalysis(context.messageId, analysis, aiResponse);

      logger.info('AI response queued successfully', {
        messageId: context.messageId,
        responseLength: aiResponse.length,
        intent: analysis.intent
      });

    } catch (error) {
      logger.error('Error processing message with AI:', error);

      // Em caso de erro, enviar resposta padrão
      try {
        await this.queueMessage(
          context,
          'Obrigado pela sua mensagem! Estamos processando seu pedido e retornaremos em breve. 💝',
          'normal'
        );
      } catch (fallbackError) {
        logger.error('Failed to send fallback message:', fallbackError);
      }
    }
  }

  /**
   * Busca configurações da instância
   */
  private async getInstanceConfig(instanceId: string): Promise<any> {
    const { data: instance } = await this.supabaseService.supabase
      .from('whatsapp_instances')
      .select('*, whatsapp_instance_settings(*)')
      .eq('id', instanceId)
      .single();

    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    // Se não houver settings, retornar configuração padrão
    const settings = instance.whatsapp_instance_settings?.[0] || {
      auto_reply: true,
      ai_enabled: true,
      business_hours: {
        start: '08:00',
        end: '18:00',
        days: [1, 2, 3, 4, 5]
      }
    };

    return { ...instance, settings };
  }

  /**
   * Busca configuração do negócio
   */
  private async getBusinessConfig(organizationId: string): Promise<BusinessConfig> {
    const { data: org } = await this.supabaseService.supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    // Configuração padrão se não encontrar
    return {
      organization_id: organizationId,
      business_name: org?.business_name || 'Pet Shop',
      welcome_message: 'Olá! 🐾 Bem-vindo ao nosso atendimento. Como posso ajudar você e seu pet hoje?',
      business_hours: {
        enabled: true,
        timezone: 'America/Sao_Paulo',
        schedule: {
          monday: { start: '08:00', end: '18:00', enabled: true },
          tuesday: { start: '08:00', end: '18:00', enabled: true },
          wednesday: { start: '08:00', end: '18:00', enabled: true },
          thursday: { start: '08:00', end: '18:00', enabled: true },
          friday: { start: '08:00', end: '18:00', enabled: true },
          saturday: { start: '08:00', end: '13:00', enabled: true },
          sunday: { start: '08:00', end: '18:00', enabled: false }
        }
      },
      auto_reply: true,
      ai_personality: 'friendly',
      response_delay_seconds: 2,
      escalation_keywords: ['humano', 'atendente', 'falar com alguém', 'pessoa']
    };
  }

  /**
   * Busca contexto do cliente (dados pessoais + pets)
   */
  private async getCustomerContext(phoneNumber: string, organizationId: string): Promise<any> {
    // Buscar contato
    const { data: contact } = await this.supabaseService.supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('phone', phoneNumber)
      .eq('organization_id', organizationId)
      .single();

    if (!contact) {
      return {
        name: 'Cliente',
        phone: phoneNumber,
        pets: [],
        preferences: {},
        lastInteraction: null
      };
    }

    // Buscar cliente associado
    const { data: customer } = await this.supabaseService.supabase
      .from('customers')
      .select('*, pets(*)')
      .eq('phone', phoneNumber)
      .eq('organization_id', organizationId)
      .single();

    return {
      id: customer?.id || contact.id,
      name: customer?.name || contact.name || 'Cliente',
      phone: phoneNumber,
      pets: customer?.pets || [],
      preferences: customer?.preferences || {},
      lastInteraction: contact.last_message_at
    };
  }

  /**
   * Busca mensagens recentes da conversa
   */
  private async getRecentMessages(conversationId: string, limit: number = 5): Promise<any[]> {
    const { data: messages } = await this.supabaseService.supabase
      .from('whatsapp_messages')
      .select('content, direction, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return messages || [];
  }

  /**
   * Adiciona mensagem na fila para envio
   */
  private async queueMessage(
    context: MessageContext,
    messageContent: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<void> {
    const priorityMap = { low: 0, normal: 5, high: 10 };

    await this.supabaseService.supabase
      .from('whatsapp_message_queue')
      .insert({
        instance_id: context.instanceId,
        conversation_id: context.conversationId,
        to_number: context.fromNumber,
        message_content: messageContent,
        message_type: 'text',
        status: 'pending',
        priority: priorityMap[priority],
        scheduled_at: new Date().toISOString(),
        organization_id: context.organizationId
      });

    logger.info('Message queued for sending', {
      toNumber: context.fromNumber,
      priority,
      messageLength: messageContent.length
    });
  }

  /**
   * Envia mensagem de fora do horário
   */
  private async queueAwayMessage(context: MessageContext, businessConfig: BusinessConfig): Promise<void> {
    const awayMessage = businessConfig.business_hours?.away_message ||
      'Obrigado pela sua mensagem! No momento estamos fora do horário de atendimento. Retornaremos em breve! 🐾';

    await this.queueMessage(context, awayMessage, 'normal');
  }

  /**
   * Salva análise da IA no banco
   */
  private async saveAnalysis(
    messageId: string,
    analysis: any,
    aiResponse: string
  ): Promise<void> {
    await this.supabaseService.supabase
      .from('whatsapp_messages')
      .update({
        ai_analysis: {
          intent: analysis.intent,
          sentiment: analysis.sentiment,
          urgency: analysis.urgency,
          confidence: analysis.confidence,
          needs_human: analysis.needsHuman,
          extracted_entities: analysis.extractedEntities,
          suggested_response: aiResponse,
          analyzed_at: new Date().toISOString()
        }
      })
      .eq('id', messageId);
  }

  /**
   * Health check do serviço
   */
  async healthCheck(): Promise<boolean> {
    try {
      const aiHealthy = await this.aiService.healthCheck();
      return aiHealthy;
    } catch (error) {
      logger.error('AI Message Processor health check failed:', error);
      return false;
    }
  }
}
