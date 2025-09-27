// Base Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Evolution API Types
export interface EvolutionInstance {
  instanceName: string;
  instanceId: string;
  status: 'created' | 'connecting' | 'connected' | 'disconnected' | 'error';
  integration: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS';
  qrCode?: string;
  connectionState?: string;
}

export interface EvolutionMessage {
  key: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message: {
    conversation?: string;
    imageMessage?: any;
    audioMessage?: any;
    documentMessage?: any;
  };
  messageType: string;
  instanceId: string;
  timestamp: number;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  profilePicUrl?: string;
  isBlocked: boolean;
  isGroup: boolean;
}

// AI Types
export interface AIAnalysis {
  intent: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  needsHuman: boolean;
  confidence: number;
  suggestedResponse?: string;
  extractedEntities?: Record<string, any>;
}

export interface AIContext {
  customer: {
    id: string;
    name: string;
    phone: string;
    pets: any[];
    preferences?: Record<string, any>;
    lastInteraction?: Date;
  };
  conversation: {
    messages: any[];
    sentiment: string;
    topics: string[];
    duration: number;
  };
  business: {
    name: string;
    services: any[];
    availability: any;
    policies: Record<string, any>;
  };
}

// Supabase Types
export interface CustomerData {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  status: 'active' | 'inactive' | 'vip';
  total_spent?: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface MessageData {
  id: string;
  conversation_id: string;
  instance_id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  message_type: 'text' | 'image' | 'audio' | 'document' | 'video';
  external_id: string;
  metadata?: Record<string, any>;
  read_at?: string;
  delivered_at?: string;
  organization_id: string;
  created_at: string;
}

export interface ConversationData {
  id: string;
  contact_id: string;
  instance_id: string;
  status: 'active' | 'closed' | 'transferred';
  assigned_to?: string;
  tags?: string[];
  last_message_at: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

// Dashboard Types
export interface DashboardStats {
  conversations_today: number;
  daily_appointments: number;
  response_rate_percent: number;
  daily_revenue: number;
  avg_response_time: number;
  active_conversations: number;
  pending_messages: number;
  ai_accuracy: number;
}

// WebSocket Types
export interface SocketEvent {
  type: 'new_message' | 'human_needed' | 'dashboard_update' | 'status_change';
  organizationId: string;
  data: any;
  timestamp: string;
}

export interface HumanAlert {
  id: string;
  customerId: string;
  customerName: string;
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  reason: string;
  conversationId: string;
}

// Configuration Types
export interface BusinessConfig {
  organization_id: string;
  business_name: string;
  whatsapp_number?: string;
  welcome_message: string;
  business_hours: {
    enabled: boolean;
    timezone: string;
    schedule: Record<string, { start: string; end: string; enabled: boolean }>;
  };
  auto_reply: boolean;
  ai_personality: 'professional' | 'friendly' | 'casual' | 'formal';
  response_delay_seconds: number;
  escalation_keywords: string[];
}

// Error Types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Request/Response Types
export interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

export interface SendMessageRequest {
  instanceName: string;
  to: string;
  message: string;
  messageType?: 'text' | 'image' | 'audio' | 'document';
  mediaUrl?: string;
}

export interface WebhookPayload {
  instanceName: string;
  data: EvolutionMessage[];
  event: string;
  timestamp: number;
}