import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { SupabaseService } from '../services/supabase';
import { EvolutionAPIService } from '../services/evolution';
import { AIService } from '../services/ai';
import { WebSocketService } from '../services/websocket';
import { logger } from '../utils/logger';
import {
  WebhookPayload,
  EvolutionMessage,
  ApiResponse,
  HumanAlert
} from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Initialize services
// Lazy initialize services
let supabaseService: SupabaseService;

const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
};

let evolutionService: EvolutionAPIService;
let aiService: AIService;

const getEvolutionService = () => {
  if (!evolutionService) {
    evolutionService = new EvolutionAPIService();
  }
  return evolutionService;
};

const getAIService = () => {
  if (!aiService) {
    aiService = new AIService();
  }
  return aiService;
};

// Main WhatsApp webhook endpoint
router.post('/whatsapp', asyncHandler(async (req: Request, res: Response) => {
  try {
    const payload: WebhookPayload = req.body;

    logger.info('Webhook received:', {
      instanceName: payload.instanceName,
      event: payload.event,
      dataCount: payload.data?.length || 0
    });

    // Get WebSocket service from app
    const wsService = req.app.get('wsService') as WebSocketService;

    // Process each message/event in the payload
    for (const eventData of payload.data || []) {
      await processWebhookEvent(payload.instanceName, payload.event, eventData, wsService);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Webhook processado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error processing webhook:', error);

    const response: ApiResponse = {
      success: false,
      error: 'Erro ao processar webhook',
      timestamp: new Date().toISOString()
    };

    res.status(500).json(response);
  }
}));

// Process individual webhook events
async function processWebhookEvent(
  instanceName: string,
  event: string,
  eventData: any,
  wsService: WebSocketService
): Promise<void> {
  try {
    logger.info(`Processing webhook event: ${event}`, { instanceName });

    switch (event) {
      case 'APPLICATION_STARTUP':
        await handleApplicationStartup(instanceName, eventData, wsService);
        break;

      case 'QRCODE_UPDATED':
        await handleQRCodeUpdate(instanceName, eventData, wsService);
        break;

      case 'CONNECTION_UPDATE':
        await handleConnectionUpdate(instanceName, eventData, wsService);
        break;

      case 'MESSAGES_UPSERT':
        await handleMessageUpsert(instanceName, eventData, wsService);
        break;

      case 'MESSAGES_UPDATE':
        await handleMessageUpdate(instanceName, eventData, wsService);
        break;

      case 'SEND_MESSAGE':
        await handleSendMessage(instanceName, eventData, wsService);
        break;

      default:
        logger.warn(`Unhandled webhook event: ${event}`, { instanceName });
    }

  } catch (error) {
    logger.error(`Error processing webhook event ${event}:`, error);
  }
}

// Handle application startup
async function handleApplicationStartup(
  instanceName: string,
  eventData: any,
  wsService: WebSocketService
): Promise<void> {
  try {
    await getSupabaseService().updateInstanceStatus(instanceName, 'connecting');

    // Get instance data to find organization
    const instance = await getSupabaseService().getInstance(instanceName);
    if (instance) {
      wsService.notifyWhatsAppStatus(
        instance.organization_id,
        instanceName,
        'connecting'
      );
    }

    logger.info(`Application startup for instance: ${instanceName}`);
  } catch (error) {
    logger.error('Error handling application startup:', error);
  }
}

// Handle QR code updates
async function handleQRCodeUpdate(
  instanceName: string,
  eventData: any,
  wsService: WebSocketService
): Promise<void> {
  try {
    const qrCode = eventData.qrcode || eventData.code;

    if (qrCode) {
      // Get instance data to find organization
      const instance = await getSupabaseService().getInstance(instanceName);
      if (instance) {
        wsService.notifyWhatsAppStatus(
          instance.organization_id,
          instanceName,
          'qr_code',
          qrCode
        );
      }

      logger.info(`QR code updated for instance: ${instanceName}`);
    }
  } catch (error) {
    logger.error('Error handling QR code update:', error);
  }
}

// Handle connection status updates
async function handleConnectionUpdate(
  instanceName: string,
  eventData: any,
  wsService: WebSocketService
): Promise<void> {
  try {
    const state = eventData.state;

    await getSupabaseService().updateInstanceStatus(instanceName, state);

    // Get instance data to find organization
    const instance = await getSupabaseService().getInstance(instanceName);
    if (instance) {
      wsService.notifyWhatsAppStatus(
        instance.organization_id,
        instanceName,
        state
      );

      // Send notification based on connection state
      if (state === 'open') {
        wsService.sendNotification(instance.organization_id, {
          title: 'WhatsApp Conectado! 🎉',
          message: 'Seu WhatsApp está conectado e pronto para receber mensagens.',
          type: 'success'
        });
      } else if (state === 'close') {
        wsService.sendNotification(instance.organization_id, {
          title: 'WhatsApp Desconectado',
          message: 'A conexão com o WhatsApp foi perdida. Reconecte para continuar.',
          type: 'warning'
        });
      }
    }

    logger.info(`Connection update for instance ${instanceName}: ${state}`);
  } catch (error) {
    logger.error('Error handling connection update:', error);
  }
}

// Handle incoming messages
async function handleMessageUpsert(
  instanceName: string,
  eventData: EvolutionMessage,
  wsService: WebSocketService
): Promise<void> {
  try {
    // Skip if it's an outgoing message from us
    if (eventData.key.fromMe) {
      return;
    }

    // Extract message content
    const messageContent = eventData.message.conversation ||
                          eventData.message.imageMessage?.caption ||
                          eventData.message.audioMessage?.caption ||
                          'Mídia recebida';

    if (!messageContent) {
      logger.warn('No message content found', { instanceName });
      return;
    }

    // Extract phone number
    const phoneNumber = eventData.key.remoteJid.replace('@s.whatsapp.net', '');

    // Get instance data
    const instance = await getSupabaseService().getInstance(instanceName);
    if (!instance) {
      logger.error(`Instance not found: ${instanceName}`);
      return;
    }

    // Save or update contact
    const contact = await getSupabaseService().saveContact({
      phone: phoneNumber,
      name: phoneNumber, // Will be updated with actual name later
      organization_id: instance.organization_id,
      instance_id: instance.id
    });

    // Get or create conversation
    const conversation = await getSupabaseService().getOrCreateConversation(
      contact.id,
      instance.id,
      instance.organization_id
    );

    // Save message
    const messageData = await getSupabaseService().saveMessage({
      conversation_id: conversation.id,
      instance_id: instance.id,
      content: messageContent,
      direction: 'inbound',
      message_type: getMessageType(eventData.message),
      external_id: eventData.key.id,
      organization_id: instance.organization_id,
      metadata: {
        fromMe: eventData.key.fromMe,
        remoteJid: eventData.key.remoteJid,
        timestamp: eventData.timestamp
      }
    });

    // Get customer data with pets
    const customerData = await getSupabaseService().getCustomerByPhone(
      phoneNumber,
      instance.organization_id
    );

    // Get business configuration
    const businessConfig = await getSupabaseService().getBusinessConfig(instance.organization_id);

    if (!businessConfig) {
      logger.warn(`No business config found for organization: ${instance.organization_id}`);
      return;
    }

    // Check if auto-reply is enabled
    if (!businessConfig.auto_reply) {
      logger.info('Auto-reply disabled, skipping AI processing');
      return;
    }

    // Check business hours
    if (businessConfig.business_hours?.enabled && !getAIService().isWithinBusinessHours(businessConfig)) {
      // Send out-of-hours message
      const outOfHoursMessage = 'Obrigado por entrar em contato! 💝 Estamos fora do horário de atendimento, mas responderemos assim que possível!';

      await getEvolutionService().sendText(instanceName, eventData.key.remoteJid, outOfHoursMessage);

      // Save the response
      await getSupabaseService().saveMessage({
        conversation_id: conversation.id,
        instance_id: instance.id,
        content: outOfHoursMessage,
        direction: 'outbound',
        message_type: 'text',
        external_id: `auto_${Date.now()}`,
        organization_id: instance.organization_id
      });

      return;
    }

    // Analyze message with AI
    const analysis = await getAIService().analyzeMessage(
      messageContent,
      customerData,
      businessConfig
    );

    // Check if should escalate to human
    const shouldEscalate = getAIService().shouldEscalateToHuman(
      messageContent,
      analysis,
      businessConfig
    );

    if (shouldEscalate) {
      // Create human alert
      const alert: HumanAlert = {
        id: uuidv4(),
        customerId: contact.id,
        customerName: customerData?.name || phoneNumber,
        message: messageContent,
        urgency: analysis.urgency,
        timestamp: new Date().toISOString(),
        reason: analysis.needsHuman ? 'Solicitação de atendimento humano' : `Urgência: ${analysis.urgency}`,
        conversationId: conversation.id
      };

      // Notify human agents
      wsService.notifyHumanNeeded(instance.organization_id, alert);

      // Send escalation message to customer
      const escalationMessage = analysis.urgency === 'critical'
        ? 'Entendemos a urgência! 🚨 Nossa equipe foi notificada e irá te atender imediatamente.'
        : 'Perfeito! Um de nossos especialistas irá te atender pessoalmente em breve. 💝';

      await getEvolutionService().sendText(instanceName, eventData.key.remoteJid, escalationMessage);

      // Save escalation message
      await getSupabaseService().saveMessage({
        conversation_id: conversation.id,
        instance_id: instance.id,
        content: escalationMessage,
        direction: 'outbound',
        message_type: 'text',
        external_id: `escalation_${Date.now()}`,
        organization_id: instance.organization_id
      });

    } else {
      // Generate AI response
      const aiResponse = await getAIService().generateResponse(
        analysis.intent,
        customerData,
        businessConfig
      );

      // Add delay to simulate human typing
      if (businessConfig.response_delay_seconds > 0) {
        await new Promise(resolve => setTimeout(resolve, businessConfig.response_delay_seconds * 1000));
      }

      // Send AI response
      await getEvolutionService().sendText(instanceName, eventData.key.remoteJid, aiResponse);

      // Save AI response
      await getSupabaseService().saveMessage({
        conversation_id: conversation.id,
        instance_id: instance.id,
        content: aiResponse,
        direction: 'outbound',
        message_type: 'text',
        external_id: `ai_${Date.now()}`,
        organization_id: instance.organization_id,
        metadata: {
          ai_analysis: analysis,
          generated_by: 'ai'
        }
      });
    }

    // Notify frontend of new message
    wsService.notifyNewMessage(instance.organization_id, {
      ...messageData,
      customerName: customerData?.name || phoneNumber
    });

    // Update dashboard stats
    const dashboardStats = await getSupabaseService().getDashboardStats(instance.organization_id);
    wsService.updateDashboard(instance.organization_id, dashboardStats);

    logger.info('Message processed successfully', {
      instanceName,
      customer: customerData?.name || phoneNumber,
      intent: analysis.intent,
      escalated: shouldEscalate
    });

  } catch (error) {
    logger.error('Error processing incoming message:', error);
  }
}

// Handle message updates (read receipts, etc.)
async function handleMessageUpdate(
  instanceName: string,
  eventData: any,
  wsService: WebSocketService
): Promise<void> {
  try {
    // Handle message status updates (delivered, read, etc.)
    logger.info(`Message update for instance: ${instanceName}`, eventData);
  } catch (error) {
    logger.error('Error handling message update:', error);
  }
}

// Handle sent message confirmations
async function handleSendMessage(
  instanceName: string,
  eventData: any,
  wsService: WebSocketService
): Promise<void> {
  try {
    logger.info(`Message sent confirmation for instance: ${instanceName}`, eventData);
  } catch (error) {
    logger.error('Error handling send message:', error);
  }
}

// Helper function to determine message type
function getMessageType(message: any): 'text' | 'image' | 'audio' | 'document' | 'video' {
  if (message.conversation) return 'text';
  if (message.imageMessage) return 'image';
  if (message.audioMessage) return 'audio';
  if (message.documentMessage) return 'document';
  if (message.videoMessage) return 'video';
  return 'text';
}

// Health check endpoint
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Webhook service is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    timestamp: new Date().toISOString()
  };

  res.json(response);
}));

// Test endpoint for development
router.post('/test', asyncHandler(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      error: 'Test endpoint not available in production',
      timestamp: new Date().toISOString()
    });
  }

  logger.info('Test webhook called', req.body);

  const response: ApiResponse = {
    success: true,
    message: 'Test webhook received',
    data: req.body,
    timestamp: new Date().toISOString()
  };

  return res.json(response);
}));

export default router;