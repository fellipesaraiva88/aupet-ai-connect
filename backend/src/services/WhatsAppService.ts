import { WhatsAppManager } from './whatsapp/managers/WhatsAppManager';
import { MessageQueue, QueueMessageData } from './whatsapp/MessageQueue';
import { HealthCheckService } from './whatsapp/HealthCheck';
import { MessageProcessor } from '../workers/messageProcessor';
import { RedisManager } from '../config/redis.config';
import {
  ConnectionStatus,
  QRCodeData,
  MessageResult,
  IncomingMessage,
  SendMessageParams
} from './whatsapp/providers/IWhatsAppProvider';
import { logger } from '../utils/logger';
import Redis from 'ioredis';

export interface WhatsAppServiceConfig {
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
  queue?: {
    concurrency?: number;
    rateLimiter?: {
      max: number;
      duration: number;
    };
  };
  healthCheck?: {
    enabled?: boolean;
    interval?: number;
  };
}

export class WhatsAppService {
  private redis: Redis;
  private whatsappManager: WhatsAppManager;
  private messageQueue: MessageQueue;
  private healthCheck: HealthCheckService;
  private messageProcessor: MessageProcessor;
  private isInitialized = false;

  constructor(config?: WhatsAppServiceConfig) {
    // Inicializar Redis
    this.redis = RedisManager.createConnection(config?.redis);

    // Inicializar componentes
    this.whatsappManager = new WhatsAppManager(this.redis, {
      primaryProvider: 'evolution',
      fallbackProviders: [],
      retryAttempts: 3,
      retryDelay: 1000,
      healthCheckInterval: 30000,
      sessionTTL: 86400
    });

    this.messageQueue = new MessageQueue(this.redis, config?.queue);

    this.healthCheck = new HealthCheckService(
      config?.healthCheck?.interval || 30000
    );

    this.messageProcessor = new MessageProcessor(this.whatsappManager);

    this.setupEventHandlers();

    logger.info('WhatsApp Service created', { config });
  }

  /**
   * Inicializa o serviço WhatsApp
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('WhatsApp Service already initialized');
      return;
    }

    try {
      logger.info('Initializing WhatsApp Service');

      // 1. Inicializar Redis
      await this.redis.ping();
      logger.info('Redis connection established');

      // 2. Inicializar WhatsApp Manager
      await this.whatsappManager.initialize();
      logger.info('WhatsApp Manager initialized');

      // 3. Configurar Health Check
      this.healthCheck.setWhatsAppManager(this.whatsappManager);
      this.healthCheck.setMessageQueue(this.messageQueue);

      if (process.env.NODE_ENV !== 'test') {
        this.healthCheck.startHealthChecks();
        logger.info('Health checks started');
      }

      // 4. Configurar handlers de mensagem
      this.setupMessageHandlers();

      this.isInitialized = true;
      logger.info('WhatsApp Service initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize WhatsApp Service:', error);
      throw new Error(`WhatsApp Service initialization failed: ${error.message}`);
    }
  }

  /**
   * Para o serviço e limpa recursos
   */
  public async dispose(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    logger.info('Disposing WhatsApp Service');

    try {
      // Parar health checks
      this.healthCheck.dispose();

      // Parar processamento de mensagens
      await this.messageQueue.dispose();

      // Dispose WhatsApp Manager
      await this.whatsappManager.dispose();

      // Fechar conexão Redis
      await this.redis.quit();

      this.isInitialized = false;
      logger.info('WhatsApp Service disposed successfully');
    } catch (error: any) {
      logger.error('Error disposing WhatsApp Service:', error);
    }
  }

  // === CONNECTION MANAGEMENT ===

