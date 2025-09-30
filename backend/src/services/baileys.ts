import { WASocket, DisconnectReason, delay as baileysDelay, downloadMediaMessage, proto } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { logger } from '../utils/logger';
import { AuthManager } from './baileys/auth-manager';
import { BaileysEventHandlers } from './baileys/event-handlers';
import { StoreManager } from './baileys/store-manager';
import { ConnectionManager } from './baileys/connection-manager';
import {
  formatPhoneToJID,
  formatJIDToPhone,
  isGroupJID,
  getMessageText,
  getMessageType
} from './baileys/utils';
import type {
  BaileysInstanceInfo,
  SendMessageOptions,
  SendMediaOptions,
  ChatModification
} from './baileys/types';

/**
 * Baileys Service - Service principal para gerenciar WhatsApp
 * Substitui Evolution API com implementação nativa e otimizada
 */
export class BaileysService {
  private authManager: AuthManager;
  private storeManager: StoreManager;
  private connectionManager: ConnectionManager;
  public eventHandlers: BaileysEventHandlers;

  private messageStore: Map<string, Map<string, proto.IWebMessageInfo>>; // userId -> messageId -> message

  constructor() {
    this.authManager = new AuthManager();
    this.storeManager = new StoreManager();
    this.connectionManager = new ConnectionManager();
    this.eventHandlers = new BaileysEventHandlers();
    this.messageStore = new Map();

    logger.info('Baileys Service initialized');
  }

  /**
   * Cria ou reconecta instância para um usuário
   */
  async createInstance(userId: string): Promise<void> {
    try {
      // Verificar se já existe conexão
      if (this.connectionManager.hasConnection(userId)) {
        logger.info('Instance already exists', { userId });
        return;
      }

      // Carregar estado de autenticação
      const { state, saveCreds } = await this.authManager.getAuthState(userId);

      // Criar socket
      const sock = this.connectionManager.createSocket({
        auth: state,
        // getMessage para retry system e poll decryption
        getMessage: async (key) => {
          return await this.getMessageFromStore(userId, key);
        }
      });

      // Adicionar ao pool de conexões
      this.connectionManager.addConnection(userId, sock);

      // Setup event handlers
      this.eventHandlers.setupHandlers(sock, userId, saveCreds);

      // Bind store para mensagens/chats
      this.storeManager.bindStore(userId, sock);

      // Setup reconexão automática
      this.setupReconnection(userId, sock);

      // Salvar mensagens no store para retry/poll
      this.setupMessageStore(userId, sock);

      logger.info('Instance created successfully', { userId });
    } catch (error) {
      logger.error('Error creating instance:', error);
      throw new Error(`Falha ao criar instância: ${error}`);
    }
  }

