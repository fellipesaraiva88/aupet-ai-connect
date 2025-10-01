import axios, { AxiosInstance } from 'axios';

interface EvolutionAPIConfig {
  baseURL: string;
  apiKey: string;
}

interface ConnectResponse {
  pairingCode?: string;
  code?: string;
  base64?: string;
  count?: number;
  qrcode?: {
    code: string;
    base64: string;
  };
}

interface InstanceInfo {
  name?: string;
  instanceName?: string;
  status?: string;
  connectionStatus?: string;
  number?: string;
  ownerJid?: string;
}

class EvolutionAPIClient {
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
  }

  /**
   * Conecta à instância e gera QR Code
   */
  async connectInstance(instanceName: string): Promise<ConnectResponse> {
    try {
      const response = await this.client.get(`/instance/connect/${instanceName}`);
      return response.data;
    } catch (error: any) {
      console.error('Evolution API Connect Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Busca informações de uma instância específica
   */
  async fetchInstance(instanceName: string): Promise<InstanceInfo | null> {
    try {
      const response = await this.client.get('/instance/fetchInstances', {
        params: { instanceName }
      });

      const instances = response.data;
      if (Array.isArray(instances) && instances.length > 0) {
        return instances[0];
      }
      return null;
    } catch (error: any) {
      console.error('Evolution API Fetch Error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Lista todas as instâncias
   */
  async listInstances(): Promise<InstanceInfo[]> {
    try {
      const response = await this.client.get('/instance/fetchInstances');
      return response.data || [];
    } catch (error: any) {
      console.error('Evolution API List Error:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Verifica o status da conexão de uma instância
   */
  async getConnectionState(instanceName: string): Promise<{ state: string } | null> {
    try {
      const response = await this.client.get(`/instance/connectionState/${instanceName}`);
      return response.data;
    } catch (error: any) {
      console.error('Evolution API Connection State Error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Desconecta uma instância (logout)
   */
  async logoutInstance(instanceName: string): Promise<boolean> {
    try {
      await this.client.delete(`/instance/logout/${instanceName}`);
      return true;
    } catch (error: any) {
      console.error('Evolution API Logout Error:', error.response?.data || error.message);
      return false;
    }
  }
}

// Singleton instance
let evolutionAPIClient: EvolutionAPIClient | null = null;

export function getEvolutionAPIClient(): EvolutionAPIClient {
  if (!evolutionAPIClient) {
    const baseURL = import.meta.env.VITE_EVOLUTION_API_URL;
    const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY;

    if (!baseURL || !apiKey) {
      throw new Error('Evolution API configuration missing. Check VITE_EVOLUTION_API_URL and VITE_EVOLUTION_API_KEY');
    }

    evolutionAPIClient = new EvolutionAPIClient({ baseURL, apiKey });
  }

  return evolutionAPIClient;
}

export type { ConnectResponse, InstanceInfo };
