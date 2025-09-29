import { EvolutionAPIService } from './evolution';
import { SupabaseService } from './supabase';
import { WebSocketService } from './websocket';
import { logger } from '../utils/logger';

export interface UserWhatsAppStatus {
  status: 'connected' | 'connecting' | 'disconnected' | 'waiting_qr';
  needsQR: boolean;
  phoneNumber?: string;
  instanceName?: string;
  lastUpdate: string;
}

export interface WhatsAppInstance {
  id: string;
  name: string;
  userId: string;
  status: string;
  phoneNumber?: string;
  created_at: string;
  updated_at: string;
}

export class WhatsAppManager {
  private evolutionService: EvolutionAPIService;
  private supabaseService: SupabaseService;

  constructor() {
    this.evolutionService = new EvolutionAPIService();
    this.supabaseService = new SupabaseService();
  }

  /**
   * Garante que o usuário tenha uma instância (cria se necessário)
   */
  async ensureUserInstance(userId: string, organizationId: string): Promise<WhatsAppInstance> {
    try {
      // Primeiro verifica se já existe uma instância para o usuário
      const existing = await this.findUserInstance(userId);
      if (existing) {
        logger.info('Instance found for user', { userId, instanceName: existing.name });
        return existing;
      }

      // Cria nova instância automaticamente
      return await this.createUserInstance(userId, organizationId);
    } catch (error) {
      logger.error('Error ensuring user instance:', error);
      throw new Error('Falha ao preparar instância WhatsApp');
    }
  }

  /**
   * Busca instância existente do usuário
   */
  async findUserInstance(userId: string): Promise<WhatsAppInstance | null> {
    try {
      const instanceName = this.generateInstanceName(userId);

      // Busca primeiro no banco local
      const localInstance = await this.supabaseService.getInstanceByName(instanceName);
      if (localInstance) {
        return {
          id: localInstance.id,
          name: localInstance.name,
          userId: userId,
          status: localInstance.status,
          phoneNumber: localInstance.phone_number,
          created_at: localInstance.created_at,
          updated_at: localInstance.updated_at
        };
      }

      // Se não encontrou no banco, verifica na Evolution API
      const evolutionInstances = await this.evolutionService.fetchInstances();
      const evolutionInstance = evolutionInstances.find(inst =>
        inst.instanceName === instanceName ||
        inst.instanceName?.includes(userId) ||
        inst.instanceName?.startsWith(`auzap_${userId}`)
      );

      if (evolutionInstance) {
        // Salva no banco local para próximas consultas
        const savedInstance = await this.supabaseService.createInstance({
          name: instanceName,
          business_id: userId,
          status: evolutionInstance.status || 'created',
          organization_id: 'default', // Será atualizado posteriormente
          phone_number: evolutionInstance.instanceName
        });

        return {
          id: savedInstance.id,
          name: instanceName,
          userId: userId,
          status: evolutionInstance.status || 'created',
          phoneNumber: evolutionInstance.instanceName,
          created_at: savedInstance.created_at,
          updated_at: savedInstance.updated_at
        };
      }

      return null;
    } catch (error) {
      logger.error('Error finding user instance:', error);
      return null;
    }
  }

  /**
   * Cria nova instância para o usuário
   */
  async createUserInstance(userId: string, organizationId: string): Promise<WhatsAppInstance> {
    try {
      const instanceName = this.generateInstanceName(userId);

      logger.info('Creating new instance for user', { userId, instanceName });

      // Cria instância na Evolution API
      const evolutionInstance = await this.evolutionService.createInstance(instanceName);

      // Configura webhook específico para o usuário
      const webhookUrl = `${process.env.WEBHOOK_URL}/api/webhook/user/${userId}`;
      await this.evolutionService.setWebhook(instanceName, webhookUrl);

      // Salva no banco local
      const savedInstance = await this.supabaseService.createInstance({
        name: instanceName,
        business_id: userId,
        status: evolutionInstance.status,
        organization_id: organizationId
      });

      logger.info('Instance created successfully', {
        userId,
        instanceName,
        instanceId: savedInstance.id
      });

      return {
        id: savedInstance.id,
        name: instanceName,
        userId: userId,
        status: evolutionInstance.status,
        created_at: savedInstance.created_at,
        updated_at: savedInstance.updated_at
      };
    } catch (error) {
      logger.error('Error creating user instance:', error);
      throw new Error('Falha ao criar instância WhatsApp');
    }
  }

