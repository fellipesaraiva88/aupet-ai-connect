import {
  IWhatsAppProvider,
  ConnectionStatus,
  QRCodeData,
  MessageResult,
  IncomingMessage,
  MediaMessage,
  SendMessageParams,
  ProviderConfig,
  SessionData
} from './IWhatsAppProvider';
import { EvolutionAPIService } from '../../evolution';
import { logger } from '../../../utils/logger';

export class EvolutionProvider implements IWhatsAppProvider {
  public readonly name = 'evolution';
  public readonly config: ProviderConfig;

  private evolutionService: EvolutionAPIService;
  private messageHandlers = new Map<string, (message: IncomingMessage) => void>();
  private statusHandlers = new Map<string, (status: ConnectionStatus) => void>();
  private qrCodeHandlers = new Map<string, (qrCode: QRCodeData) => void>();

  constructor(config?: Partial<ProviderConfig>) {
    this.config = {
      name: 'evolution',
      priority: 1,
      enabled: true,
      retryAttempts: 3,
      timeout: 30000,
      rateLimit: {
        messagesPerMinute: 60,
        burstLimit: 10
      },
      ...config
    };

    this.evolutionService = new EvolutionAPIService();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Evolution Provider');

    // Verificar se Evolution API está acessível
    const isHealthy = await this.evolutionService.healthCheck();
    if (!isHealthy) {
      throw new Error('Evolution API is not accessible');
    }

    logger.info('Evolution Provider initialized successfully');
  }

  async dispose(): Promise<void> {
    logger.info('Disposing Evolution Provider');
    this.messageHandlers.clear();
    this.statusHandlers.clear();
    this.qrCodeHandlers.clear();
  }

  async connect(instanceId: string, businessId: string): Promise<QRCodeData | ConnectionStatus> {
    try {
      logger.info(`Connecting Evolution instance: ${instanceId} for business: ${businessId}`);

      // Verificar se instância já existe
      const instances = await this.evolutionService.fetchInstances();
      const existingInstance = instances.find(i => i.instanceName === instanceId);

      if (existingInstance) {
        const status = await this.getConnectionStatus(instanceId);
        if (status.state === 'connected') {
          return status;
        }
      } else {
        // Criar nova instância
        await this.evolutionService.createInstance(businessId);
      }

      // Tentar conectar e obter QR Code
      const qrCode = await this.evolutionService.connectInstance(instanceId);

      return {
        qrCode,
        base64: qrCode,
        url: `data:image/png;base64,${qrCode}`
      };
    } catch (error: any) {
      logger.error(`Failed to connect Evolution instance ${instanceId}:`, error);
      throw new Error(`Evolution connection failed: ${error.message}`);
    }
  }

  async disconnect(instanceId: string): Promise<void> {
    try {
      logger.info(`Disconnecting Evolution instance: ${instanceId}`);
      await this.evolutionService.deleteInstance(instanceId);

      // Limpar handlers
      this.messageHandlers.delete(instanceId);
      this.statusHandlers.delete(instanceId);
      this.qrCodeHandlers.delete(instanceId);
    } catch (error: any) {
      logger.error(`Failed to disconnect Evolution instance ${instanceId}:`, error);
      throw new Error(`Evolution disconnect failed: ${error.message}`);
    }
  }

  async restart(instanceId: string): Promise<void> {
    try {
      logger.info(`Restarting Evolution instance: ${instanceId}`);
      await this.evolutionService.restartInstance(instanceId);
    } catch (error: any) {
      logger.error(`Failed to restart Evolution instance ${instanceId}:`, error);
      throw new Error(`Evolution restart failed: ${error.message}`);
    }
  }

  async getConnectionStatus(instanceId: string): Promise<ConnectionStatus> {
    try {
      const state = await this.evolutionService.getConnectionState(instanceId);

      // Mapear status do Evolution para nossa interface
      const statusMap: Record<string, ConnectionStatus['state']> = {
        'open': 'connected',
        'connecting': 'connecting',
        'close': 'disconnected',
        'reconnecting': 'reconnecting'
      };

      return {
        state: statusMap[state] || 'disconnected',
        isAuthenticated: state === 'open',
        lastSeen: new Date()
      };
    } catch (error: any) {
      logger.error(`Failed to get status for Evolution instance ${instanceId}:`, error);
      return {
        state: 'failed',
        isAuthenticated: false,
        error: error.message
      };
    }
  }

