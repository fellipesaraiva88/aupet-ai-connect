import {
  IWhatsAppProvider,
  ConnectionStatus,
  QRCodeData,
  MessageResult,
  IncomingMessage,
  SendMessageParams,
  SessionData
} from '../providers/IWhatsAppProvider';
import { EvolutionProvider } from '../providers/EvolutionProvider';
import { logger } from '../../../utils/logger';
import Redis from 'ioredis';

export interface ManagerConfig {
  primaryProvider: string;
  fallbackProviders: string[];
  retryAttempts: number;
  retryDelay: number;
  healthCheckInterval: number;
  sessionTTL: number;
}

export class WhatsAppManager {
  private providers = new Map<string, IWhatsAppProvider>();
  private sessions = new Map<string, SessionData>();
  private redis: Redis;
  private config: ManagerConfig;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(redisInstance: Redis, config?: Partial<ManagerConfig>) {
    this.redis = redisInstance;
    this.config = {
      primaryProvider: 'evolution',
      fallbackProviders: [],
      retryAttempts: 3,
      retryDelay: 1000,
      healthCheckInterval: 30000, // 30 segundos
      sessionTTL: 86400, // 24 horas
      ...config
    };

    this.setupProviders();
    this.startHealthCheck();

    logger.info('WhatsApp Manager initialized', {
      primaryProvider: this.config.primaryProvider,
      fallbackProviders: this.config.fallbackProviders
    });
  }

  private setupProviders(): void {
    // Registrar Evolution Provider como padrão
    const evolutionProvider = new EvolutionProvider();
    this.providers.set('evolution', evolutionProvider);

    logger.info('Providers registered', {
      providers: Array.from(this.providers.keys())
    });
  }

  public registerProvider(name: string, provider: IWhatsAppProvider): void {
    this.providers.set(name, provider);
    logger.info(`Provider registered: ${name}`);
  }

  public async initialize(): Promise<void> {
    logger.info('Initializing WhatsApp Manager');

    // Inicializar todos os providers
    for (const [name, provider] of this.providers) {
      try {
        await provider.initialize();
        logger.info(`Provider ${name} initialized successfully`);
      } catch (error: any) {
        logger.error(`Failed to initialize provider ${name}:`, error);
        // Não falhar se um provider não inicializar
      }
    }

    // Carregar sessões do Redis
    await this.loadSessionsFromCache();

    logger.info('WhatsApp Manager initialization complete');
  }

  public async dispose(): Promise<void> {
    logger.info('Disposing WhatsApp Manager');

    // Parar health check
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Salvar sessões no cache
    await this.saveSessionsToCache();

    // Dispor providers
    for (const [name, provider] of this.providers) {
      try {
        await provider.dispose();
        logger.info(`Provider ${name} disposed`);
      } catch (error: any) {
        logger.error(`Error disposing provider ${name}:`, error);
      }
    }

    this.providers.clear();
    this.sessions.clear();
  }

  // Connection Management

  public async connect(instanceId: string, businessId: string, providerName?: string): Promise<QRCodeData | ConnectionStatus> {
    const session = await this.getOrCreateSession(instanceId, businessId, providerName);
    const provider = this.getProvider(session.provider);

    try {
      const result = await provider.connect(instanceId, businessId);

      // Atualizar sessão
      session.status = typeof result === 'object' && 'state' in result
        ? result as ConnectionStatus
        : { state: 'connecting', isAuthenticated: false };
      session.lastActivity = new Date();

      await this.updateSession(instanceId, session);

      logger.info(`Instance ${instanceId} connection initiated with provider ${session.provider}`);
      return result;
    } catch (error: any) {
      logger.error(`Connection failed for instance ${instanceId}:`, error);

      // Tentar provider de fallback
      return this.tryFallbackProvider(instanceId, businessId, session.provider, 'connect');
    }
  }

  public async disconnect(instanceId: string): Promise<void> {
    const session = this.sessions.get(instanceId);
    if (!session) {
      logger.warn(`No session found for instance ${instanceId}`);
      return;
    }

    const provider = this.getProvider(session.provider);

    try {
      await provider.disconnect(instanceId);

      // Remover sessão
      this.sessions.delete(instanceId);
      await this.redis.del(`session:${instanceId}`);

      logger.info(`Instance ${instanceId} disconnected successfully`);
    } catch (error: any) {
      logger.error(`Failed to disconnect instance ${instanceId}:`, error);
      throw error;
    }
  }