  /**
   * Configura reconexão automática
   */
  private setupReconnection(userId: string, sock: WASocket) {
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'close') {
        // Verificar se deve reconectar
        if (this.connectionManager.shouldReconnect(userId, lastDisconnect)) {
          logger.info('Reconnecting...', { userId });
          await baileysDelay(2000); // Aguardar 2s antes de reconectar
          await this.createInstance(userId);
        } else {
          // Remover do pool
          this.connectionManager.removeConnection(userId);
          await this.storeManager.saveStore(userId);
        }
      } else if (connection === 'open') {
        // Conexão estabelecida
        this.connectionManager.resetReconnectAttempts(userId);
        logger.info('Connection established', { userId });

        // Emitir evento de conexão
        this.eventHandlers.emit('connection:established', { userId });
      }
    });
  }

  /**
   * Salva mensagens no store para getMessage (retry system)
   */
  private setupMessageStore(userId: string, sock: WASocket) {
    // Inicializar store de mensagens do usuário
    if (!this.messageStore.has(userId)) {
      this.messageStore.set(userId, new Map());
    }

    const userStore = this.messageStore.get(userId)!;

    // Salvar mensagens quando chegarem
    sock.ev.on('messages.upsert', ({ messages }) => {
      messages.forEach(msg => {
        if (msg.key.id) {
          userStore.set(msg.key.id, msg);
        }
      });

      // Limitar tamanho do cache (últimas 1000 mensagens)
      if (userStore.size > 1000) {
        const keysToDelete = Array.from(userStore.keys()).slice(0, userStore.size - 1000);
        keysToDelete.forEach(key => userStore.delete(key));
      }
    });
  }

  /**
   * Retorna mensagem do store (para retry system)
   */
  private async getMessageFromStore(userId: string, key: proto.IMessageKey): Promise<proto.IWebMessageInfo | undefined> {
    const userStore = this.messageStore.get(userId);
    if (!userStore || !key.id) return undefined;

    return userStore.get(key.id);
  }

  /**
   * Retorna QR code para conexão (base64)
   */
  async getQRCode(userId: string): Promise<string | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 30000); // 30s timeout

      const qrHandler = ({ userId: qrUserId, qr }: { userId: string; qr: string }) => {
        if (qrUserId === userId) {
          clearTimeout(timeout);
          this.eventHandlers.off('qr:updated', qrHandler);
          resolve(qr);
        }
      };

      this.eventHandlers.on('qr:updated', qrHandler);
    });
  }

  /**
   * Retorna estado da conexão
   */
  getConnectionState(userId: string): 'connected' | 'connecting' | 'disconnected' {
    const sock = this.connectionManager.getConnection(userId);

    if (!sock) return 'disconnected';

    // Verificar se o socket está conectado
    const isConnected = sock.user !== undefined;

    return isConnected ? 'connected' : 'connecting';
  }

  /**
   * Retorna informações da instância
   */
  async getInstanceInfo(userId: string): Promise<BaileysInstanceInfo> {
    const sock = this.connectionManager.getConnection(userId);
    const hasSession = await this.authManager.hasSession(userId);

    return {
      userId,
      status: this.getConnectionState(userId),
      phoneNumber: sock?.user?.id ? formatJIDToPhone(sock.user.id) : undefined,
      qrCode: undefined // QR é emitido via evento
    };
  }

  /**
   * Desconecta instância (logout)
   */
  async disconnectInstance(userId: string): Promise<void> {
    try {
      const sock = this.connectionManager.getConnection(userId);

      if (sock) {
        await sock.logout();
      }

      // Limpar dados
      this.connectionManager.removeConnection(userId);
      await this.authManager.clearAuth(userId);
      await this.storeManager.removeStore(userId);
      this.messageStore.delete(userId);

      logger.info('Instance disconnected', { userId });
    } catch (error) {
      logger.error('Error disconnecting instance:', error);
      throw new Error(`Falha ao desconectar: ${error}`);
    }
  }

  /**
   * Envia mensagem de texto
   */
  async sendText(userId: string, to: string, message: string, options?: SendMessageOptions): Promise<any> {
    const sock = this.connectionManager.getConnection(userId);
    if (!sock) throw new Error('Nenhuma conexão ativa');

    const jid = formatPhoneToJID(to);

    try {
      const sent = await sock.sendMessage(jid, {
        text: message
      }, options);

      logger.info('Text message sent', { userId, to: jid });
      return sent;
    } catch (error) {
      logger.error('Error sending text message:', error);
      throw new Error(`Falha ao enviar mensagem: ${error}`);
    }
  }

  /**
   * Envia mídia (imagem, vídeo, áudio, documento)
   */
  async sendMedia(
    userId: string,
    to: string,
    media: Buffer | string,
    type: 'image' | 'video' | 'audio' | 'document',
    options?: SendMediaOptions
  ): Promise<any> {
    const sock = this.connectionManager.getConnection(userId);
    if (!sock) throw new Error('Nenhuma conexão ativa');

    const jid = formatPhoneToJID(to);

    try {
      const messageContent: any = {};

      switch (type) {
        case 'image':
          messageContent.image = typeof media === 'string' ? { url: media } : media;
          if (options?.caption) messageContent.caption = options.caption;
          break;

        case 'video':
          messageContent.video = typeof media === 'string' ? { url: media } : media;
          if (options?.caption) messageContent.caption = options.caption;
          break;

        case 'audio':
          messageContent.audio = typeof media === 'string' ? { url: media } : media;
          messageContent.mimetype = options?.mimetype || 'audio/mp4';
          break;

        case 'document':
          messageContent.document = typeof media === 'string' ? { url: media } : media;
          messageContent.fileName = options?.fileName || 'document';
          messageContent.mimetype = options?.mimetype || 'application/octet-stream';
          break;
      }

      const sent = await sock.sendMessage(jid, messageContent, options);

      logger.info('Media message sent', { userId, to: jid, type });
      return sent;
    } catch (error) {
      logger.error('Error sending media message:', error);
      throw new Error(`Falha ao enviar mídia: ${error}`);
    }
  }

  /**
   * Download de mídia
   */
  async downloadMedia(message: proto.IWebMessageInfo): Promise<Buffer> {
    try {
      const buffer = await downloadMediaMessage(
        message,
        'buffer',
        {},
        { logger: logger as any }
      );

      return buffer as Buffer;
    } catch (error) {
      logger.error('Error downloading media:', error);
      throw new Error(`Falha ao baixar mídia: ${error}`);
    }
  }

  /**
   * Marca mensagens como lidas
   */
  async readMessages(userId: string, keys: proto.IMessageKey[]): Promise<void> {
    const sock = this.connectionManager.getConnection(userId);
    if (!sock) throw new Error('Nenhuma conexão ativa');

    try {
      await sock.readMessages(keys);
      logger.info('Messages marked as read', { userId, count: keys.length });
    } catch (error) {
      logger.error('Error marking messages as read:', error);
    }
  }

  /**
   * Envia presença (digitando, gravando, etc)
   */
  async sendPresence(userId: string, jid: string, type: 'composing' | 'recording' | 'paused' | 'available' = 'available'): Promise<void> {
    const sock = this.connectionManager.getConnection(userId);
    if (!sock) return;

    try {
      await sock.sendPresenceUpdate(type, formatPhoneToJID(jid));
    } catch (error) {
      logger.warn('Error sending presence (non-critical):', error);
    }
  }

  /**
   * Modifica chat (arquivar, fixar, mutar, etc)
   */
  async modifyChat(userId: string, jid: string, modification: ChatModification): Promise<void> {
    const sock = this.connectionManager.getConnection(userId);
    if (!sock) throw new Error('Nenhuma conexão ativa');

    try {
      await sock.chatModify(modification, formatPhoneToJID(jid));
      logger.info('Chat modified', { userId, jid, modification });
    } catch (error) {
      logger.error('Error modifying chat:', error);
      throw new Error(`Falha ao modificar chat: ${error}`);
    }
  }

  /**
   * Retorna chats
   */
  getChats(userId: string) {
    return this.storeManager.getChats(userId);
  }

  /**
   * Retorna contatos
   */
  getContacts(userId: string) {
    return this.storeManager.getContacts(userId);
  }

  /**
   * Retorna mensagens de um chat
   */
  getMessages(userId: string, jid: string, limit: number = 50) {
    return this.storeManager.getMessages(userId, jid, limit);
  }

  /**
   * Lista todas as instâncias ativas
   */
  listInstances(): string[] {
    return Array.from(this.connectionManager.getAllConnections().keys());
  }

  /**
   * Health check do service
   */
  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Baileys Service...');

    // Salvar todos os stores
    await this.storeManager.saveAllStores();

    // Fechar todas as conexões
    await this.connectionManager.closeAllConnections();

    // Parar auto-save
    this.storeManager.stopAutoSave();

    logger.info('Baileys Service shut down successfully');
  }

  /**
   * Estatísticas
   */
  getStats() {
    return this.connectionManager.getStats();
  }
}