  async getQRCode(instanceId: string): Promise<QRCodeData | null> {
    try {
      const qrCode = await this.evolutionService.getQRCode(instanceId);

      if (!qrCode) {
        return null;
      }

      return {
        qrCode,
        base64: qrCode,
        url: `data:image/png;base64,${qrCode}`
      };
    } catch (error: any) {
      logger.error(`Failed to get QR code for Evolution instance ${instanceId}:`, error);
      return null;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      return await this.evolutionService.healthCheck();
    } catch {
      return false;
    }
  }

  async sendMessage(instanceId: string, params: SendMessageParams): Promise<MessageResult> {
    try {
      let result: any;

      if (params.text && !params.media) {
        // Mensagem de texto
        result = await this.evolutionService.sendText(instanceId, params.to, params.text);
      } else if (params.media) {
        // Mensagem de mídia
        const mediaType = this.getMediaType(params.media.mimeType);
        result = await this.evolutionService.sendMedia(
          instanceId,
          params.to,
          params.media.url || '',
          params.media.caption,
          mediaType
        );
      } else if (params.buttons) {
        // Mensagem com botões
        result = await this.evolutionService.sendButtons(
          instanceId,
          params.to,
          params.text || '',
          params.buttons
        );
      } else if (params.list) {
        // Mensagem com lista
        result = await this.evolutionService.sendList(
          instanceId,
          params.to,
          params.text || '',
          params.list.buttonText,
          params.list.sections
        );
      } else {
        throw new Error('Invalid message parameters');
      }

      return {
        id: result.messageId || result.id || Date.now().toString(),
        status: 'sent',
        timestamp: new Date()
      };
    } catch (error: any) {
      logger.error(`Failed to send message via Evolution:`, error);
      return {
        id: Date.now().toString(),
        status: 'failed',
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  async sendText(instanceId: string, to: string, text: string): Promise<MessageResult> {
    return this.sendMessage(instanceId, { to, text });
  }

  async sendMedia(instanceId: string, to: string, media: MediaMessage): Promise<MessageResult> {
    return this.sendMessage(instanceId, { to, media });
  }

  async saveSession(instanceId: string, sessionData: any): Promise<void> {
    // Evolution API gerencia sessões internamente
    logger.debug(`Session data for ${instanceId} handled by Evolution API`);
  }

  async loadSession(instanceId: string): Promise<any> {
    // Evolution API gerencia sessões internamente
    logger.debug(`Loading session for ${instanceId} from Evolution API`);
    return null;
  }

  async deleteSession(instanceId: string): Promise<void> {
    // Evolution API gerencia sessões internamente
    await this.evolutionService.deleteInstance(instanceId);
  }

  onMessage(instanceId: string, handler: (message: IncomingMessage) => void): void {
    this.messageHandlers.set(instanceId, handler);
    logger.debug(`Message handler registered for instance: ${instanceId}`);
  }

  onStatusChange(instanceId: string, handler: (status: ConnectionStatus) => void): void {
    this.statusHandlers.set(instanceId, handler);
    logger.debug(`Status change handler registered for instance: ${instanceId}`);
  }

  onQRCodeUpdated(instanceId: string, handler: (qrCode: QRCodeData) => void): void {
    this.qrCodeHandlers.set(instanceId, handler);
    logger.debug(`QR code handler registered for instance: ${instanceId}`);
  }

  async listInstances(): Promise<string[]> {
    try {
      const instances = await this.evolutionService.fetchInstances();
      return instances.map(i => i.instanceName);
    } catch (error: any) {
      logger.error('Failed to list Evolution instances:', error);
      return [];
    }
  }

  async instanceExists(instanceId: string): Promise<boolean> {
    try {
      const instances = await this.listInstances();
      return instances.includes(instanceId);
    } catch {
      return false;
    }
  }

  async setWebhook(instanceId: string, url: string): Promise<void> {
    try {
      await this.evolutionService.setWebhook(instanceId, url);
    } catch (error: any) {
      logger.error(`Failed to set webhook for ${instanceId}:`, error);
      throw error;
    }
  }

  async removeWebhook(instanceId: string): Promise<void> {
    try {
      // Evolution API não tem endpoint específico para remover webhook
      // Seria necessário setar um webhook vazio ou usar API específica
      logger.warn(`Remove webhook not implemented for Evolution API instance: ${instanceId}`);
    } catch (error: any) {
      logger.error(`Failed to remove webhook for ${instanceId}:`, error);
      throw error;
    }
  }

  async fetchContacts(instanceId: string): Promise<any[]> {
    try {
      return await this.evolutionService.fetchContacts(instanceId);
    } catch (error: any) {
      logger.error(`Failed to fetch contacts for ${instanceId}:`, error);
      return [];
    }
  }

  async fetchChats(instanceId: string): Promise<any[]> {
    try {
      return await this.evolutionService.fetchChats(instanceId);
    } catch (error: any) {
      logger.error(`Failed to fetch chats for ${instanceId}:`, error);
      return [];
    }
  }

  async fetchMessages(instanceId: string, chatId: string, limit = 50): Promise<IncomingMessage[]> {
    try {
      const messages = await this.evolutionService.fetchMessages(instanceId, chatId, limit);

      // Converter mensagens do Evolution para nossa interface
      return messages.map(msg => this.convertEvolutionMessage(msg));
    } catch (error: any) {
      logger.error(`Failed to fetch messages for ${instanceId}:`, error);
      return [];
    }
  }

  // Métodos auxiliares privados

  private getMediaType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  private convertEvolutionMessage(evolutionMsg: any): IncomingMessage {
    return {
      id: evolutionMsg.id || evolutionMsg.messageId,
      from: evolutionMsg.from || evolutionMsg.remoteJid,
      to: evolutionMsg.to || evolutionMsg.participant,
      body: evolutionMsg.body || evolutionMsg.text || evolutionMsg.conversation,
      type: this.getMessageType(evolutionMsg),
      timestamp: new Date(evolutionMsg.timestamp || evolutionMsg.messageTimestamp),
      isFromMe: evolutionMsg.fromMe || false,
      isGroup: (evolutionMsg.from || evolutionMsg.remoteJid || '').includes('@g.us'),
      mediaUrl: evolutionMsg.mediaUrl,
      mimeType: evolutionMsg.mimetype,
      caption: evolutionMsg.caption
    };
  }

  private getMessageType(msg: any): IncomingMessage['type'] {
    if (msg.imageMessage || msg.type === 'image') return 'image';
    if (msg.videoMessage || msg.type === 'video') return 'video';
    if (msg.audioMessage || msg.type === 'audio') return 'audio';
    if (msg.documentMessage || msg.type === 'document') return 'document';
    if (msg.locationMessage || msg.type === 'location') return 'location';
    if (msg.contactMessage || msg.type === 'contact') return 'contact';
    return 'text';
  }

  // Método para processar webhooks do Evolution API
  public handleWebhook(instanceId: string, webhookData: any): void {
    try {
      const { event, data } = webhookData;

      switch (event) {
        case 'MESSAGES_UPSERT':
          this.handleMessageWebhook(instanceId, data);
          break;
        case 'CONNECTION_UPDATE':
          this.handleStatusWebhook(instanceId, data);
          break;
        case 'QRCODE_UPDATED':
          this.handleQRCodeWebhook(instanceId, data);
          break;
        default:
          logger.debug(`Unhandled webhook event: ${event}`);
      }
    } catch (error: any) {
      logger.error(`Error handling webhook for ${instanceId}:`, error);
    }
  }

  private handleMessageWebhook(instanceId: string, data: any): void {
    const handler = this.messageHandlers.get(instanceId);
    if (handler && data.messages) {
      data.messages.forEach((msg: any) => {
        const incomingMessage = this.convertEvolutionMessage(msg);
        handler(incomingMessage);
      });
    }
  }

  private handleStatusWebhook(instanceId: string, data: any): void {
    const handler = this.statusHandlers.get(instanceId);
    if (handler) {
      const status: ConnectionStatus = {
        state: data.state === 'open' ? 'connected' : 'disconnected',
        isAuthenticated: data.state === 'open',
        lastSeen: new Date()
      };
      handler(status);
    }
  }

  private handleQRCodeWebhook(instanceId: string, data: any): void {
    const handler = this.qrCodeHandlers.get(instanceId);
    if (handler && data.qrcode) {
      const qrCodeData: QRCodeData = {
        qrCode: data.qrcode,
        base64: data.qrcode,
        url: `data:image/png;base64,${data.qrcode}`
      };
      handler(qrCodeData);
    }
  }
}