  public async getConnectionStatus(instanceId: string): Promise<ConnectionStatus | null> {
    const session = this.sessions.get(instanceId);
    if (!session) {
      return null;
    }

    const provider = this.getProvider(session.provider);

    try {
      const status = await provider.getConnectionStatus(instanceId);

      // Atualizar cache da sessão
      session.status = status;
      session.lastActivity = new Date();
      await this.updateSession(instanceId, session);

      return status;
    } catch (error: any) {
      logger.error(`Failed to get status for instance ${instanceId}:`, error);
      return {
        state: 'failed',
        isAuthenticated: false,
        error: error.message
      };
    }
  }

  public async getQRCode(instanceId: string): Promise<QRCodeData | null> {
    const session = this.sessions.get(instanceId);
    if (!session) {
      logger.warn(`No session found for instance ${instanceId}`);
      return null;
    }

    const provider = this.getProvider(session.provider);

    try {
      return await provider.getQRCode(instanceId);
    } catch (error: any) {
      logger.error(`Failed to get QR code for instance ${instanceId}:`, error);
      return null;
    }
  }

  // Messaging

  public async sendMessage(instanceId: string, params: SendMessageParams): Promise<MessageResult> {
    const session = this.sessions.get(instanceId);
    if (!session) {
      throw new Error(`No active session for instance ${instanceId}`);
    }

    const provider = this.getProvider(session.provider);

    try {
      const result = await provider.sendMessage(instanceId, params);

      // Atualizar última atividade
      session.lastActivity = new Date();
      await this.updateSession(instanceId, session);

      logger.debug(`Message sent via ${session.provider} for instance ${instanceId}`, {
        messageId: result.id,
        status: result.status
      });

      return result;
    } catch (error: any) {
      logger.error(`Failed to send message for instance ${instanceId}:`, error);

      // Tentar provider de fallback
      return this.tryFallbackProvider(instanceId, session.businessId, session.provider, 'sendMessage', params);
    }
  }

  public async sendText(instanceId: string, to: string, text: string): Promise<MessageResult> {
    return this.sendMessage(instanceId, { to, text });
  }

  // Event Handlers

  public onMessage(instanceId: string, handler: (message: IncomingMessage) => void): void {
    const session = this.sessions.get(instanceId);
    if (!session) {
      logger.warn(`No session found for instance ${instanceId}`);
      return;
    }

    const provider = this.getProvider(session.provider);
    provider.onMessage(instanceId, (message) => {
      // Atualizar última atividade
      session.lastActivity = new Date();
      this.updateSession(instanceId, session);

      handler(message);
    });
  }

  public onStatusChange(instanceId: string, handler: (status: ConnectionStatus) => void): void {
    const session = this.sessions.get(instanceId);
    if (!session) {
      logger.warn(`No session found for instance ${instanceId}`);
      return;
    }

    const provider = this.getProvider(session.provider);
    provider.onStatusChange(instanceId, (status) => {
      // Atualizar status na sessão
      session.status = status;
      session.lastActivity = new Date();
      this.updateSession(instanceId, session);

      handler(status);
    });
  }

  // Instance Management

  public async listInstances(): Promise<SessionData[]> {
    return Array.from(this.sessions.values());
  }

  public async getInstanceInfo(instanceId: string): Promise<SessionData | null> {
    return this.sessions.get(instanceId) || null;
  }

  public async restart(instanceId: string): Promise<void> {
    const session = this.sessions.get(instanceId);
    if (!session) {
      throw new Error(`No session found for instance ${instanceId}`);
    }

    const provider = this.getProvider(session.provider);

    try {
      await provider.restart(instanceId);
      logger.info(`Instance ${instanceId} restarted successfully`);
    } catch (error: any) {
      logger.error(`Failed to restart instance ${instanceId}:`, error);
      throw error;
    }
  }

