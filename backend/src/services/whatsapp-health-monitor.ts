import { logger } from '../utils/logger';
import { SupabaseService } from './supabase';
import { EvolutionAPIService } from './evolution';
import { WebSocketService } from './websocket';
import { WhatsAppManager } from './whatsapp-manager';

interface HealthCheckResult {
  instanceName: string;
  userId?: string;
  status: 'healthy' | 'unhealthy' | 'disconnected' | 'error';
  lastCheck: Date;
  consecutiveFailures: number;
  uptime: number;
  issues: string[];
}

interface MonitorConfig {
  checkIntervalMs: number;
  maxConsecutiveFailures: number;
  autoReconnect: boolean;
  alertThreshold: number;
}

export class WhatsAppHealthMonitor {
  private supabaseService: SupabaseService;
  private evolutionService: EvolutionAPIService;
  private whatsAppManager: WhatsAppManager;
  private wsService: WebSocketService | null = null;

  private healthStatus: Map<string, HealthCheckResult> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  private config: MonitorConfig = {
    checkIntervalMs: 60000, // 1 minuto
    maxConsecutiveFailures: 3,
    autoReconnect: true,
    alertThreshold: 2
  };

  constructor() {
    this.supabaseService = new SupabaseService();
    this.evolutionService = new EvolutionAPIService();
    this.whatsAppManager = new WhatsAppManager();
  }

  setWebSocketService(wsService: WebSocketService) {
    this.wsService = wsService;
  }

