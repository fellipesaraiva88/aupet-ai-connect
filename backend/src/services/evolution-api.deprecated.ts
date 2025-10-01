import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface EvolutionAPIConfig {
  baseURL: string;
  apiKey: string;
}

export interface CreateInstanceRequest {
  instanceName: string;
  qrcode?: boolean;
  integration?: string;
}

export interface InstanceResponse {
  instance: {
    instanceName: string;
    status: string;
  };
  hash: {
    apikey: string;
  };
  qrcode?: {
    code: string;
    base64: string;
  };
}

export interface ConnectResponse {
  pairingCode?: string;
  code?: string;
  count?: number;
  qrcode?: {
    code: string;
    base64: string;
  };
}

export interface InstanceStatusResponse {
  instance: {
    instanceName: string;
    state: string;
  };
}

export class EvolutionAPIService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: EvolutionAPIConfig) {
    this.apiKey = config.apiKey;
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiKey
      },
      timeout: 30000
    });

    logger.info('Evolution API Service initialized', {
      baseURL: config.baseURL,
      hasApiKey: !!config.apiKey
    });
  }

  /**
   * Create a new WhatsApp instance with full configuration
   */
  async createInstance(config: {
    instanceName: string;
    qrcode?: boolean;
    webhook?: {
      url: string;
      byEvents?: boolean;
      events?: string[];
      headers?: Record<string, string>;
    };
  }): Promise<InstanceResponse> {
    try {
      logger.info('Creating Evolution API instance', {
        instanceName: config.instanceName,
        qrcode: config.qrcode ?? true
      });

      const requestBody: any = {
        instanceName: config.instanceName,
        integration: 'WHATSAPP-BAILEYS',
        // Configurações conforme solicitado
        rejectCall: false,
        groupsIgnore: true,
        alwaysOnline: false,
        syncFullHistory: true
      };

      // Add webhook if provided
      if (config.webhook) {
        requestBody.webhook = {
          url: config.webhook.url,
          byEvents: config.webhook.byEvents ?? true,
          base64: true,
          events: config.webhook.events ?? [
            'QRCODE_UPDATED',
            'MESSAGES_SET',
            'MESSAGES_UPSERT',
            'CONTACTS_UPSERT',
            'PRESENCE_UPDATE',
            'CHATS_SET'
          ]
        };
      }

      const response = await this.client.post<InstanceResponse>('/instance/create', requestBody);

      logger.info('Instance created successfully', {
        instanceName: config.instanceName,
        status: response.data.instance.status
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error creating instance', {
        instanceName: config.instanceName,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Create instance (legacy - backward compatibility)
   */
  async createInstanceBasic(instanceName: string, qrcode: boolean = true): Promise<InstanceResponse> {
    return this.createInstance({ instanceName, qrcode });
  }

  /**
   * Connect to an existing instance and get QR code
   */
  async connect(instanceName: string): Promise<ConnectResponse> {
    try {
      logger.info('Connecting to Evolution API instance', { instanceName });

      const response = await this.client.get<ConnectResponse>(`/instance/connect/${instanceName}`);

      logger.info('Connect request successful', {
        instanceName,
        hasQRCode: !!response.data.qrcode
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error connecting to instance', {
        instanceName,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Get instance connection state
   */
  async getConnectionState(instanceName: string): Promise<InstanceStatusResponse> {
    try {
      const response = await this.client.get<InstanceStatusResponse>(
        `/instance/connectionState/${instanceName}`
      );

      return response.data;
    } catch (error: any) {
      logger.error('Error getting connection state', {
        instanceName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get instance status (legacy - backward compatibility)
   */
  async getInstanceStatus(instanceName: string): Promise<InstanceStatusResponse> {
    return this.getConnectionState(instanceName);
  }

  /**
   * Disconnect instance
   */
  async logout(instanceName: string): Promise<void> {
    try {
      await this.client.delete(`/instance/logout/${instanceName}`);
      logger.info('Instance logged out successfully', { instanceName });
    } catch (error: any) {
      logger.error('Error logging out instance', {
        instanceName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete instance
   */
  async deleteInstance(instanceName: string): Promise<void> {
    try {
      await this.client.delete(`/instance/delete/${instanceName}`);
      logger.info('Instance deleted successfully', { instanceName });
    } catch (error: any) {
      logger.error('Error deleting instance', {
        instanceName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * List all instances
   */
  async listInstances(): Promise<any[]> {
    try {
      const response = await this.client.get('/instance/fetchInstances');
      return response.data || [];
    } catch (error: any) {
      logger.error('Error listing instances', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Set webhook configuration for instance
   */
  async setWebhook(instanceName: string, webhookConfig: {
    enabled: boolean;
    url: string;
    webhookByEvents?: boolean;
    events?: string[];
  }): Promise<void> {
    try {
      await this.client.post(`/webhook/set/${instanceName}`, webhookConfig);
      logger.info('Webhook configured successfully', { instanceName, url: webhookConfig.url });
    } catch (error: any) {
      logger.error('Error setting webhook', {
        instanceName,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }
}

// Singleton instance
let evolutionAPIService: EvolutionAPIService | null = null;

export function getEvolutionAPIService(): EvolutionAPIService {
  if (!evolutionAPIService) {
    const baseURL = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.AUTHENTICATION_API_KEY;

    if (!baseURL) {
      throw new Error('EVOLUTION_API_URL environment variable is not set');
    }

    if (!apiKey) {
      throw new Error('AUTHENTICATION_API_KEY environment variable is not set');
    }

    evolutionAPIService = new EvolutionAPIService({
      baseURL,
      apiKey
    });
  }

  return evolutionAPIService;
}
