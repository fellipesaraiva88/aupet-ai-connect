import { SupabaseService } from './supabase';
import { getEvolutionAPIService } from './evolution-api-unified';
import { logger } from '../utils/logger';

interface QueuedMessage {
  id: string;
  instance_id: string;
  conversation_id: string;
  to_number: string;
  message_content: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document';
  media_url?: string;
  caption?: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  priority: number;
  retry_count: number;
  max_retries: number;
  scheduled_at: string;
  organization_id: string;
}

export class MessageQueueWorker {
  private supabaseService: SupabaseService;
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 5000; // 5 segundos
  private readonly BATCH_SIZE = 10; // Processar 10 mensagens por vez
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.supabaseService = new SupabaseService();
  }

  /**
   * Inicia o worker
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Message queue worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting message queue worker', {
      pollInterval: this.POLL_INTERVAL_MS,
      batchSize: this.BATCH_SIZE
    });

    // Processar imediatamente
    this.processQueue();

    // Configurar intervalo de processamento
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.POLL_INTERVAL_MS);
  }

  /**
   * Para o worker
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Message queue worker is not running');
      return;
    }

    this.isRunning = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    logger.info('Message queue worker stopped');
  }

  /**
   * Processa a fila de mensagens
   */
  private async processQueue(): Promise<void> {
    try {
      // Buscar mensagens pendentes, ordenadas por prioridade e data
      const { data: messages, error } = await this.supabaseService.supabase
        .from('whatsapp_message_queue')
        .select(`
          *,
          whatsapp_instances!inner(instance_name, is_connected, status)
        `)
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('scheduled_at', { ascending: true })
        .limit(this.BATCH_SIZE);

      if (error) {
        logger.error('Error fetching message queue:', error);
        return;
      }

      if (!messages || messages.length === 0) {
        return; // Sem mensagens para processar
      }

      logger.info(`Processing ${messages.length} queued messages`);

      // Processar cada mensagem
      for (const message of messages) {
        await this.processMessage(message as any);
      }

    } catch (error) {
      logger.error('Error in message queue processor:', error);
    }
  }

  /**
   * Processa uma mensagem individual
   */
  private async processMessage(message: QueuedMessage & { whatsapp_instances: any }): Promise<void> {
    try {
      // Verificar se a instância está conectada
      if (!message.whatsapp_instances?.is_connected) {
        logger.warn('Instance not connected, skipping message', {
          messageId: message.id,
          instanceId: message.instance_id
        });

        // Atualizar status para failed
        await this.updateMessageStatus(message.id, 'failed', {
          error: 'Instance not connected',
          failed_at: new Date().toISOString()
        });

        return;
      }

      const instanceName = message.whatsapp_instances.instance_name;

      // Atualizar status para "sending"
      await this.updateMessageStatus(message.id, 'sending');

      // Obter Evolution API service
      const evolution = getEvolutionAPIService();

      // Enviar mensagem
      let response;

      if (message.message_type === 'text') {
        response = await evolution.sendText(
          instanceName,
          message.to_number,
          message.message_content
        );
      } else {
        // Enviar mídia
        response = await evolution.sendMedia(
          instanceName,
          message.to_number,
          message.media_url || '',
          message.caption,
          message.message_type as any
        );
      }

      // Atualizar status para "sent"
      await this.updateMessageStatus(message.id, 'sent', {
        sent_at: new Date().toISOString(),
        external_id: response?.key?.id || null,
        evolution_response: response
      });

      // Salvar mensagem na tabela de mensagens para histórico
      await this.saveToMessageHistory(message, response);

      logger.info('Message sent successfully', {
        messageId: message.id,
        toNumber: message.to_number,
        type: message.message_type
      });

    } catch (error: any) {
      logger.error('Error sending message:', {
        messageId: message.id,
        error: error.message,
        toNumber: message.to_number
      });

      // Verificar se deve tentar novamente
      const retryCount = message.retry_count || 0;
      const maxRetries = message.max_retries || this.MAX_RETRIES;

      if (retryCount < maxRetries) {
        // Reagendar para retry
        const nextRetryAt = new Date(Date.now() + Math.pow(2, retryCount) * 60000); // Exponential backoff

        await this.supabaseService.supabase
          .from('whatsapp_message_queue')
          .update({
            status: 'pending',
            retry_count: retryCount + 1,
            scheduled_at: nextRetryAt.toISOString(),
            last_error: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', message.id);

        logger.info('Message scheduled for retry', {
          messageId: message.id,
          retryCount: retryCount + 1,
          nextRetryAt: nextRetryAt.toISOString()
        });
      } else {
        // Excedeu número de tentativas
        await this.updateMessageStatus(message.id, 'failed', {
          error: error.message,
          failed_at: new Date().toISOString(),
          retry_count: retryCount
        });

        logger.error('Message failed after max retries', {
          messageId: message.id,
          retries: retryCount
        });
      }
    }
  }

  /**
   * Atualiza status da mensagem na fila
   */
  private async updateMessageStatus(
    messageId: string,
    status: 'pending' | 'sending' | 'sent' | 'failed',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.supabaseService.supabase
      .from('whatsapp_message_queue')
      .update({
        status,
        metadata: metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);
  }

  /**
   * Salva mensagem enviada no histórico
   */
  private async saveToMessageHistory(
    queuedMessage: QueuedMessage,
    evolutionResponse: any
  ): Promise<void> {
    try {
      await this.supabaseService.supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: queuedMessage.conversation_id,
          instance_id: queuedMessage.instance_id,
          message_id: evolutionResponse?.key?.id || null,
          external_id: evolutionResponse?.key?.id || null,
          from_number: null, // Mensagem enviada pelo bot
          to_number: queuedMessage.to_number,
          is_from_me: true,
          message_type: queuedMessage.message_type,
          content: queuedMessage.message_content,
          media_url: queuedMessage.media_url,
          caption: queuedMessage.caption,
          direction: 'outbound',
          status: 'sent',
          organization_id: queuedMessage.organization_id,
          timestamp: new Date().toISOString(),
          metadata: {
            queue_id: queuedMessage.id,
            evolution_response: evolutionResponse,
            is_ai_generated: true
          }
        });

      // Atualizar conversa com última mensagem
      await this.supabaseService.supabase
        .from('whatsapp_conversations')
        .update({
          last_message_time: new Date().toISOString(),
          last_message_content: queuedMessage.message_content,
          updated_at: new Date().toISOString()
        })
        .eq('id', queuedMessage.conversation_id);

    } catch (error) {
      logger.error('Error saving message to history:', error);
      // Não falhar o envio por erro no histórico
    }
  }

  /**
   * Limpa mensagens antigas processadas (mais de 7 dias)
   */
  async cleanupOldMessages(): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { error } = await this.supabaseService.supabase
        .from('whatsapp_message_queue')
        .delete()
        .in('status', ['sent', 'failed'])
        .lt('updated_at', sevenDaysAgo.toISOString());

      if (error) {
        logger.error('Error cleaning up old messages:', error);
      } else {
        logger.info('Old messages cleaned up successfully');
      }
    } catch (error) {
      logger.error('Error in cleanup task:', error);
    }
  }

  /**
   * Obtém estatísticas da fila
   */
  async getQueueStats(): Promise<any> {
    try {
      const { data: stats } = await this.supabaseService.supabase
        .rpc('get_queue_stats');

      return stats || {
        pending: 0,
        sending: 0,
        sent: 0,
        failed: 0
      };
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      return null;
    }
  }

  /**
   * Health check do worker
   */
  isHealthy(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
let workerInstance: MessageQueueWorker | null = null;

export function getMessageQueueWorker(): MessageQueueWorker {
  if (!workerInstance) {
    workerInstance = new MessageQueueWorker();
  }
  return workerInstance;
}