  /**
   * Inicia o monitoramento de saúde
   */
  start(): void {
    if (this.isMonitoring) {
      logger.warn('Health monitor is already running');
      return;
    }

    logger.info('Starting WhatsApp health monitor', {
      checkInterval: this.config.checkIntervalMs,
      autoReconnect: this.config.autoReconnect
    });

    this.isMonitoring = true;

    // Primeira verificação imediata
    this.performHealthCheck().catch(error => {
      logger.error('Initial health check failed:', error);
    });

    // Verificações periódicas
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck().catch(error => {
        logger.error('Health check failed:', error);
      });
    }, this.config.checkIntervalMs);
  }

  /**
   * Para o monitoramento
   */
  stop(): void {
    if (!this.isMonitoring) {
      logger.warn('Health monitor is not running');
      return;
    }

    logger.info('Stopping WhatsApp health monitor');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
  }

  /**
   * Executa verificação de saúde em todas as instâncias
   */
  private async performHealthCheck(): Promise<void> {
    try {
      logger.debug('Performing health check on all instances');

      // Buscar todas as instâncias ativas
      const instances = await this.getActiveInstances();

      if (instances.length === 0) {
        logger.debug('No active instances to monitor');
        return;
      }

      logger.info(`Checking health of ${instances.length} instances`);

      // Verificar cada instância
      const checks = instances.map(instance =>
        this.checkInstanceHealth(instance)
      );

      await Promise.allSettled(checks);

      // Processar resultados e tomar ações
      await this.processHealthResults();

    } catch (error) {
      logger.error('Error during health check:', error);
    }
  }

  /**
   * Busca instâncias ativas do banco
   */
  private async getActiveInstances() {
    const { data, error } = await this.supabaseService['supabase']
      .from('whatsapp_instances')
      .select('*')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching instances for health check:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Verifica saúde de uma instância específica
   */
  private async checkInstanceHealth(instance: any): Promise<void> {
    const instanceName = instance.instance_name;
    const userId = instance.user_id;

    try {
      // Buscar status da Evolution API
      const evolutionStatus = await this.evolutionService.getInstanceStatus(instanceName);

      // Obter ou criar registro de saúde
      let healthRecord = this.healthStatus.get(instanceName);

      if (!healthRecord) {
        healthRecord = {
          instanceName,
          userId,
          status: 'healthy',
          lastCheck: new Date(),
          consecutiveFailures: 0,
          uptime: 0,
          issues: []
        };
        this.healthStatus.set(instanceName, healthRecord);
      }

      // Atualizar verificação
      healthRecord.lastCheck = new Date();
      healthRecord.issues = [];

      // Analisar status
      if (!evolutionStatus) {
        healthRecord.status = 'error';
        healthRecord.consecutiveFailures++;
        healthRecord.issues.push('Instance not found in Evolution API');
      } else {
        const connectionState = evolutionStatus.connectionState || evolutionStatus.status;

        if (connectionState === 'open' || connectionState === 'connected') {
          healthRecord.status = 'healthy';
          healthRecord.consecutiveFailures = 0;
          healthRecord.uptime++;
        } else if (connectionState === 'close' || connectionState === 'disconnected') {
          healthRecord.status = 'disconnected';
          healthRecord.consecutiveFailures++;
          healthRecord.issues.push('Instance is disconnected');
        } else {
          healthRecord.status = 'unhealthy';
          healthRecord.consecutiveFailures++;
          healthRecord.issues.push(`Unknown status: ${connectionState}`);
        }

        // Atualizar status no banco
        await this.supabaseService.updateInstanceStatus(
          instanceName,
          evolutionStatus.status,
          connectionState
        );
      }

      // Alertar se necessário
      if (healthRecord.consecutiveFailures >= this.config.alertThreshold) {
        await this.sendHealthAlert(healthRecord, instance.organization_id);
      }

      // Auto-reconexão se configurado
      if (
        this.config.autoReconnect &&
        healthRecord.status === 'disconnected' &&
        healthRecord.consecutiveFailures >= this.config.maxConsecutiveFailures
      ) {
        await this.attemptAutoReconnect(instanceName, userId, instance.organization_id);
      }

      logger.debug(`Health check completed for ${instanceName}`, {
        status: healthRecord.status,
        consecutiveFailures: healthRecord.consecutiveFailures,
        issues: healthRecord.issues
      });

    } catch (error) {
      logger.error(`Error checking health for ${instanceName}:`, error);

      const healthRecord = this.healthStatus.get(instanceName);
      if (healthRecord) {
        healthRecord.status = 'error';
        healthRecord.consecutiveFailures++;
        healthRecord.issues.push(error.message || 'Health check failed');
      }
    }
  }

  /**
   * Processa resultados e gera relatório
   */
  private async processHealthResults(): Promise<void> {
    const summary = {
      total: this.healthStatus.size,
      healthy: 0,
      unhealthy: 0,
      disconnected: 0,
      errors: 0
    };

    for (const record of this.healthStatus.values()) {
      switch (record.status) {
        case 'healthy':
          summary.healthy++;
          break;
        case 'unhealthy':
          summary.unhealthy++;
          break;
        case 'disconnected':
          summary.disconnected++;
          break;
        case 'error':
          summary.errors++;
          break;
      }
    }

    logger.info('Health check summary', summary);

    // Alertar se houver problemas críticos
    if (summary.disconnected > 0 || summary.errors > 0) {
      logger.warn('Health issues detected', {
        disconnected: summary.disconnected,
        errors: summary.errors
      });
    }
  }

  /**
   * Envia alerta de saúde
   */
  private async sendHealthAlert(
    healthRecord: HealthCheckResult,
    organizationId: string
  ): Promise<void> {
    try {
      if (!this.wsService) {
        logger.warn('Cannot send health alert: WebSocket service not set');
        return;
      }

      const message = healthRecord.issues.length > 0
        ? healthRecord.issues.join(', ')
        : 'Instance health check failed';

      // Notificar organização
      this.wsService.sendNotification(organizationId, {
        title: `⚠️ Problema com WhatsApp`,
        message: `Instância ${healthRecord.instanceName}: ${message}`,
        type: 'warning'
      });

      // Notificar usuário específico se disponível
      if (healthRecord.userId) {
        this.wsService.sendUserNotification(healthRecord.userId, {
          title: '⚠️ WhatsApp Desconectado',
          message: 'Seu WhatsApp está com problemas de conexão. Tente reconectar.',
          type: 'warning',
          action: {
            label: 'Reconectar',
            url: '/whatsapp'
          }
        });
      }

      logger.info(`Health alert sent for ${healthRecord.instanceName}`, {
        userId: healthRecord.userId,
        organizationId,
        consecutiveFailures: healthRecord.consecutiveFailures
      });

    } catch (error) {
      logger.error('Error sending health alert:', error);
    }
  }

  /**
   * Tenta reconectar automaticamente
   */
  private async attemptAutoReconnect(
    instanceName: string,
    userId: string,
    organizationId: string
  ): Promise<void> {
    try {
      logger.info(`Attempting auto-reconnect for ${instanceName}`);

      // Resetar contador de falhas durante tentativa de reconexão
      const healthRecord = this.healthStatus.get(instanceName);
      if (healthRecord) {
        healthRecord.consecutiveFailures = 0;
      }

      // Tentar reconectar via WhatsAppManager
      if (userId) {
        await this.whatsAppManager.connectUserWhatsApp(userId, organizationId);

        logger.info(`Auto-reconnect successful for ${instanceName}`);

        // Notificar sucesso
        if (this.wsService && userId) {
          this.wsService.sendUserNotification(userId, {
            title: '✅ WhatsApp Reconectado',
            message: 'Seu WhatsApp foi reconectado automaticamente.',
            type: 'success'
          });
        }
      }

    } catch (error) {
      logger.error(`Auto-reconnect failed for ${instanceName}:`, error);

      // Notificar falha
      if (this.wsService && userId) {
        this.wsService.sendUserNotification(userId, {
          title: '❌ Reconexão Falhou',
          message: 'Não foi possível reconectar seu WhatsApp automaticamente. Por favor, reconecte manualmente.',
          type: 'error',
          action: {
            label: 'Reconectar Agora',
            url: '/whatsapp'
          }
        });
      }
    }
  }

  /**
   * Obtém status de saúde de todas as instâncias
   */
  getHealthStatus(): HealthCheckResult[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Obtém status de saúde de uma instância específica
   */
  getInstanceHealth(instanceName: string): HealthCheckResult | undefined {
    return this.healthStatus.get(instanceName);
  }

  /**
   * Limpa histórico de saúde de instâncias deletadas
   */
  async cleanupDeletedInstances(): Promise<void> {
    try {
      const activeInstances = await this.getActiveInstances();
      const activeNames = new Set(activeInstances.map(i => i.instance_name));

      for (const instanceName of this.healthStatus.keys()) {
        if (!activeNames.has(instanceName)) {
          this.healthStatus.delete(instanceName);
          logger.debug(`Removed health record for deleted instance: ${instanceName}`);
        }
      }
    } catch (error) {
      logger.error('Error cleaning up deleted instances:', error);
    }
  }

  /**
   * Atualiza configuração do monitor
   */
  updateConfig(config: Partial<MonitorConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };

    logger.info('Health monitor config updated', this.config);

    // Reiniciar com nova configuração se já estiver rodando
    if (this.isMonitoring) {
      this.stop();
      this.start();
    }
  }

  /**
   * Força verificação imediata de uma instância
   */
  async forceCheck(instanceName: string): Promise<HealthCheckResult | null> {
    try {
      const { data: instance } = await this.supabaseService['supabase']
        .from('whatsapp_instances')
        .select('*')
        .eq('instance_name', instanceName)
        .single();

      if (!instance) {
        logger.warn(`Instance not found for force check: ${instanceName}`);
        return null;
      }

      await this.checkInstanceHealth(instance);
      return this.healthStatus.get(instanceName) || null;

    } catch (error) {
      logger.error(`Error during force check for ${instanceName}:`, error);
      return null;
    }
  }
}

// Singleton instance
let healthMonitor: WhatsAppHealthMonitor | null = null;

export function getHealthMonitor(): WhatsAppHealthMonitor {
  if (!healthMonitor) {
    healthMonitor = new WhatsAppHealthMonitor();
  }
  return healthMonitor;
}

export function startHealthMonitoring(wsService?: WebSocketService): void {
  const monitor = getHealthMonitor();

  if (wsService) {
    monitor.setWebSocketService(wsService);
  }

  monitor.start();

  logger.info('WhatsApp health monitoring started');
}

export function stopHealthMonitoring(): void {
  const monitor = getHealthMonitor();
  monitor.stop();

  logger.info('WhatsApp health monitoring stopped');
}