  /**
   * Conecta uma instância WhatsApp
   */
  public async connect(instanceId: string, businessId: string): Promise<QRCodeData | ConnectionStatus> {
    this.ensureInitialized();

    try {
      logger.info(`Connecting WhatsApp instance: ${instanceId}`);

      const result = await this.whatsappManager.connect(instanceId, businessId);

      // Configurar event handlers para esta instância
      this.setupInstanceEventHandlers(instanceId);

      logger.info(`WhatsApp instance connected: ${instanceId}`, {
        isQRCode: 'qrCode' in result
      });

      return result;
    } catch (error: any) {
      logger.error(`Failed to connect instance ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Desconecta uma instância WhatsApp
   */
  public async disconnect(instanceId: string): Promise<void> {
    this.ensureInitialized();

    try {
      logger.info(`Disconnecting WhatsApp instance: ${instanceId}`);
      await this.whatsappManager.disconnect(instanceId);
      logger.info(`WhatsApp instance disconnected: ${instanceId}`);
    } catch (error: any) {
      logger.error(`Failed to disconnect instance ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtém status de conexão de uma instância
   */
  public async getConnectionStatus(instanceId: string): Promise<ConnectionStatus | null> {
    this.ensureInitialized();
    return this.whatsappManager.getConnectionStatus(instanceId);
  }

  /**
   * Obtém QR Code de uma instância
   */
  public async getQRCode(instanceId: string): Promise<QRCodeData | null> {
    this.ensureInitialized();
    return this.whatsappManager.getQRCode(instanceId);
  }

  /**
   * Reinicia uma instância
   */
  public async restart(instanceId: string): Promise<void> {
    this.ensureInitialized();

    try {
      logger.info(`Restarting WhatsApp instance: ${instanceId}`);
      await this.whatsappManager.restart(instanceId);
      logger.info(`WhatsApp instance restarted: ${instanceId}`);
    } catch (error: any) {
      logger.error(`Failed to restart instance ${instanceId}:`, error);
      throw error;
    }
  }

  // === MESSAGING ===

  /**
   * Envia mensagem de texto
   */
  public async sendText(instanceId: string, to: string, text: string): Promise<MessageResult> {
    this.ensureInitialized();

    const messageData: QueueMessageData = {
      instanceId,
      businessId: await this.getBusinessIdByInstance(instanceId),
      type: 'outgoing',
      sendParams: { to, text },
      priority: 1
    };

    const job = await this.messageQueue.addOutgoingMessage(messageData);

    // Aguardar processamento (opcional, para casos síncronos)
    const result = await job.waitUntilFinished(undefined, 30000);
    return result as MessageResult;
  }

  /**
   * Envia mensagem com mídia
   */
  public async sendMedia(instanceId: string, to: string, mediaUrl: string, caption?: string): Promise<MessageResult> {
    this.ensureInitialized();

    const messageData: QueueMessageData = {
      instanceId,
      businessId: await this.getBusinessIdByInstance(instanceId),
      type: 'outgoing',
      sendParams: {
        to,
        media: {
          url: mediaUrl,
          caption,
          mimeType: this.inferMimeType(mediaUrl)
        }
      },
      priority: 1
    };

    const job = await this.messageQueue.addOutgoingMessage(messageData);
    const result = await job.waitUntilFinished(undefined, 30000);
    return result as MessageResult;
  }

  /**
   * Envia mensagem com botões
   */
  public async sendButtons(instanceId: string, to: string, text: string, buttons: Array<{id: string, title: string}>): Promise<MessageResult> {
    this.ensureInitialized();

    const messageData: QueueMessageData = {
      instanceId,
      businessId: await this.getBusinessIdByInstance(instanceId),
      type: 'outgoing',
      sendParams: { to, text, buttons },
      priority: 1
    };

    const job = await this.messageQueue.addOutgoingMessage(messageData);
    const result = await job.waitUntilFinished(undefined, 30000);
    return result as MessageResult;
  }

  /**
   * Agenda mensagem para envio futuro
   */
  public async scheduleMessage(instanceId: string, to: string, text: string, sendAt: Date): Promise<string> {
    this.ensureInitialized();

    const delay = sendAt.getTime() - Date.now();
    if (delay <= 0) {
      throw new Error('Schedule time must be in the future');
    }

    const messageData: QueueMessageData = {
      instanceId,
      businessId: await this.getBusinessIdByInstance(instanceId),
      type: 'outgoing',
      sendParams: { to, text },
      delay,
      priority: 2,
      metadata: {
        scheduled: true,
        scheduledFor: sendAt
      }
    };

    const job = await this.messageQueue.scheduleMessage(messageData, delay);
    return job.id!;
  }

  // === INSTANCE MANAGEMENT ===

  /**
   * Lista todas as instâncias
   */
  public async listInstances(): Promise<any[]> {
    this.ensureInitialized();
    return this.whatsappManager.listInstances();
  }

  /**
   * Obtém informações de uma instância
   */
  public async getInstanceInfo(instanceId: string): Promise<any> {
    this.ensureInitialized();
    return this.whatsappManager.getInstanceInfo(instanceId);
  }

  // === HEALTH & MONITORING ===

  /**
   * Obtém status de saúde do sistema
   */
  public async getHealthStatus(): Promise<any> {
    this.ensureInitialized();
    return this.healthCheck.getHealthStatus();
  }

  /**
   * Obtém métricas do sistema
   */
  public async getMetrics(): Promise<any> {
    this.ensureInitialized();

    const [whatsappMetrics, queueStats] = await Promise.all([
      this.whatsappManager.getMetrics(),
      this.messageQueue.getQueueStats()
    ]);

    return {
      whatsapp: whatsappMetrics,
      queue: queueStats,
      timestamp: new Date()
    };
  }

  /**
   * Força tentativa de recuperação do sistema
   */
  public async forceRecovery(): Promise<void> {
    this.ensureInitialized();
    await this.healthCheck.attemptRecovery();
  }

  // === QUEUE MANAGEMENT ===

  /**
   * Pausa processamento de mensagens
   */
  public async pauseMessageProcessing(): Promise<void> {
    this.ensureInitialized();
    await this.messageQueue.pauseQueues();
    logger.info('Message processing paused');
  }

  /**
   * Resume processamento de mensagens
   */
  public async resumeMessageProcessing(): Promise<void> {
    this.ensureInitialized();
    await this.messageQueue.resumeQueues();
    logger.info('Message processing resumed');
  }

  /**
   * Limpa filas de mensagens
   */
  public async clearMessageQueues(): Promise<void> {
    this.ensureInitialized();
    await this.messageQueue.clearQueues();
    logger.info('Message queues cleared');
  }

  /**
   * Reprocessa mensagens falhadas
   */
  public async retryFailedMessages(): Promise<{ incoming: number, outgoing: number }> {
    this.ensureInitialized();

    const [incoming, outgoing] = await Promise.all([
      this.messageQueue.retryFailedJobs('incoming'),
      this.messageQueue.retryFailedJobs('outgoing')
    ]);

    logger.info('Failed messages retry completed', { incoming, outgoing });
    return { incoming, outgoing };
  }

  // === EVENT HANDLERS ===

  /**
   * Registra handler para mensagens recebidas
   */
  public onMessage(instanceId: string, handler: (message: IncomingMessage) => void): void {
    this.ensureInitialized();
    this.whatsappManager.onMessage(instanceId, handler);
  }

  /**
   * Registra handler para mudanças de status
   */
  public onStatusChange(instanceId: string, handler: (status: ConnectionStatus) => void): void {
    this.ensureInitialized();
    this.whatsappManager.onStatusChange(instanceId, handler);
  }

  // === PRIVATE METHODS ===

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('WhatsApp Service not initialized. Call initialize() first.');
    }
  }

  private setupEventHandlers(): void {
    // Event handlers globais serão configurados aqui
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, gracefully shutting down');
      this.dispose().then(() => {
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, gracefully shutting down');
      this.dispose().then(() => {
        process.exit(0);
      });
    });
  }

  private setupMessageHandlers(): void {
    // Configurar handlers para processar mensagens nas filas
    this.messageQueue.onIncomingMessage(async (data: QueueMessageData) => {
      await this.messageProcessor.processIncomingMessage(data);
    });

    this.messageQueue.onOutgoingMessage(async (data: QueueMessageData) => {
      return this.messageProcessor.processOutgoingMessage(data);
    });

    logger.debug('Message handlers configured');
  }

  private setupInstanceEventHandlers(instanceId: string): void {
    // Handler para mensagens recebidas - adicionar à fila
    this.whatsappManager.onMessage(instanceId, async (message: IncomingMessage) => {
      try {
        const businessId = await this.getBusinessIdByInstance(instanceId);

        const messageData: QueueMessageData = {
          instanceId,
          businessId,
          type: 'incoming',
          message
        };

        await this.messageQueue.addIncomingMessage(messageData);

        logger.debug('Incoming message queued', {
          instanceId,
          messageId: message.id,
          from: message.from
        });
      } catch (error: any) {
        logger.error('Failed to queue incoming message:', error);
      }
    });

    // Handler para mudanças de status
    this.whatsappManager.onStatusChange(instanceId, (status: ConnectionStatus) => {
      logger.info(`Instance ${instanceId} status changed`, status);

      // Aqui você pode adicionar lógica para notificar clientes via WebSocket
      // ou salvar mudanças de status no banco de dados
    });
  }

  private async getBusinessIdByInstance(instanceId: string): Promise<string> {
    try {
      const instanceInfo = await this.whatsappManager.getInstanceInfo(instanceId);
      return instanceInfo?.businessId || 'unknown';
    } catch (error) {
      logger.warn(`Failed to get business ID for instance ${instanceId}`);
      return 'unknown';
    }
  }

  private inferMimeType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }
}

// Singleton instance
let whatsappServiceInstance: WhatsAppService | null = null;

/**
 * Obtém instância singleton do WhatsApp Service
 */
export function getWhatsAppService(config?: WhatsAppServiceConfig): WhatsAppService {
  if (!whatsappServiceInstance) {
    whatsappServiceInstance = new WhatsAppService(config);
  }
  return whatsappServiceInstance;
}

/**
 * Inicializa o WhatsApp Service
 */
export async function initializeWhatsAppService(config?: WhatsAppServiceConfig): Promise<WhatsAppService> {
  const service = getWhatsAppService(config);

  if (!service['isInitialized']) {
    await service.initialize();
  }

  return service;
}