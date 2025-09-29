import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { retryHttp, CircuitBreaker } from '../utils/retry';
import {
  EvolutionInstance,
  EvolutionMessage,
  WhatsAppContact,
  SendMessageRequest
} from '../types';

export class EvolutionAPIService {
  private api: AxiosInstance;
  private baseURL: string;
  private apiKey: string;
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.baseURL = process.env.EVOLUTION_API_URL!;
    this.apiKey = process.env.EVOLUTION_API_KEY!;

    if (!this.baseURL || !this.apiKey) {
      throw new Error('Evolution API URL and API Key are required');
    }

    // Initialize circuit breaker for Evolution API
    this.circuitBreaker = new CircuitBreaker(5, 60000, 30000);

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });

    // Request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        logger.evolution('REQUEST', config.url || '', {
          method: config.method?.toUpperCase(),
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('Evolution API request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.evolution('RESPONSE', response.config.url || '', {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        logger.error('Evolution API response error:', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );

    logger.info('Evolution API service initialized', { baseURL: this.baseURL });
  }

  // Instance Management
  async createInstance(instanceName: string): Promise<EvolutionInstance> {
    return retryHttp(async () => {
      return this.circuitBreaker.execute(async () => {
        try {
          // Usar o endpoint correto da Evolution API v2
          const response = await this.api.post('/instance/create', {
            instanceName,
            integration: 'WHATSAPP-BAILEYS',
            qrcode: true,
            webhookUrl: `${process.env.WEBHOOK_URL}/api/webhook/whatsapp`,
            webhookByEvents: true,
            events: [
              'APPLICATION_STARTUP',
              'QRCODE_UPDATED',
              'CONNECTION_UPDATE',
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'SEND_MESSAGE'
            ]
          });

          const instanceData: EvolutionInstance = {
            instanceName,
            instanceId: response.data.instance?.instanceId || instanceName,
            status: 'created',
            integration: 'WHATSAPP-BAILEYS'
          };

          logger.evolution('CREATE_INSTANCE', instanceName, response.data);
          return instanceData;
        } catch (error: any) {
          logger.error('Error creating Evolution instance:', error);
          throw new Error(`Falha ao criar instância WhatsApp: ${error.response?.data?.message || error.message}`);
        }
      }, 'createInstance');
    }, 'EvolutionAPI.createInstance');
  }

  async connectInstance(instanceName: string): Promise<string> {
    try {
      // Na Evolution API v2, o endpoint /instance/connect/{instance} retorna pairingCode e code (QR)
      const response = await this.api.get(`/instance/connect/${instanceName}`);

      logger.evolution('CONNECT_INSTANCE', instanceName, response.data);

      // A Evolution API v2 retorna 'code' para QR Code e 'pairingCode' para pairing
      const qrCode = response.data.code || response.data.qrcode || '';

      if (qrCode) {
        logger.info('QR Code generated for instance', { instanceName, hasCode: !!qrCode });
      }

      return qrCode;
    } catch (error: any) {
      logger.error('Error connecting Evolution instance:', error);
      throw new Error(`Falha ao conectar instância: ${error.response?.data?.message || error.message}`);
    }
  }

  async getQRCode(instanceName: string): Promise<string> {
    try {
      // Primeiro tenta o endpoint connect para obter QR code
      const connectResponse = await this.api.get(`/instance/connect/${instanceName}`);

      if (connectResponse.data.code) {
        logger.evolution('QR_CODE_FETCHED_FROM_CONNECT', instanceName);
        return connectResponse.data.code;
      }

      // Se não encontrou, tenta o endpoint de fetchQrCode
      const qrResponse = await this.api.get(`/instance/fetchQrCode/${instanceName}`);
      const qrCode = qrResponse.data.base64 || qrResponse.data.code || '';

      if (qrCode) {
        logger.evolution('QR_CODE_FETCHED', instanceName);
      }

      return qrCode;
    } catch (error: any) {
      // QR code might not be available yet, this is normal
      if (error.response?.status === 404 || error.response?.status === 400) {
        return '';
      }

      logger.error('Error fetching QR code:', error);
      return '';
    }
  }

  async getConnectionState(instanceName: string): Promise<string> {
    try {
      const response = await this.api.get(`/instance/connectionState/${instanceName}`);

      const state = response.data.state || response.data.instance?.state || 'disconnected';

      logger.evolution('CONNECTION_STATE', instanceName, { state });
      return state;
    } catch (error: any) {
      logger.error('Error getting connection state:', error);
      return 'disconnected';
    }
  }

  async fetchInstances(): Promise<EvolutionInstance[]> {
    try {
      const response = await this.api.get('/instance/fetchInstances');

      const instances = response.data.map((instance: any) => ({
        instanceName: instance.name || instance.instanceName || instance.instance?.instanceName,
        instanceId: instance.id || instance.instanceId || instance.instance?.instanceId,
        status: instance.connectionStatus || instance.instance?.connectionStatus || 'disconnected',
        integration: 'WHATSAPP-BAILEYS',
        connectionState: instance.state || instance.instance?.state
      }));

      logger.evolution('FETCH_INSTANCES', 'all', { count: instances.length });
      return instances;
    } catch (error: any) {
      logger.error('Error fetching instances:', error);
      return [];
    }
  }

  async deleteInstance(instanceName: string): Promise<boolean> {
    try {
      await this.api.delete(`/instance/logout/${instanceName}`);

      logger.evolution('DELETE_INSTANCE', instanceName);
      return true;
    } catch (error: any) {
      logger.error('Error deleting instance:', error);
      return false;
    }
  }

  async restartInstance(instanceName: string): Promise<boolean> {
    try {
      await this.api.put(`/instance/restart/${instanceName}`);

      logger.evolution('RESTART_INSTANCE', instanceName);
      return true;
    } catch (error: any) {
      logger.error('Error restarting instance:', error);
      return false;
    }
  }

  // Message Sending
  async sendText(instanceName: string, to: string, message: string): Promise<any> {
    try {
      const cleanPhoneNumber = this.cleanPhoneNumber(to);

      const response = await this.api.post(`/message/sendText/${instanceName}`, {
        number: cleanPhoneNumber,
        textMessage: {
          text: message
        }
      });

      logger.evolution('SEND_TEXT', instanceName, {
        to: cleanPhoneNumber,
        messageLength: message.length
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending text message:', error);
      throw new Error(`Falha ao enviar mensagem: ${error.response?.data?.message || error.message}`);
    }
  }

  async sendMedia(instanceName: string, to: string, mediaUrl: string, caption?: string, mediaType: 'image' | 'video' | 'audio' | 'document' = 'image'): Promise<any> {
    try {
      const cleanPhoneNumber = this.cleanPhoneNumber(to);

      const payload: any = {
        number: cleanPhoneNumber
      };

      switch (mediaType) {
        case 'image':
          payload.mediaMessage = {
            mediatype: 'image',
            media: mediaUrl,
            caption: caption || ''
          };
          break;
        case 'video':
          payload.mediaMessage = {
            mediatype: 'video',
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

      const response = await this.api.post(`/message/sendMedia/${instanceName}`, payload);

      logger.evolution('SEND_MEDIA', instanceName, {
        to: cleanPhoneNumber,
        mediaType,
        mediaUrl
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending media message:', error);
      throw new Error(`Falha ao enviar mídia: ${error.response?.data?.message || error.message}`);
    }
  }

  async sendButtons(instanceName: string, to: string, text: string, buttons: Array<{id: string, title: string}>): Promise<any> {
    try {
      const cleanPhoneNumber = this.cleanPhoneNumber(to);

      const response = await this.api.post(`/message/sendButtons/${instanceName}`, {
        number: cleanPhoneNumber,
        buttonMessage: {
          text,
          buttons: buttons.map(btn => ({
            buttonId: btn.id,
            buttonText: { displayText: btn.title },
            type: 1
          })),
          headerType: 1
        }
      });

      logger.evolution('SEND_BUTTONS', instanceName, {
        to: cleanPhoneNumber,
        buttonsCount: buttons.length
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending button message:', error);
      throw new Error(`Falha ao enviar botões: ${error.response?.data?.message || error.message}`);
    }
  }

  async sendList(instanceName: string, to: string, text: string, buttonText: string, sections: Array<{title: string, rows: Array<{id: string, title: string, description?: string}>}>): Promise<any> {
    try {
      const cleanPhoneNumber = this.cleanPhoneNumber(to);

      const response = await this.api.post(`/message/sendList/${instanceName}`, {
        number: cleanPhoneNumber,
        listMessage: {
          text,
          buttonText,
          sections: sections.map(section => ({
            title: section.title,
            rows: section.rows.map(row => ({
              rowId: row.id,
              title: row.title,
              description: row.description || ''
            }))
          }))
        }
      });

      logger.evolution('SEND_LIST', instanceName, {
        to: cleanPhoneNumber,
        sectionsCount: sections.length
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending list message:', error);
      throw new Error(`Falha ao enviar lista: ${error.response?.data?.message || error.message}`);
    }
  }

  // Webhook Management
  async setWebhook(instanceName: string, webhookUrl: string): Promise<any> {
    try {
      const response = await this.api.post(`/webhook/set/${instanceName}`, {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: true,
        webhookBase64: false,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
          'CONNECTION_UPDATE',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'SEND_MESSAGE'
        ]
      });

      logger.evolution('SET_WEBHOOK', instanceName, { webhookUrl });
      return response.data;
    } catch (error: any) {
      logger.error('Error setting webhook:', error);
      throw new Error(`Falha ao configurar webhook: ${error.response?.data?.message || error.message}`);
    }
  }

  async getWebhook(instanceName: string): Promise<any> {
    try {
      const response = await this.api.get(`/webhook/find/${instanceName}`);

      logger.evolution('GET_WEBHOOK', instanceName);
      return response.data;
    } catch (error: any) {
      logger.error('Error getting webhook:', error);
      return null;
    }
  }

  // Contacts and Chats
  async fetchContacts(instanceName: string): Promise<WhatsAppContact[]> {
    try {
      const response = await this.api.get(`/contact/fetchContacts/${instanceName}`);

      const contacts = response.data.map((contact: any) => ({
        id: contact.id,
        name: contact.name || contact.pushName || contact.id,
        phone: contact.id,
        profilePicUrl: contact.profilePicUrl,
        isBlocked: contact.isBlocked || false,
        isGroup: contact.id.includes('@g.us')
      }));

      logger.evolution('FETCH_CONTACTS', instanceName, { count: contacts.length });
      return contacts;
    } catch (error: any) {
      logger.error('Error fetching contacts:', error);
      return [];
    }
  }

  async fetchChats(instanceName: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/chat/fetchAllChats/${instanceName}`);

      logger.evolution('FETCH_CHATS', instanceName, { count: response.data.length });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching chats:', error);
      return [];
    }
  }

  async fetchMessages(instanceName: string, chatId: string, limit: number = 50): Promise<EvolutionMessage[]> {
    try {
      const response = await this.api.get(`/chat/fetchMessages/${instanceName}`, {
        params: {
          number: chatId,
          limit
        }
      });

      logger.evolution('FETCH_MESSAGES', instanceName, {
        chatId,
        count: response.data.length
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching messages:', error);
      return [];
    }
  }

  // Utility Methods
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Add country code if not present (assuming Brazil +55)
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      cleaned = '55' + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = '5511' + cleaned;
    } else if (!cleaned.startsWith('55') && cleaned.length >= 10) {
      cleaned = '55' + cleaned;
    }

    // Format for WhatsApp (add @s.whatsapp.net if not present)
    if (!cleaned.includes('@')) {
      cleaned = cleaned + '@s.whatsapp.net';
    }

    return cleaned;
  }

  public formatPhoneForDisplay(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      const number = cleaned.substring(2);
      return `+55 ${number.substring(0, 2)} ${number.substring(2, 7)}-${number.substring(7)}`;
    }

    return phone;
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/');
      return response.status === 200;
    } catch (error) {
      logger.error('Evolution API health check failed:', error);
      return false;
    }
  }

  // Profile Management
  async updateProfileName(instanceName: string, name: string): Promise<any> {
    try {
      const response = await this.api.put(`/profile/updateProfileName/${instanceName}`, {
        name
      });

      logger.evolution('UPDATE_PROFILE_NAME', instanceName, { name });
      return response.data;
    } catch (error: any) {
      logger.error('Error updating profile name:', error);
      throw new Error(`Falha ao atualizar nome do perfil: ${error.response?.data?.message || error.message}`);
    }
  }

  async updateProfileStatus(instanceName: string, status: string): Promise<any> {
    try {
      const response = await this.api.put(`/profile/updateProfileStatus/${instanceName}`, {
        status
      });

      logger.evolution('UPDATE_PROFILE_STATUS', instanceName, { status });
      return response.data;
    } catch (error: any) {
      logger.error('Error updating profile status:', error);
      throw new Error(`Falha ao atualizar status do perfil: ${error.response?.data?.message || error.message}`);
    }
  }
}