  /**
   * Obtém status atual do WhatsApp do usuário
   */
  async getUserWhatsAppStatus(userId: string): Promise<UserWhatsAppStatus> {
    try {
      const instance = await this.findUserInstance(userId);

      if (!instance) {
        return {
          status: 'disconnected',
          needsQR: false,
          lastUpdate: new Date().toISOString()
        };
      }

      // Verifica status atual na Evolution API
      const connectionState = await this.evolutionService.getConnectionState(instance.name);
      const simplifiedStatus = this.simplifyStatus(connectionState);

      // Busca número do telefone se conectado
      let phoneNumber = instance.phoneNumber;
      if (simplifiedStatus === 'connected' && !phoneNumber) {
        try {
          const evolutionInstances = await this.evolutionService.fetchInstances();
          const currentInstance = evolutionInstances.find(inst =>
            inst.instanceName === instance.name
          );
          if (currentInstance && currentInstance.instanceName) {
            phoneNumber = this.extractPhoneNumber(currentInstance.instanceName);
          }
        } catch (error) {
          logger.warn('Could not fetch phone number:', error);
        }
      }

      return {
        status: simplifiedStatus,
        needsQR: simplifiedStatus === 'disconnected' || simplifiedStatus === 'waiting_qr',
        phoneNumber,
        instanceName: instance.name,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting user WhatsApp status:', error);
      return {
        status: 'disconnected',
        needsQR: false,
        lastUpdate: new Date().toISOString()
      };
    }
  }

  /**
   * Inicia conexão WhatsApp (com QR Code)
   */
  async connectUserWhatsApp(userId: string, organizationId: string): Promise<{ qrCode?: string; message: string }> {
    try {
      // Garante que a instância existe
      const instance = await this.ensureUserInstance(userId, organizationId);

      logger.info('Starting WhatsApp connection', { userId, instanceName: instance.name });

      // Inicia conexão e obtém QR Code
      const qrCode = await this.evolutionService.connectInstance(instance.name);

      // Atualiza status no banco
      await this.supabaseService.updateInstanceStatus(instance.name, 'connecting');

      if (qrCode) {
        return {
          qrCode,
          message: 'Escaneie o QR Code no seu WhatsApp'
        };
      } else {
        return {
          message: 'Iniciando conexão WhatsApp...'
        };
      }
    } catch (error) {
      logger.error('Error connecting user WhatsApp:', error);
      throw new Error('Falha ao conectar WhatsApp');
    }
  }

  /**
   * Obtém QR Code atual
   */
  async getUserQRCode(userId: string): Promise<{ qrCode?: string; available: boolean }> {
    try {
      const instance = await this.findUserInstance(userId);

      if (!instance) {
        return { available: false };
      }

      const qrCode = await this.evolutionService.getQRCode(instance.name);

      return {
        qrCode: qrCode || undefined,
        available: !!qrCode
      };
    } catch (error) {
      logger.error('Error getting user QR code:', error);
      return { available: false };
    }
  }

  /**
   * Desconecta WhatsApp do usuário
   */
  async disconnectUserWhatsApp(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const instance = await this.findUserInstance(userId);

      if (!instance) {
        return {
          success: false,
          message: 'Nenhuma instância encontrada'
        };
      }

      // Faz logout na Evolution API (mas mantém a instância)
      const success = await this.evolutionService.deleteInstance(instance.name);

      if (success) {
        // Atualiza status no banco
        await this.supabaseService.updateInstanceStatus(instance.name, 'disconnected');

        return {
          success: true,
          message: 'WhatsApp desconectado com sucesso'
        };
      } else {
        return {
          success: false,
          message: 'Falha ao desconectar WhatsApp'
        };
      }
    } catch (error) {
      logger.error('Error disconnecting user WhatsApp:', error);
      return {
        success: false,
        message: 'Erro interno ao desconectar'
      };
    }
  }

  /**
   * Gera nome padronizado da instância
   */
  private generateInstanceName(userId: string): string {
    // Formato: user_{userId}
    return `user_${userId}`;
  }

  /**
   * Simplifica status da Evolution API para o frontend
   */
  private simplifyStatus(evolutionState: string): UserWhatsAppStatus['status'] {
    const statusMap: Record<string, UserWhatsAppStatus['status']> = {
      'open': 'connected',
      'connecting': 'connecting',
      'closed': 'disconnected',
      'qr': 'waiting_qr',
      'disconnected': 'disconnected'
    };

    return statusMap[evolutionState] || 'disconnected';
  }

  /**
   * Extrai número do telefone de dados da instância
   */
  private extractPhoneNumber(instanceData: string): string | undefined {
    // Implementar lógica para extrair número do telefone dos dados da Evolution
    // Por enquanto retorna undefined, será implementado conforme dados reais
    return undefined;
  }

  /**
   * Migra instâncias antigas para o novo formato
   */
  async migrateOldInstances(): Promise<{ migrated: number; errors: number }> {
    let migrated = 0;
    let errors = 0;

    try {
      // Buscar todas as instâncias da Evolution
      const instances = await this.evolutionService.fetchInstances();

      for (const instance of instances) {
        try {
          // Verifica se é instância no formato antigo
          if (instance.instanceName?.startsWith('auzap_')) {
            const businessId = instance.instanceName.replace('auzap_', '');

            // Buscar usuário correspondente (implementar lógica específica)
            // Por enquanto, assumindo que businessId corresponde ao userId
            const userId = businessId;
            const newInstanceName = this.generateInstanceName(userId);

            // Salvar no banco com novo formato
            await this.supabaseService.createInstance({
              name: newInstanceName,
              business_id: userId,
              status: instance.status || 'created',
              organization_id: 'migrated'
            });

            migrated++;
            logger.info('Instance migrated', {
              oldName: instance.instanceName,
              newName: newInstanceName
            });
          }
        } catch (error) {
          errors++;
          logger.error('Error migrating instance:', error);
        }
      }

      logger.info('Migration completed', { migrated, errors });
      return { migrated, errors };
    } catch (error) {
      logger.error('Error during migration:', error);
      return { migrated, errors: errors + 1 };
    }
  }
}