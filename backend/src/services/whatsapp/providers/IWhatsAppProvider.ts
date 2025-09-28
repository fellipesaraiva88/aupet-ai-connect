export interface ConnectionStatus {
  state: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';
  isAuthenticated: boolean;
  phoneNumber?: string;
  lastSeen?: Date;
  error?: string;
}

export interface QRCodeData {
  qrCode: string;
  base64?: string;
  url?: string;
}

export interface MessageResult {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  error?: string;
}

export interface IncomingMessage {
  id: string;
  from: string;
  to: string;
  body?: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact';
  mediaUrl?: string;
  mediaData?: Buffer;
  mimeType?: string;
  caption?: string;
  timestamp: Date;
  isFromMe: boolean;
  isGroup: boolean;
  groupName?: string;
  senderName?: string;
  quotedMessage?: {
    id: string;
    body?: string;
    from: string;
  };
}

export interface MediaMessage {
  url?: string;
  data?: Buffer;
  mimeType: string;
  caption?: string;
  filename?: string;
}

export interface SendMessageParams {
  to: string;
  text?: string;
  media?: MediaMessage;
  buttons?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  list?: {
    buttonText: string;
    sections: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
  };
  quotedMessageId?: string;
}

export interface ProviderConfig {
  name: string;
  priority: number;
  enabled: boolean;
  retryAttempts: number;
  timeout: number;
  rateLimit?: {
    messagesPerMinute: number;
    burstLimit: number;
  };
}

export interface SessionData {
  instanceId: string;
  businessId: string;
  provider: string;
  phoneNumber?: string;
  status: ConnectionStatus;
  credentials?: any;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

/**
 * Interface base para todos os provedores WhatsApp
 * Permite trocar entre Evolution API, Baileys, WhatsApp Business API, etc.
 */
export interface IWhatsAppProvider {
  readonly name: string;
  readonly config: ProviderConfig;

  // Lifecycle
  initialize(): Promise<void>;
  dispose(): Promise<void>;

  // Connection Management
  connect(instanceId: string, businessId: string): Promise<QRCodeData | ConnectionStatus>;
  disconnect(instanceId: string): Promise<void>;
  restart(instanceId: string): Promise<void>;

  // Status & Health
  getConnectionStatus(instanceId: string): Promise<ConnectionStatus>;
  getQRCode(instanceId: string): Promise<QRCodeData | null>;
  isHealthy(): Promise<boolean>;

  // Messaging
  sendMessage(instanceId: string, params: SendMessageParams): Promise<MessageResult>;
  sendText(instanceId: string, to: string, text: string): Promise<MessageResult>;
  sendMedia(instanceId: string, to: string, media: MediaMessage): Promise<MessageResult>;

  // Session Management
  saveSession(instanceId: string, sessionData: any): Promise<void>;
  loadSession(instanceId: string): Promise<any>;
  deleteSession(instanceId: string): Promise<void>;

  // Event Handlers
  onMessage(instanceId: string, handler: (message: IncomingMessage) => void): void;
  onStatusChange(instanceId: string, handler: (status: ConnectionStatus) => void): void;
  onQRCodeUpdated(instanceId: string, handler: (qrCode: QRCodeData) => void): void;

  // Instance Management
  listInstances(): Promise<string[]>;
  instanceExists(instanceId: string): Promise<boolean>;

  // Webhook Management (optional)
  setWebhook?(instanceId: string, url: string): Promise<void>;
  removeWebhook?(instanceId: string): Promise<void>;

  // Contacts & Chats
  fetchContacts?(instanceId: string): Promise<any[]>;
  fetchChats?(instanceId: string): Promise<any[]>;
  fetchMessages?(instanceId: string, chatId: string, limit?: number): Promise<IncomingMessage[]>;
}

/**
 * Factory interface para criar providers
 */
export interface IWhatsAppProviderFactory {
  createProvider(type: string, config?: any): IWhatsAppProvider;
  getSupportedProviders(): string[];
}