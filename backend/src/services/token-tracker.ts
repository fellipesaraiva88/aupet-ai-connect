import { SupabaseService } from './supabase';
import { logger } from '../utils/logger';
import { calculateTokenCost, TokenUsage } from '../utils/token-pricing';

/**
 * TokenTrackerService - Rastreia uso de tokens da OpenAI
 * Registra automaticamente cada chamada à API e calcula custos
 */
export class TokenTrackerService {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = new SupabaseService();
  }

  /**
   * Registra uso de tokens no banco de dados
   */
  async trackTokenUsage(params: {
    organizationId: string;
    userId?: string;
    conversationId?: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    metadata?: any;
  }): Promise<void> {
    try {
      // Calcular custo estimado
      const usage: TokenUsage = {
        model: params.model,
        prompt_tokens: params.promptTokens,
        completion_tokens: params.completionTokens,
        total_tokens: params.totalTokens
      };

      const estimatedCost = calculateTokenCost(usage);

      // Salvar no banco
      const { error } = await this.supabaseService.supabase
        .from('token_usage')
        .insert({
          organization_id: params.organizationId,
          user_id: params.userId || null,
          conversation_id: params.conversationId || null,
          model: params.model,
          prompt_tokens: params.promptTokens,
          completion_tokens: params.completionTokens,
          total_tokens: params.totalTokens,
          estimated_cost_usd: estimatedCost,
          metadata: params.metadata || {},
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.error('Error tracking token usage:', error);
        // Não lançar erro para não bloquear a aplicação principal
      } else {
        logger.info('Token usage tracked', {
          organizationId: params.organizationId,
          model: params.model,
          totalTokens: params.totalTokens,
          estimatedCost: estimatedCost.toFixed(6)
        });
      }
    } catch (error) {
      logger.error('Token tracker error:', error);
      // Não lançar erro para não bloquear a aplicação principal
    }
  }

  /**
   * Wrapper para chamadas OpenAI que rastreia tokens automaticamente
   */
  async trackOpenAICompletion<T>(
    params: {
      organizationId: string;
      userId?: string;
      conversationId?: string;
      metadata?: any;
    },
    completionFn: () => Promise<{ response: T; usage?: any }>
  ): Promise<T> {
    try {
      const { response, usage } = await completionFn();

      // Se houver informações de uso, rastrear
      if (usage) {
        await this.trackTokenUsage({
          organizationId: params.organizationId,
          userId: params.userId,
          conversationId: params.conversationId,
          model: usage.model || 'gpt-4',
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
          metadata: params.metadata
        });
      }

      return response;
    } catch (error) {
      logger.error('Error in trackOpenAICompletion:', error);
      throw error;
    }
  }

  /**
   * Obtém uso de tokens de uma organização em um período
   */
  async getOrganizationUsage(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalTokens: number;
    totalCost: number;
    requestCount: number;
  }> {
    try {
      let query = this.supabaseService.supabase
        .from('token_usage')
        .select('total_tokens, estimated_cost_usd')
        .eq('organization_id', organizationId);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const totalTokens = data?.reduce((sum, record) => sum + record.total_tokens, 0) || 0;
      const totalCost = data?.reduce((sum, record) => sum + parseFloat(record.estimated_cost_usd || '0'), 0) || 0;

      return {
        totalTokens,
        totalCost,
        requestCount: data?.length || 0
      };
    } catch (error) {
      logger.error('Error getting organization usage:', error);
      throw error;
    }
  }

  /**
   * Obtém uso de tokens de um usuário em um período
   */
  async getUserUsage(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalTokens: number;
    totalCost: number;
    requestCount: number;
  }> {
    try {
      let query = this.supabaseService.supabase
        .from('token_usage')
        .select('total_tokens, estimated_cost_usd')
        .eq('user_id', userId);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const totalTokens = data?.reduce((sum, record) => sum + record.total_tokens, 0) || 0;
      const totalCost = data?.reduce((sum, record) => sum + parseFloat(record.estimated_cost_usd || '0'), 0) || 0;

      return {
        totalTokens,
        totalCost,
        requestCount: data?.length || 0
      };
    } catch (error) {
      logger.error('Error getting user usage:', error);
      throw error;
    }
  }

  /**
   * Verifica se organização excedeu limite de tokens (se configurado)
   */
  async checkTokenLimit(
    organizationId: string,
    monthlyLimit?: number
  ): Promise<{
    exceeded: boolean;
    usage: number;
    limit?: number;
    percentage?: number;
  }> {
    try {
      // Buscar uso do mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const usage = await this.getOrganizationUsage(
        organizationId,
        startOfMonth
      );

      if (!monthlyLimit) {
        return {
          exceeded: false,
          usage: usage.totalTokens
        };
      }

      const percentage = (usage.totalTokens / monthlyLimit) * 100;

      return {
        exceeded: usage.totalTokens > monthlyLimit,
        usage: usage.totalTokens,
        limit: monthlyLimit,
        percentage
      };
    } catch (error) {
      logger.error('Error checking token limit:', error);
      throw error;
    }
  }
}

export default TokenTrackerService;