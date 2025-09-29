import { SupabaseService } from '../supabase';
import { logger } from '../../utils/logger';

/**
 * AI Logger - Sistema de Logs Estruturados para Análise de IA
 *
 * Registra todas as decisões e ações da IA para análise,
 * treinamento e otimização do modelo.
 */

export interface AILogEntry {
  organization_id: string;
  conversation_id: string;
  customer_id?: string;
  event_type: 'message_analyzed' | 'opportunity_detected' | 'response_generated' | 'escalated' | 'error';

  // Análise
  intent?: string;
  confidence?: number;
  sentiment?: string;
  urgency?: string;

  // Oportunidade
  opportunity_type?: string;
  opportunity_service?: string;
  opportunity_confidence?: number;
  pnl_technique?: string;

  // Resposta
  response_text?: string;
  response_fragments?: number;
  humanization_applied?: boolean;
  time_of_day?: string;
  customer_tone?: string;

  // Resultados
  was_escalated?: boolean;
  escalation_reason?: string;
  customer_replied?: boolean;
  conversion_achieved?: boolean;

  // Metadados
  processing_time_ms?: number;
  error_message?: string;
  metadata?: Record<string, any>;
}

export class AILogger {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = new SupabaseService();
  }

  /**
   * Registra análise de mensagem
   */
  async logMessageAnalysis(
    organizationId: string,
    conversationId: string,
    customerId: string,
    analysis: any,
    processingTime: number
  ): Promise<void> {
    try {
      const logEntry: AILogEntry = {
        organization_id: organizationId,
        conversation_id: conversationId,
        customer_id: customerId,
        event_type: 'message_analyzed',
        intent: analysis.intent,
        confidence: analysis.confidence,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        processing_time_ms: processingTime,
        metadata: {
          keywords: analysis.keywords,
          entities: analysis.entities
        }
      };

      await this.saveLog(logEntry);

      logger.ai('MESSAGE_ANALYZED', {
        conversationId,
        intent: analysis.intent,
        confidence: analysis.confidence
      });
    } catch (error) {
      logger.error('Error logging message analysis:', error);
    }
  }

  /**
   * Registra detecção de oportunidade
   */
  async logOpportunityDetected(
    organizationId: string,
    conversationId: string,
    customerId: string,
    opportunity: any
  ): Promise<void> {
    try {
      const logEntry: AILogEntry = {
        organization_id: organizationId,
        conversation_id: conversationId,
        customer_id: customerId,
        event_type: 'opportunity_detected',
        opportunity_type: opportunity.type,
        opportunity_service: opportunity.service,
        opportunity_confidence: opportunity.confidence,
        pnl_technique: opportunity.pnlTechnique,
        urgency: opportunity.urgency,
        metadata: {
          triggers: opportunity.triggers,
          category: opportunity.category
        }
      };

      await this.saveLog(logEntry);

      logger.ai('OPPORTUNITY_DETECTED', {
        conversationId,
        service: opportunity.service,
        confidence: opportunity.confidence,
        pnlTechnique: opportunity.pnlTechnique
      });
    } catch (error) {
      logger.error('Error logging opportunity:', error);
    }
  }

  /**
   * Registra resposta gerada
   */
  async logResponseGenerated(
    organizationId: string,
    conversationId: string,
    customerId: string,
    response: string,
    fragments: number,
    humanizationConfig: any
  ): Promise<void> {
    try {
      const logEntry: AILogEntry = {
        organization_id: organizationId,
        conversation_id: conversationId,
        customer_id: customerId,
        event_type: 'response_generated',
        response_text: response,
        response_fragments: fragments,
        humanization_applied: true,
        time_of_day: humanizationConfig.timeOfDay,
        customer_tone: humanizationConfig.customerTone,
        metadata: {
          errorProbability: humanizationConfig.errorProbability,
          useEmojis: humanizationConfig.useEmojis
        }
      };

      await this.saveLog(logEntry);

      logger.ai('RESPONSE_GENERATED', {
        conversationId,
        fragments,
        timeOfDay: humanizationConfig.timeOfDay
      });
    } catch (error) {
      logger.error('Error logging response:', error);
    }
  }

  /**
   * Registra escalação para humano
   */
  async logEscalation(
    organizationId: string,
    conversationId: string,
    customerId: string,
    reason: string,
    urgency: string
  ): Promise<void> {
    try {
      const logEntry: AILogEntry = {
        organization_id: organizationId,
        conversation_id: conversationId,
        customer_id: customerId,
        event_type: 'escalated',
        was_escalated: true,
        escalation_reason: reason,
        urgency,
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      await this.saveLog(logEntry);

      logger.ai('CONVERSATION_ESCALATED', {
        conversationId,
        reason,
        urgency
      });
    } catch (error) {
      logger.error('Error logging escalation:', error);
    }
  }

  /**
   * Registra erro no processamento de IA
   */
  async logError(
    organizationId: string,
    conversationId: string,
    errorMessage: string,
    errorStack?: string
  ): Promise<void> {
    try {
      const logEntry: AILogEntry = {
        organization_id: organizationId,
        conversation_id: conversationId,
        event_type: 'error',
        error_message: errorMessage,
        metadata: {
          stack: errorStack,
          timestamp: new Date().toISOString()
        }
      };

      await this.saveLog(logEntry);

      logger.error('AI_ERROR_LOGGED', {
        conversationId,
        error: errorMessage
      });
    } catch (error) {
      logger.error('Error logging AI error:', error);
    }
  }

  /**
   * Salva log no banco de dados
   */
  private async saveLog(logEntry: AILogEntry): Promise<void> {
    try {
      const { error } = await this.supabaseService.supabase
        .from('ai_logs')
        .insert({
          organization_id: logEntry.organization_id,
          conversation_id: logEntry.conversation_id,
          customer_id: logEntry.customer_id,
          event_type: logEntry.event_type,
          intent: logEntry.intent,
          confidence: logEntry.confidence,
          sentiment: logEntry.sentiment,
          urgency: logEntry.urgency,
          opportunity_type: logEntry.opportunity_type,
          opportunity_service: logEntry.opportunity_service,
          opportunity_confidence: logEntry.opportunity_confidence,
          pnl_technique: logEntry.pnl_technique,
          response_text: logEntry.response_text,
          response_fragments: logEntry.response_fragments,
          humanization_applied: logEntry.humanization_applied,
          time_of_day: logEntry.time_of_day,
          customer_tone: logEntry.customer_tone,
          was_escalated: logEntry.was_escalated,
          escalation_reason: logEntry.escalation_reason,
          customer_replied: logEntry.customer_replied,
          conversion_achieved: logEntry.conversion_achieved,
          processing_time_ms: logEntry.processing_time_ms,
          error_message: logEntry.error_message,
          metadata: logEntry.metadata,
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.error('Failed to save AI log:', error);
      }
    } catch (error) {
      logger.error('Error saving AI log:', error);
    }
  }

  /**
   * Buscar logs de IA com filtros
   */
  async getAILogs(
    organizationId: string,
    filters: {
      eventType?: string;
      conversationId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {}
  ): Promise<AILogEntry[]> {
    try {
      let query = this.supabaseService.supabase
        .from('ai_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters.conversationId) {
        query = query.eq('conversation_id', filters.conversationId);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching AI logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting AI logs:', error);
      return [];
    }
  }

  /**
   * Obter métricas agregadas de IA
   */
  async getAIMetrics(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    try {
      const logs = await this.getAILogs(organizationId, {
        startDate,
        endDate
      });

      // Calcular métricas
      const totalMessages = logs.filter(l => l.event_type === 'message_analyzed').length;
      const opportunitiesDetected = logs.filter(l => l.event_type === 'opportunity_detected').length;
      const responsesGenerated = logs.filter(l => l.event_type === 'response_generated').length;
      const escalated = logs.filter(l => l.event_type === 'escalated').length;
      const errors = logs.filter(l => l.event_type === 'error').length;

      // Análise de confiança média
      const analysisLogs = logs.filter(l => l.event_type === 'message_analyzed' && l.confidence);
      const avgConfidence = analysisLogs.length > 0
        ? analysisLogs.reduce((sum, l) => sum + (l.confidence || 0), 0) / analysisLogs.length
        : 0;

      // Distribuição de técnicas PNL
      const pnlTechniques = logs
        .filter(l => l.pnl_technique)
        .reduce((acc, l) => {
          acc[l.pnl_technique!] = (acc[l.pnl_technique!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      // Distribuição de urgências
      const urgencyDistribution = logs
        .filter(l => l.urgency)
        .reduce((acc, l) => {
          acc[l.urgency!] = (acc[l.urgency!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      // Tempo médio de processamento
      const processingLogs = logs.filter(l => l.processing_time_ms);
      const avgProcessingTime = processingLogs.length > 0
        ? processingLogs.reduce((sum, l) => sum + (l.processing_time_ms || 0), 0) / processingLogs.length
        : 0;

      return {
        totalMessages,
        opportunitiesDetected,
        responsesGenerated,
        escalated,
        errors,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        avgProcessingTime: Math.round(avgProcessingTime),
        opportunityRate: totalMessages > 0 ? Math.round((opportunitiesDetected / totalMessages) * 100) : 0,
        escalationRate: totalMessages > 0 ? Math.round((escalated / totalMessages) * 100) : 0,
        pnlTechniques,
        urgencyDistribution
      };
    } catch (error) {
      logger.error('Error calculating AI metrics:', error);
      return null;
    }
  }
}