import { getEvolutionAPIService } from './evolution-api-unified';
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
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = new SupabaseService();
  }

  private getEvolutionService() {
    return getEvolutionAPIService();
  }

  /**
   * Garante que o usuário tenha uma instância (cria se necessário)
   */
  async ensureUserInstance(userId: string, organizationId: string): Promise<WhatsAppInstance> {
    try {
      // Primeiro verifica se já existe uma instância para o usuário
      const existing = await this.findUserInstance(userId, organizationId);
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
  async findUserInstance(userId: string, organizationId?: string): Promise<WhatsAppInstance | null> {
    try {
      const instanceName = this.generateInstanceName(userId);

      logger.info('Finding instance for user', { userId, instanceName });

      // Busca primeiro no banco local
      let localInstance;
      try {
        localInstance = await this.supabaseService.getInstanceByName(instanceName);
        logger.info('Local instance query result', { found: !!localInstance });
      } catch (dbError) {
        logger.error('Error querying local database', { error: dbError });
        localInstance = null;
      }
      if (localInstance) {
        return {
          id: localInstance.id,
          name: localInstance.instance_name, // Campo no banco é instance_name, não name
          userId: userId,
          status: localInstance.status,
          phoneNumber: localInstance.phone_number,
          created_at: localInstance.created_at,
          updated_at: localInstance.updated_at
        };
      }

      // Se não encontrou no banco, verifica na Evolution API
      const evolutionInstances = await this.getEvolutionService().listInstances();

      logger.info('Searching for instance in Evolution API', {
        instanceName,
        userId,
        totalInstances: evolutionInstances.length,
        instanceNames: evolutionInstances.map(i => i.name || i.instanceName).filter(Boolean)
      });

      const evolutionInstance = evolutionInstances.find(inst => {
        const name = inst.name || inst.instanceName;
        return name === instanceName ||
               name?.includes(userId) ||
               name?.startsWith(`user_${userId}`);
      });

      if (evolutionInstance) {
        logger.info('Found instance in Evolution API', {
          instanceName,
          evolutionInstanceName: evolutionInstance.name || evolutionInstance.instanceName,
          connectionStatus: evolutionInstance.connectionStatus,
          status: evolutionInstance.status
        });

        // Salva no banco local para próximas consultas (se organizationId foi fornecido)
        if (!organizationId) {
          logger.warn('Cannot save instance to database without organizationId', { instanceName });
          // Retorna a instância sem salvar no banco
          return {
            id: '', // Temporário - instância existe na Evolution mas não no banco local
            name: instanceName,
            userId: userId,
            status: evolutionInstance.connectionStatus || evolutionInstance.status || 'created',
            phoneNumber: evolutionInstance.number || evolutionInstance.ownerJid,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }

        const savedInstance = await this.supabaseService.createInstance({
          name: instanceName,
          status: evolutionInstance.connectionStatus || evolutionInstance.status || 'created',
          organization_id: organizationId
        });

        return {
          id: savedInstance.id,
          name: instanceName,
          userId: userId,
          status: evolutionInstance.connectionStatus || evolutionInstance.status || 'created',
          phoneNumber: evolutionInstance.number || evolutionInstance.ownerJid,
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
      const evolutionInstance = await this.getEvolutionService().createInstance({ instanceName, qrcode: true });

      // Configura webhook específico para o usuário
      const webhookUrl = `${process.env.WEBHOOK_URL}/api/webhook/user/${userId}`;
      await this.getEvolutionService().setWebhook(instanceName, { enabled: true, url: webhookUrl, webhookByEvents: true });

      // Salva no banco local
      const savedInstance = await this.supabaseService.createInstance({
        name: instanceName,
        status: evolutionInstance.instance.status,
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
        status: evolutionInstance.instance.status,
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
      const connectionState = await this.getEvolutionService().getConnectionState(instance.name);
      const simplifiedStatus = this.simplifyStatus(connectionState.instance.state);

      // Busca número do telefone se conectado
      let phoneNumber = instance.phoneNumber;
      if (simplifiedStatus === 'connected' && !phoneNumber) {
        try {
          const evolutionInstances = await this.getEvolutionService().listInstances();
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
      const connectResponse = await this.getEvolutionService().connect(instance.name);
      // Prioriza base64 (imagem) sobre code (string)
      const qrCode = connectResponse.base64 || connectResponse.qrcode?.base64 || connectResponse.code;

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

      const connectResponse = await this.getEvolutionService().connect(instance.name);
      // Prioriza base64 (imagem) sobre code (string)
      const qrCode = connectResponse.base64 || connectResponse.qrcode?.base64 || connectResponse.code;

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
      await this.getEvolutionService().deleteInstance(instance.name);
      const success = true;

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
      const instances = await this.getEvolutionService().listInstances();

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