  // Provider Health Check

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      for (const [name, provider] of this.providers) {
        try {
          const isHealthy = await provider.isHealthy();
          if (!isHealthy) {
            logger.warn(`Provider ${name} is unhealthy`);
          }
        } catch (error: any) {
          logger.error(`Health check failed for provider ${name}:`, error);
        }
      }
    }, this.config.healthCheckInterval);
  }

  // Session Management

  private async getOrCreateSession(instanceId: string, businessId: string, providerName?: string): Promise<SessionData> {
    let session = this.sessions.get(instanceId);

    if (!session) {
      // Tentar carregar do cache
      session = await this.loadSessionFromCache(instanceId);
    }

    if (!session) {
      // Criar nova sessão
      session = {
        instanceId,
        businessId,
        provider: providerName || this.config.primaryProvider,
        status: { state: 'disconnected', isAuthenticated: false },
        lastActivity: new Date()
      };

      this.sessions.set(instanceId, session);
      await this.updateSession(instanceId, session);
    }

    return session;
  }

  private async updateSession(instanceId: string, session: SessionData): Promise<void> {
    this.sessions.set(instanceId, session);

    // Salvar no Redis
    await this.redis.setex(
      `session:${instanceId}`,
      this.config.sessionTTL,
      JSON.stringify(session)
    );
  }

  private async loadSessionFromCache(instanceId: string): Promise<SessionData | null> {
    try {
      const cached = await this.redis.get(`session:${instanceId}`);
      if (cached) {
        const session = JSON.parse(cached) as SessionData;
        session.lastActivity = new Date(session.lastActivity);
        return session;
      }
    } catch (error: any) {
      logger.error(`Failed to load session ${instanceId} from cache:`, error);
    }
    return null;
  }

  private async loadSessionsFromCache(): Promise<void> {
    try {
      const keys = await this.redis.keys('session:*');

      for (const key of keys) {
        const instanceId = key.replace('session:', '');
        const session = await this.loadSessionFromCache(instanceId);

        if (session) {
          this.sessions.set(instanceId, session);
        }
      }

      logger.info(`Loaded ${this.sessions.size} sessions from cache`);
    } catch (error: any) {
      logger.error('Failed to load sessions from cache:', error);
    }
  }

  private async saveSessionsToCache(): Promise<void> {
    try {
      for (const [instanceId, session] of this.sessions) {
        await this.updateSession(instanceId, session);
      }

      logger.info(`Saved ${this.sessions.size} sessions to cache`);
    } catch (error: any) {
      logger.error('Failed to save sessions to cache:', error);
    }
  }

  // Private Helper Methods

  private getProvider(name: string): IWhatsAppProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider not found: ${name}`);
    }
    return provider;
  }

  private async tryFallbackProvider(instanceId: string, businessId: string, failedProvider: string, method: string, ...args: any[]): Promise<any> {
    const fallbackProviders = this.config.fallbackProviders.filter(p => p !== failedProvider);

    for (const providerName of fallbackProviders) {
      try {
        logger.info(`Trying fallback provider ${providerName} for instance ${instanceId}`);

        const provider = this.getProvider(providerName);

        // Atualizar sessão para usar o novo provider
        const session = this.sessions.get(instanceId);
        if (session) {
          session.provider = providerName;
          await this.updateSession(instanceId, session);
        }

        // Executar método
        switch (method) {
          case 'connect':
            return await provider.connect(instanceId, businessId);
          case 'sendMessage':
            return await provider.sendMessage(instanceId, args[0]);
          default:
            throw new Error(`Unsupported fallback method: ${method}`);
        }
      } catch (error: any) {
        logger.error(`Fallback provider ${providerName} also failed:`, error);
        continue;
      }
    }

    throw new Error(`All providers failed for instance ${instanceId}`);
  }

  // Metrics

  public getMetrics(): any {
    const totalSessions = this.sessions.size;
    const connectedSessions = Array.from(this.sessions.values())
      .filter(s => s.status.state === 'connected').length;

    const providerUsage = new Map<string, number>();
    for (const session of this.sessions.values()) {
      providerUsage.set(session.provider, (providerUsage.get(session.provider) || 0) + 1);
    }

    return {
      totalSessions,
      connectedSessions,
      providerUsage: Object.fromEntries(providerUsage),
      providers: Array.from(this.providers.keys())
    };
  }
}