import { BaileysService } from './baileys';
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
  private baileysService: BaileysService;
  private supabaseService: SupabaseService;

  constructor() {
    this.baileysService = new BaileysService();
    this.supabaseService = new SupabaseService();
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

        // Atualizar user_id se ainda não estiver definido
        if (!existing.userId) {
          await this.updateInstanceUserId(existing.name, userId);
        }

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
      // Busca primeiro por user_id no banco
      let localInstance = await this.supabaseService.getInstanceByUserId(userId);

      // Se não encontrou, busca pelo nome da instância
      if (!localInstance) {
        const instanceName = this.generateInstanceName(userId);
        localInstance = await this.supabaseService.getInstanceByName(instanceName);
      }

      if (localInstance) {
        return {
          id: localInstance.id,
          name: localInstance.instance_name,
          userId: localInstance.user_id || userId,
          status: localInstance.status,
          phoneNumber: localInstance.phone_number,
          created_at: localInstance.created_at,
          updated_at: localInstance.updated_at
        };
      }

      // Com Baileys, não há API externa para verificar
      // Retorna null se não encontrar no banco
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

      // Cria instância via Baileys
      await this.baileysService.createInstance(userId);

      // Webhooks não são necessários - Baileys usa EventEmitter interno

      // Salva no banco local com user_id
      const savedInstance = await this.supabaseService.createInstance({
        name: instanceName,
        user_id: userId,
        status: 'created',
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
        status: 'created',
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

      // Verifica status atual via Baileys
      const connectionState = this.baileysService.getConnectionState(userId);
      const simplifiedStatus = this.simplifyStatus(connectionState);

      // Busca número do telefone se conectado
      let phoneNumber = instance.phoneNumber;
      if (simplifiedStatus === 'connected' && !phoneNumber) {
        try {
          const instanceInfo = await this.baileysService.getInstanceInfo(userId);
          phoneNumber = instanceInfo.phoneNumber;
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

      // Cria instância Baileys (que gerará QR automaticamente)
      await this.baileysService.createInstance(userId);

      // Aguarda QR Code
      const qrCode = await this.baileysService.getQRCode(userId);

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

      const qrCode = await this.baileysService.getQRCode(userId);

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

      // Desconecta via Baileys (logout)
      await this.baileysService.disconnectInstance(userId);

      // Atualiza status no banco
      await this.supabaseService.updateInstanceStatus(instance.name, 'disconnected');

      return {
        success: true,
        message: 'WhatsApp desconectado com sucesso'
      };
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
   * Atualiza user_id de uma instância
   */
  private async updateInstanceUserId(instanceName: string, userId: string): Promise<void> {
    try {
      await this.supabaseService.updateInstanceUserId(instanceName, userId);
      logger.info('Instance user_id updated', { instanceName, userId });
    } catch (error) {
      logger.error('Error updating instance user_id:', error);
    }
  }

  /**
   * Migra instâncias antigas para o novo formato
   */
  async migrateOldInstances(): Promise<{ migrated: number; errors: number }> {
    let migrated = 0;
    let errors = 0;

    try {
      // Com Baileys, não há API externa - busca instâncias do banco local
      const { data: instances, error } = await this.supabaseService['supabase']
        .from('whatsapp_instances')
        .select('*');

      if (error || !instances) {
        logger.error('Error fetching instances for migration:', error);
        return { migrated: 0, errors: 1 };
      }

      for (const instance of instances) {
        try {
          // Verifica se é instância no formato antigo
          if (instance.instance_name?.startsWith('auzap_')) {
            const businessId = instance.instance_name.replace('auzap_', '');

            // Buscar usuário correspondente (implementar lógica específica)
            // Por enquanto, assumindo que businessId corresponde ao userId
            const userId = businessId;
            const newInstanceName = this.generateInstanceName(userId);

            // Atualizar no banco com novo formato
            await this.supabaseService['supabase']
              .from('whatsapp_instances')
              .update({
                instance_name: newInstanceName,
                user_id: userId,
                updated_at: new Date().toISOString()
              })
              .eq('id', instance.id);

            migrated++;
            logger.info('Instance migrated', {
              oldName: instance.instance_name,
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