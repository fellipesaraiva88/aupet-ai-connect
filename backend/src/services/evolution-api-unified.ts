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
  webhook?: {
    url: string;
    byEvents?: boolean;
    events?: string[];
    headers?: Record<string, string>;
  };
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
  base64?: string; // Evolution API v2.3.0 returns base64 at top level
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

export interface SendTextRequest {
  number: string;
  textMessage: {
    text: string;
  };
}

export interface SendMediaRequest {
  number: string;
  mediaMessage?: {
    mediatype: 'image' | 'video' | 'document';
    media: string;
    caption?: string;
    fileName?: string;
  };
  audioMessage?: {
    audio: string;
  };
}

/**
 * Evolution API Unified Service
 * Consolidates functionality from evolution-api.ts and evolution.ts
 * Based on Evolution API v2.3.0 validated endpoints
 */
export class EvolutionAPIUnifiedService {
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

    logger.info('Evolution API Unified Service initialized', {
      baseURL: config.baseURL,
      hasApiKey: !!config.apiKey
    });
  }

  // ============================================================================
  // INSTANCE MANAGEMENT - Validated endpoints
  // ============================================================================

  /**
   * Create a new WhatsApp instance with full configuration
   * Endpoint: POST /instance/create
   * Status: ✅ VALIDATED
   */
  async createInstance(config: CreateInstanceRequest): Promise<InstanceResponse> {
    try {
      logger.info('Creating Evolution API instance', {
        instanceName: config.instanceName,
        qrcode: config.qrcode ?? true
      });

      const requestBody: any = {
        instanceName: config.instanceName,
        integration: config.integration || 'WHATSAPP-BAILEYS',
        rejectCall: false,
        groupsIgnore: true,
        alwaysOnline: false,
        syncFullHistory: true
      };

      if (config.webhook) {
        requestBody.webhook = {
          url: config.webhook.url,
          byEvents: config.webhook.byEvents ?? true,
          base64: true,
          events: config.webhook.events ?? [
            'QRCODE_UPDATED',
            'CONNECTION_UPDATE',
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
   * Connect to an existing instance and get QR code
   * Endpoint: GET /instance/connect/{instanceName}
   * Status: ✅ VALIDATED
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
   * Endpoint: GET /instance/connectionState/{instanceName}
   * Status: ✅ VALIDATED
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
   * Disconnect instance
   * Endpoint: DELETE /instance/logout/{instanceName}
   * Status: ✅ VALIDATED
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
   * Delete instance permanently
   * Endpoint: DELETE /instance/delete/{instanceName}
   * Status: ✅ VALIDATED
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
   * Endpoint: GET /instance/fetchInstances
   * Status: ✅ VALIDATED
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
   * Restart instance
   * Endpoint: PUT /instance/restart/{instanceName}
   * Status: ⚠️ NEEDS VALIDATION
   */
  async restartInstance(instanceName: string): Promise<void> {
    try {
      await this.client.put(`/instance/restart/${instanceName}`);
      logger.info('Instance restarted successfully', { instanceName });
    } catch (error: any) {
      logger.error('Error restarting instance', {
        instanceName,
        error: error.message
      });
      throw error;
    }
  }

  // ============================================================================
  // MESSAGE SENDING - Validated endpoints
  // ============================================================================

  /**
   * Clean phone number to WhatsApp format
   */
  private cleanPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.includes('@') ? cleaned : `${cleaned}@s.whatsapp.net`;
  }

  /**
   * Send text message
   * Endpoint: POST /message/sendText/{instanceName}
   * Status: ⚠️ NEEDS VALIDATION (requires connected instance)
   */
  async sendText(instanceName: string, to: string, message: string): Promise<any> {
    try {
      const cleanPhoneNumber = this.cleanPhoneNumber(to);

      const response = await this.client.post(`/message/sendText/${instanceName}`, {
        number: cleanPhoneNumber,
        textMessage: {
          text: message
        }
      });

      logger.info('Text message sent', {
        instanceName,
        to: cleanPhoneNumber,
        messageLength: message.length
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending text message', {
        instanceName,
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Failed to send text message: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Send media message (image, video, audio, document)
   * Endpoint: POST /message/sendMedia/{instanceName}
   * Status: ⚠️ NEEDS VALIDATION (requires connected instance)
   */
  async sendMedia(
    instanceName: string,
    to: string,
    mediaUrl: string,
    caption?: string,
    mediaType: 'image' | 'video' | 'audio' | 'document' = 'image'
  ): Promise<any> {
    try {
      const cleanPhoneNumber = this.cleanPhoneNumber(to);

      const payload: SendMediaRequest = {
        number: cleanPhoneNumber
      };

      switch (mediaType) {
        case 'image':
        case 'video':
          payload.mediaMessage = {
            mediatype: mediaType,
            media: mediaUrl,
            caption: caption || ''
          };
          break;
        case 'audio':
          payload.audioMessage = {
            audio: mediaUrl
          };
          break;
        case 'document':
          payload.mediaMessage = {
            mediatype: 'document',
            media: mediaUrl,
            fileName: caption || 'document'
          };
          break;
      }

      const response = await this.client.post(`/message/sendMedia/${instanceName}`, payload);

      logger.info('Media message sent', {
        instanceName,
        to: cleanPhoneNumber,
        mediaType,
        mediaUrl
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending media message', {
        instanceName,
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Failed to send media: ${error.response?.data?.message || error.message}`);
    }
  }

  // ============================================================================
  // CONTACTS & CHATS - NOT AVAILABLE IN v2.3.0
  // ============================================================================

  /**
   * ❌ DEPRECATED - Endpoint does not exist in Evolution API v2.3.0
   *
   * Evolution API v2.3.0 removed direct contact/chat fetch endpoints.
   * Use webhooks (CONTACTS_UPSERT, CHATS_SET events) for real-time sync instead.
   *
   * Alternative: Configure webhooks to receive contact/chat data automatically:
   * - CONTACTS_UPSERT: Triggered when contacts are updated
   * - CHATS_SET: Triggered when chats are loaded
   * - CHATS_UPSERT: Triggered when new chats are created
   *
   * @deprecated Use webhook-based synchronization
   */
  // async fetchContacts() - REMOVED (404 in v2.3.0)
  // async fetchChats() - REMOVED (404 in v2.3.0)
  // async fetchMessages() - REMOVED (404 in v2.3.0)

  // ============================================================================
  // WEBHOOK MANAGEMENT
  // ============================================================================

  /**
   * Set webhook configuration for instance
   * Endpoint: POST /webhook/set/{instanceName}
   * Status: ✅ VALIDATED
   */
  async setWebhook(instanceName: string, webhookConfig: {
    enabled: boolean;
    url: string;
    webhookByEvents?: boolean;
    events?: string[];
  }): Promise<void> {
    try {
      await this.client.post(`/webhook/set/${instanceName}`, {
        webhook: {
          enabled: webhookConfig.enabled,
          url: webhookConfig.url,
          webhookByEvents: webhookConfig.webhookByEvents ?? false,
          events: webhookConfig.events ?? [
            'APPLICATION_STARTUP',
            'QRCODE_UPDATED',
            'CONNECTION_UPDATE',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'MESSAGES_DELETE',
            'SEND_MESSAGE',
            'CONTACTS_UPSERT',
            'CONTACTS_UPDATE',
            'PRESENCE_UPDATE',
            'CHATS_SET',
            'CHATS_UPSERT',
            'CHATS_UPDATE',
            'CHATS_DELETE',
            'GROUPS_UPSERT',
            'GROUP_UPDATE',
            'GROUP_PARTICIPANTS_UPDATE'
          ]
        }
      });
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

  /**
   * Get webhook configuration
   * Endpoint: GET /webhook/find/{instanceName}
   * Status: ✅ VALIDATED
   */
  async getWebhook(instanceName: string): Promise<any> {
    try {
      const response = await this.client.get(`/webhook/find/${instanceName}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error getting webhook', {
        instanceName,
        error: error.message
      });
      throw error;
    }
  }

  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  /**
   * Update profile name
   * Endpoint: PUT /profile/updateProfileName/{instanceName}
   * Status: ⚠️ NEEDS VALIDATION
   */
  async updateProfileName(instanceName: string, name: string): Promise<void> {
    try {
      await this.client.put(`/profile/updateProfileName/${instanceName}`, { name });
      logger.info('Profile name updated', { instanceName, name });
    } catch (error: any) {
      logger.error('Error updating profile name', {
        instanceName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update profile status
   * Endpoint: PUT /profile/updateProfileStatus/{instanceName}
   * Status: ⚠️ NEEDS VALIDATION
   */
  async updateProfileStatus(instanceName: string, status: string): Promise<void> {
    try {
      await this.client.put(`/profile/updateProfileStatus/${instanceName}`, { status });
      logger.info('Profile status updated', { instanceName, status });
    } catch (error: any) {
      logger.error('Error updating profile status', {
        instanceName,
        error: error.message
      });
      throw error;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let evolutionAPIService: EvolutionAPIUnifiedService | null = null;

export function getEvolutionAPIService(): EvolutionAPIUnifiedService {
  if (!evolutionAPIService) {
    const baseURL = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!baseURL) {
      throw new Error('EVOLUTION_API_URL environment variable is not set');
    }

    if (!apiKey) {
      throw new Error('EVOLUTION_API_KEY environment variable is not set');
    }

    evolutionAPIService = new EvolutionAPIUnifiedService({
      baseURL,
      apiKey
    });
  }

  return evolutionAPIService;
}
