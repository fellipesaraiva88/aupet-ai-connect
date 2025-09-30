import makeWASocket, { DisconnectReason, WASocket, Browsers } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { logger } from '../../utils/logger';
import NodeCache from 'node-cache';

/**
 * Gerencia conexões WebSocket do Baileys
 * Mantém pool de conexões ativas e reconexão automática
 */
export class ConnectionManager {
  private connections: Map<string, WASocket>;
  private reconnectAttempts: Map<string, number>;
  private groupCache: NodeCache;
  private maxReconnectAttempts = 5;

  constructor() {
    this.connections = new Map();
    this.reconnectAttempts = new Map();

    // Cache para metadata de grupos (otimização)
    this.groupCache = new NodeCache({
      stdTTL: 300, // 5 minutos
      checkperiod: 60,
      useClones: false
    });
  }

  /**
   * Adiciona conexão ao pool
   */
  addConnection(userId: string, sock: WASocket): void {
    this.connections.set(userId, sock);
    this.reconnectAttempts.set(userId, 0);

    // Setup cache para grupos
    this.setupGroupCache(userId, sock);

    logger.info('Connection added to pool', { userId, totalConnections: this.connections.size });
  }

  /**
   * Retorna conexão ativa de um usuário
   */
  getConnection(userId: string): WASocket | undefined {
    return this.connections.get(userId);
  }

  /**
   * Remove conexão do pool
   */
  removeConnection(userId: string): void {
    this.connections.delete(userId);
    this.reconnectAttempts.delete(userId);
    logger.info('Connection removed from pool', { userId, totalConnections: this.connections.size });
  }

  /**
   * Verifica se usuário tem conexão ativa
   */
  hasConnection(userId: string): boolean {
    return this.connections.has(userId);
  }

  /**
   * Retorna todas as conexões ativas
   */
  getAllConnections(): Map<string, WASocket> {
    return this.connections;
  }

  /**
   * Verifica se deve reconectar após desconexão
   */
  shouldReconnect(userId: string, lastDisconnect: any): boolean {
    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

    // Não reconectar se foi logout
    if (statusCode === DisconnectReason.loggedOut) {
      logger.info('User logged out, not reconnecting', { userId });
      return false;
    }

    // Verificar tentativas de reconexão
    const attempts = this.reconnectAttempts.get(userId) || 0;
    if (attempts >= this.maxReconnectAttempts) {
      logger.warn('Max reconnect attempts reached', { userId, attempts });
      return false;
    }

    // Incrementar tentativas
    this.reconnectAttempts.set(userId, attempts + 1);

    logger.info('Reconnection allowed', {
      userId,
      attempt: attempts + 1,
      statusCode
    });

    return true;
  }

  /**
   * Reseta contador de tentativas de reconexão
   */
  resetReconnectAttempts(userId: string): void {
    this.reconnectAttempts.set(userId, 0);
  }

  /**
   * Configura cache de grupos para melhor performance
   */
  private setupGroupCache(userId: string, sock: WASocket): void {
    // Cache metadata quando grupos são atualizados
    sock.ev.on('groups.update', async ([event]) => {
      try {
        const metadata = await sock.groupMetadata(event.id);
        this.groupCache.set(`${userId}:${event.id}`, metadata);
      } catch (error) {
        logger.error('Error caching group metadata:', error);
      }
    });

    // Cache metadata quando participantes mudam
    sock.ev.on('group-participants.update', async (event) => {
      try {
        const metadata = await sock.groupMetadata(event.id);
        this.groupCache.set(`${userId}:${event.id}`, metadata);
      } catch (error) {
        logger.error('Error caching group metadata:', error);
      }
    });
  }

  /**
   * Retorna metadata de grupo do cache (otimizado)
   */
  getCachedGroupMetadata(userId: string, groupId: string): any | undefined {
    return this.groupCache.get(`${userId}:${groupId}`);
  }

  /**
   * Cria socket configurado
   */
  createSocket(config: Parameters<typeof makeWASocket>[0]): WASocket {
    return makeWASocket({
      ...config,
      browser: Browsers.ubuntu('Auzap'),
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      // Cache para grupos (melhora performance)
      cachedGroupMetadata: async (jid) => {
        const userId = config.auth?.creds?.me?.id;
        if (userId) {
          return this.getCachedGroupMetadata(userId, jid);
        }
        return undefined;
      }
    });
  }

  /**
   * Fecha todas as conexões (graceful shutdown)
   */
  async closeAllConnections(): Promise<void> {
    const promises = Array.from(this.connections.entries()).map(async ([userId, sock]) => {
      try {
        await sock.logout();
        logger.info('Connection closed gracefully', { userId });
      } catch (error) {
        logger.error('Error closing connection:', error);
      }
    });

    await Promise.all(promises);
    this.connections.clear();
    this.reconnectAttempts.clear();

    logger.info('All connections closed');
  }

  /**
   * Estatísticas de conexões
   */
  getStats() {
    return {
      totalConnections: this.connections.size,
      connections: Array.from(this.connections.keys()),
      cacheSize: this.groupCache.keys().length
    };
  }
}