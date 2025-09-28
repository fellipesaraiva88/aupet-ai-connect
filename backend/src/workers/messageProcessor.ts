import { QueueMessageData } from '../services/whatsapp/MessageQueue';
import { WhatsAppManager } from '../services/whatsapp/managers/WhatsAppManager';
import { IncomingMessage, MessageResult } from '../services/whatsapp/providers/IWhatsAppProvider';
import { logger } from '../utils/logger';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export class MessageProcessor {
  private whatsappManager: WhatsAppManager;

  constructor(whatsappManager: WhatsAppManager) {
    this.whatsappManager = whatsappManager;
  }

  /**
   * Processa mensagens recebidas do WhatsApp
   */
  public async processIncomingMessage(data: QueueMessageData): Promise<void> {
    const { instanceId, businessId, message } = data;

    if (!message) {
      throw new Error('No message data provided');
    }

    logger.info('Processing incoming message', {
      instanceId,
      businessId,
      messageId: message.id,
      from: message.from,
      type: message.type
    });

    try {
      // 1. Salvar mensagem no banco de dados
      await this.saveMessageToDatabase(instanceId, message, 'incoming');

      // 2. Processar mensagem baseada no tipo
      await this.handleMessageByType(instanceId, businessId, message);

      // 3. Atualizar métricas/estatísticas
      await this.updateMessageMetrics(instanceId, 'incoming', 'success');

      logger.debug('Incoming message processed successfully', {
        instanceId,
        messageId: message.id
      });
    } catch (error: any) {
      logger.error('Failed to process incoming message:', error, {
        instanceId,
        messageId: message.id,
        from: message.from
      });

      // Atualizar métricas de erro
      await this.updateMessageMetrics(instanceId, 'incoming', 'error');

      throw error;
    }
  }

  /**
   * Processa mensagens a serem enviadas pelo WhatsApp
   */
  public async processOutgoingMessage(data: QueueMessageData): Promise<MessageResult> {
    const { instanceId, businessId, sendParams } = data;

    if (!sendParams) {
      throw new Error('No send parameters provided');
    }

    logger.info('Processing outgoing message', {
      instanceId,
      businessId,
      to: sendParams.to,
      type: sendParams.text ? 'text' : sendParams.media ? 'media' : 'interactive'
    });

    try {
      // 1. Validar parâmetros de envio
      this.validateSendParams(sendParams);

      // 2. Verificar rate limiting
      await this.checkRateLimit(instanceId);

      // 3. Enviar mensagem
      const result = await this.whatsappManager.sendMessage(instanceId, sendParams);

      // 4. Salvar no banco de dados
      await this.saveOutgoingMessageToDatabase(instanceId, sendParams, result);

      // 5. Atualizar métricas
      await this.updateMessageMetrics(instanceId, 'outgoing', 'success');

      logger.debug('Outgoing message processed successfully', {
        instanceId,
        messageId: result.id,
        status: result.status
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to process outgoing message:', error, {
        instanceId,
        to: sendParams.to
      });

      // Atualizar métricas de erro
      await this.updateMessageMetrics(instanceId, 'outgoing', 'error');

      // Retornar resultado de erro
      return {
        id: Date.now().toString(),
        status: 'failed',
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Processa mensagem baseada no tipo e conteúdo
   */
  private async handleMessageByType(instanceId: string, businessId: string, message: IncomingMessage): Promise<void> {
    try {
      // Verificar se é mensagem de comando/bot
      if (message.body?.startsWith('/')) {
        await this.handleBotCommand(instanceId, businessId, message);
        return;
      }

      // Processar mensagem normal com IA
      await this.processWithAI(instanceId, businessId, message);

      // Se for mídia, processar separadamente
      if (message.type !== 'text' && message.mediaUrl) {
        await this.processMediaMessage(instanceId, businessId, message);
      }
    } catch (error: any) {
      logger.error('Error handling message by type:', error, {
        instanceId,
        messageId: message.id,
        type: message.type
      });
    }
  }

  /**
   * Processa comandos de bot
   */
  private async handleBotCommand(instanceId: string, businessId: string, message: IncomingMessage): Promise<void> {
    const command = message.body?.toLowerCase().trim();

    switch (command) {
      case '/help':
        await this.sendHelpMessage(instanceId, message.from);
        break;

      case '/status':
        await this.sendStatusMessage(instanceId, message.from);
        break;

      case '/menu':
        await this.sendMenuMessage(instanceId, businessId, message.from);
        break;

      default:
        logger.debug('Unknown bot command:', command);
        break;
    }
  }

  /**
   * Processa mensagem com IA
   */
  private async processWithAI(instanceId: string, businessId: string, message: IncomingMessage): Promise<void> {
    try {
      // Buscar contexto da conversa
      const context = await this.getConversationContext(instanceId, message.from);

      // Preparar dados para IA
      const aiRequest = {
        businessId,
        message: message.body || '',
        context,
        customerPhone: message.from,
        messageType: message.type
      };

      // Aqui você integraria com seu serviço de IA
      // Por enquanto, vamos simular uma resposta automática simples
      const aiResponse = await this.generateAIResponse(aiRequest);

      if (aiResponse && aiResponse.trim()) {
        // Enviar resposta
        await this.whatsappManager.sendText(instanceId, message.from, aiResponse);

        // Salvar resposta da IA no contexto
        await this.updateConversationContext(instanceId, message.from, {
          userMessage: message.body,
          aiResponse,
          timestamp: new Date()
        });
      }
    } catch (error: any) {
      logger.error('Error processing with AI:', error, {
        instanceId,
        messageId: message.id
      });
    }
  }

  /**
   * Processa mensagens de mídia
   */
  private async processMediaMessage(instanceId: string, businessId: string, message: IncomingMessage): Promise<void> {
    try {
      // Aqui você pode implementar processamento específico para mídia
      // Por exemplo: análise de imagens, transcrição de áudio, etc.

      logger.debug('Processing media message', {
        instanceId,
        messageId: message.id,
        type: message.type,
        mimeType: message.mimeType
      });

      // Exemplo: resposta automática para imagens
      if (message.type === 'image') {
        await this.whatsappManager.sendText(
          instanceId,
          message.from,
          'Recebi sua imagem! Nosso time irá analisá-la e retornar em breve.'
        );
      }
    } catch (error: any) {
      logger.error('Error processing media message:', error, {
        instanceId,
        messageId: message.id
      });
    }
  }

  /**
   * Salva mensagem recebida no banco de dados
   */
  private async saveMessageToDatabase(instanceId: string, message: IncomingMessage, direction: 'incoming' | 'outgoing'): Promise<void> {
    try {
      const { error } = await supabase
        .from('message_history')
        .insert({
          instance_id: instanceId,
          chat_id: message.from,
          direction,
          content: message.body || '',
          media_url: message.mediaUrl,
          status: 'received',
          metadata: {
            type: message.type,
            isFromMe: message.isFromMe,
            isGroup: message.isGroup,
            timestamp: message.timestamp,
            mimeType: message.mimeType,
            caption: message.caption
          }
        });

      if (error) {
        logger.error('Failed to save message to database:', error);
      }
    } catch (error: any) {
      logger.error('Database error saving message:', error);
    }
  }

  /**
   * Salva mensagem enviada no banco de dados
   */
  private async saveOutgoingMessageToDatabase(instanceId: string, sendParams: any, result: MessageResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('message_history')
        .insert({
          instance_id: instanceId,
          chat_id: sendParams.to,
          direction: 'outgoing',
          content: sendParams.text || sendParams.media?.caption || '',
          media_url: sendParams.media?.url,
          status: result.status,
          metadata: {
            messageId: result.id,
            timestamp: result.timestamp,
            error: result.error,
            sendParams
          }
        });

      if (error) {
        logger.error('Failed to save outgoing message to database:', error);
      }
    } catch (error: any) {
      logger.error('Database error saving outgoing message:', error);
    }
  }

  /**
   * Valida parâmetros de envio
   */
  private validateSendParams(sendParams: any): void {
    if (!sendParams.to) {
      throw new Error('Recipient phone number is required');
    }

    if (!sendParams.text && !sendParams.media && !sendParams.buttons && !sendParams.list) {
      throw new Error('Message content is required');
    }

    // Validar formato do número de telefone
    const phoneRegex = /^\d{10,15}@s\.whatsapp\.net$/;
    if (!phoneRegex.test(sendParams.to)) {
      throw new Error('Invalid phone number format');
    }
  }

  /**
   * Verifica rate limiting por instância
   */
  private async checkRateLimit(instanceId: string): Promise<void> {
    // Implementar rate limiting por instância
    // Por exemplo: máximo 30 mensagens por minuto
    const limit = 30;
    const window = 60000; // 1 minuto

    const key = `rate_limit:${instanceId}`;

    try {
      const redis = require('../config/redis.config').RedisManager.getInstance();
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.ceil(window / 1000));
      }

      if (current > limit) {
        throw new Error(`Rate limit exceeded: ${current}/${limit} messages per minute`);
      }
    } catch (error: any) {
      if (error.message.includes('Rate limit exceeded')) {
        throw error;
      }
      // Se Redis falhar, permitir o envio (graceful degradation)
      logger.warn('Rate limit check failed, allowing message:', error);
    }
  }

  /**
   * Atualiza métricas de mensagens
   */
  private async updateMessageMetrics(instanceId: string, direction: 'incoming' | 'outgoing', status: 'success' | 'error'): Promise<void> {
    try {
      const redis = require('../config/redis.config').RedisManager.getInstance();
      const key = `metrics:${instanceId}:${direction}:${status}`;
      const dateKey = `metrics:${instanceId}:${direction}:${status}:${new Date().toISOString().split('T')[0]}`;

      await Promise.all([
        redis.incr(key),
        redis.incr(dateKey),
        redis.expire(dateKey, 86400 * 30) // 30 dias
      ]);
    } catch (error: any) {
      logger.error('Failed to update metrics:', error);
    }
  }

  /**
   * Busca contexto da conversa
   */
  private async getConversationContext(instanceId: string, phoneNumber: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('message_history')
        .select('content, direction, created_at')
        .eq('instance_id', instanceId)
        .eq('chat_id', phoneNumber)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        logger.error('Failed to get conversation context:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      logger.error('Database error getting context:', error);
      return [];
    }
  }

  /**
   * Atualiza contexto da conversa
   */
  private async updateConversationContext(instanceId: string, phoneNumber: string, context: any): Promise<void> {
    try {
      const redis = require('../config/redis.config').RedisManager.getInstance();
      const key = `context:${instanceId}:${phoneNumber}`;

      await redis.setex(key, 3600, JSON.stringify(context)); // 1 hora
    } catch (error: any) {
      logger.error('Failed to update conversation context:', error);
    }
  }

  /**
   * Gera resposta de IA (simulação)
   */
  private async generateAIResponse(request: any): Promise<string> {
    // Aqui você integraria com OpenAI, Anthropic, ou seu serviço de IA
    // Por enquanto, vamos retornar uma resposta simulada

    const message = request.message.toLowerCase();

    if (message.includes('ola') || message.includes('oi')) {
      return 'Olá! Como posso ajudá-lo hoje? 😊';
    }

    if (message.includes('agendamento') || message.includes('agendar')) {
      return 'Para agendar um serviço, você pode acessar nosso sistema online ou me informar qual serviço deseja e a data preferida.';
    }

    if (message.includes('preço') || message.includes('valor')) {
      return 'Nossos preços variam de acordo com o serviço. Você pode consultar nossa tabela completa ou me dizer qual serviço te interessa para dar um orçamento específico.';
    }

    // Resposta padrão
    return 'Obrigado pela sua mensagem! Nossa equipe irá analisar e responder em breve. Se for urgente, você pode ligar para (11) 99999-9999.';
  }

  /**
   * Envia mensagem de ajuda
   */
  private async sendHelpMessage(instanceId: string, to: string): Promise<void> {
    const helpText = `🤖 *Comandos disponíveis:*

/help - Mostra esta mensagem
/status - Status da conexão
/menu - Menu de serviços

Você também pode conversar normalmente comigo! 😊`;

    await this.whatsappManager.sendText(instanceId, to, helpText);
  }

  /**
   * Envia mensagem de status
   */
  private async sendStatusMessage(instanceId: string, to: string): Promise<void> {
    try {
      const status = await this.whatsappManager.getConnectionStatus(instanceId);
      const statusText = `📡 *Status da Conexão:*

Estado: ${status?.state || 'desconhecido'}
Autenticado: ${status?.isAuthenticated ? 'Sim' : 'Não'}
Última atualização: ${status?.lastSeen ? new Date(status.lastSeen).toLocaleString('pt-BR') : 'N/A'}`;

      await this.whatsappManager.sendText(instanceId, to, statusText);
    } catch (error: any) {
      await this.whatsappManager.sendText(instanceId, to, '❌ Erro ao verificar status da conexão.');
    }
  }

  /**
   * Envia menu de serviços
   */
  private async sendMenuMessage(instanceId: string, businessId: string, to: string): Promise<void> {
    try {
      // Buscar serviços do negócio no banco de dados
      const menuText = `📋 *Menu de Serviços:*

🐕 Banho e Tosa
🏥 Consulta Veterinária
💊 Vacinação
🦷 Limpeza Dental
🏠 Pet Sitting

Para agendar, digite o nome do serviço ou entre em contato conosco!`;

      await this.whatsappManager.sendText(instanceId, to, menuText);
    } catch (error: any) {
      await this.whatsappManager.sendText(instanceId, to, '❌ Erro ao carregar menu de serviços.');
    }
  }
}