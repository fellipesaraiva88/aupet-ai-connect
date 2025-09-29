import { logger } from '../utils/logger';
import { SupabaseService } from './supabase';
import { WebSocketService } from './websocket';
import { AIService } from './ai';
import { WhatsAppManager } from './whatsapp-manager';
import { MessageSender } from './message-sender';
import { AILogger } from './ai/ai-logger';

interface WebhookEvent {
  event: string;
  instance: {
    instanceName: string;
    owner?: string;
    profileName?: string;
    profilePicUrl?: string;
  };
  data?: any;
  destination?: string;
  dateTime?: string;
  sender?: string;
  message?: any;
  key?: any;
  participant?: any;
  status?: string;
  connectionState?: string;
}

export class WebhookHandler {
  private supabaseService: SupabaseService;
  private wsService: WebSocketService | null = null;
  private aiService: AIService;
  private whatsAppManager: WhatsAppManager;
  private messageSender: MessageSender;
  private aiLogger: AILogger;

  constructor() {
    this.supabaseService = new SupabaseService();
    this.aiService = new AIService();
    this.whatsAppManager = new WhatsAppManager();
    this.messageSender = new MessageSender();
    this.aiLogger = new AILogger();
  }

  setWebSocketService(wsService: WebSocketService) {
    this.wsService = wsService;
  }

  /**
   * Processa eventos de webhook do WhatsApp
   */
  async handleWebhookEvent(event: WebhookEvent, userId?: string): Promise<void> {
    try {
      const { event: eventType, instance } = event;
      const instanceName = instance?.instanceName;

      if (!instanceName) {
        logger.warn('Webhook event without instance name', { event: eventType });
        return;
      }

      logger.info('Processing webhook event', {
        eventType,
        instanceName,
        userId
      });

      // Processar eventos específicos
      switch (eventType) {
        case 'connection.update':
          await this.handleConnectionUpdate(event, userId);
          break;

        case 'qrcode.updated':
          await this.handleQRCodeUpdate(event, userId);
          break;

        case 'messages.upsert':
          await this.handleNewMessage(event, userId);
          break;

        case 'messages.update':
          await this.handleMessageUpdate(event, userId);
          break;

        case 'messages.delete':
          await this.handleMessageDelete(event, userId);
          break;

        case 'presence.update':
          await this.handlePresenceUpdate(event, userId);
          break;

        case 'chats.update':
        case 'chats.upsert':
          await this.handleChatUpdate(event, userId);
          break;

        case 'chats.delete':
          await this.handleChatDelete(event, userId);
          break;

        case 'contacts.upsert':
        case 'contacts.update':
          await this.handleContactUpdate(event, userId);
          break;

        case 'groups.upsert':
        case 'groups.update':
          await this.handleGroupUpdate(event, userId);
          break;

        default:
          logger.debug('Unhandled webhook event type', { eventType });
      }
    } catch (error) {
      logger.error('Error handling webhook event:', error);
      throw error;
    }
  }

  /**
   * Processa atualizações de conexão
   */
  private async handleConnectionUpdate(event: WebhookEvent, userId?: string) {
    try {
      const { instance, connectionState, data } = event;
      const instanceName = instance.instanceName;

      // Atualizar status da instância no banco
      await this.supabaseService.updateInstanceStatus(
        instanceName,
        connectionState || 'unknown',
        connectionState
      );

      // Buscar informações da instância
      const instanceData = await this.supabaseService.getInstanceByName(instanceName);
      const organizationId = instanceData?.organization_id;

      // Notificar via WebSocket
      if (this.wsService && organizationId) {
        this.wsService.notifyWhatsAppStatus(
          organizationId,
          instanceName,
          connectionState || 'unknown'
        );

        // Notificações específicas por estado
        if (connectionState === 'open') {
          this.wsService.sendNotification(organizationId, {
            title: 'WhatsApp Conectado! ✅',
            message: `Instância ${instanceName} está conectada e pronta para uso.`,
            type: 'success'
          });
        } else if (connectionState === 'closed' || connectionState === 'disconnected') {
          this.wsService.sendNotification(organizationId, {
            title: 'WhatsApp Desconectado ⚠️',
            message: `A instância ${instanceName} foi desconectada.`,
            type: 'warning'
          });
        }
      }

      logger.info('Connection update processed', {
        instanceName,
        connectionState,
        userId
      });
    } catch (error) {
      logger.error('Error handling connection update:', error);
    }
  }

  /**
   * Processa atualizações de QR Code
   */
  private async handleQRCodeUpdate(event: WebhookEvent, userId?: string) {
    try {
      const { instance, data } = event;
      const instanceName = instance.instanceName;
      const qrCode = data?.qr || data?.code || data?.qrcode;

      if (!qrCode) {
        logger.warn('QR Code update without code', { instanceName });
        return;
      }

      // Buscar informações da instância
      const instanceData = await this.supabaseService.getInstanceByName(instanceName);
      const organizationId = instanceData?.organization_id;
      const actualUserId = userId || instanceData?.user_id;

      // Notificar via WebSocket
      if (this.wsService && organizationId) {
        // Notificar organização
        this.wsService.notifyWhatsAppStatus(
          organizationId,
          instanceName,
          'waiting_qr',
          qrCode
        );

        // Notificar usuário específico
        if (actualUserId) {
          this.wsService.sendToUser(actualUserId, {
            type: 'qrcode',
            data: {
              instanceName,
              qrCode,
              status: 'waiting_qr'
            }
          });
        }

        this.wsService.sendNotification(organizationId, {
          title: 'QR Code Disponível 📱',
          message: 'Escaneie o código QR para conectar seu WhatsApp',
          type: 'info'
        });
      }

      logger.info('QR Code update processed', {
        instanceName,
        hasQRCode: !!qrCode,
        userId: actualUserId
      });
    } catch (error) {
      logger.error('Error handling QR code update:', error);
    }
  }

  /**
   * Processa novas mensagens
   */
  private async handleNewMessage(event: WebhookEvent, userId?: string) {
    try {
      const { instance, data } = event;
      const instanceName = instance.instanceName;

      if (!data || !data.key || !data.message) {
        logger.warn('Invalid message data in webhook', { instanceName });
        return;
      }

      const { key, message } = data;
      const isFromMe = key.fromMe || false;
      const remoteJid = key.remoteJid;
      const messageContent = message.conversation ||
                           message.extendedTextMessage?.text ||
                           message.text ||
                           '';

      if (!remoteJid || !messageContent) {
        logger.debug('Message without content or remoteJid', { instanceName });
        return;
      }

      // Buscar informações da instância
      const instanceData = await this.supabaseService.getInstanceByName(instanceName);
      if (!instanceData) {
        logger.error('Instance not found in database', { instanceName });
        return;
      }

      const organizationId = instanceData.organization_id;
      const actualUserId = userId || instanceData.user_id;

      // Extrair número do telefone
      const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');

      // Salvar ou buscar contato
      const contact = await this.supabaseService.saveContact({
        phone: phoneNumber,
        name: message.pushName || phoneNumber,
        organization_id: organizationId,
        instance_id: instanceData.id
      });

      // Buscar ou criar conversa
      const conversation = await this.supabaseService.getOrCreateConversation(
        contact.id,
        instanceData.id,
        organizationId
      );

      // Salvar mensagem
      const savedMessage = await this.supabaseService.saveMessage({
        conversation_id: conversation.id,
        instance_id: instanceData.id,
        content: messageContent,
        direction: isFromMe ? 'outbound' : 'inbound',
        message_type: 'text',
        external_id: key.id || `msg_${Date.now()}`,
        organization_id: organizationId,
        metadata: {
          remoteJid,
          fromMe: isFromMe,
          timestamp: message.messageTimestamp,
          pushName: message.pushName
        }
      });

      // Notificar via WebSocket
      if (this.wsService) {
        this.wsService.notifyNewMessage(organizationId, {
          id: savedMessage.id,
          conversation_id: conversation.id,
          instance_id: instanceData.id,
          content: messageContent,
          direction: isFromMe ? 'outbound' : 'inbound',
          message_type: 'text',
          external_id: savedMessage.external_id,
          organization_id: organizationId,
          created_at: savedMessage.created_at,
          customerName: contact.name || phoneNumber
        });

        // Notificar usuário específico se for mensagem recebida
        if (!isFromMe && actualUserId) {
          this.wsService.sendToUser(actualUserId, {
            type: 'new_message',
            data: {
              from: phoneNumber,
              name: contact.name,
              message: messageContent,
              conversationId: conversation.id
            }
          });
        }
      }

      // Processar com IA se for mensagem recebida e auto-reply estiver ativo
      if (!isFromMe) {
        await this.processWithAI(
          savedMessage,
          conversation,
          contact,
          instanceData,
          organizationId
        );
      }

      logger.info('Message processed', {
        instanceName,
        phoneNumber,
        isFromMe,
        conversationId: conversation.id
      });
    } catch (error) {
      logger.error('Error handling new message:', error);
    }
  }

  /**
   * Processa mensagem com IA
   */
  private async processWithAI(
    message: any,
    conversation: any,
    contact: any,
    instance: any,
    organizationId: string
  ) {
    try {
      // Verificar configuração de auto-reply
      const businessConfig = await this.supabaseService.getBusinessConfig(organizationId);

      if (!businessConfig?.auto_reply) {
        logger.debug('Auto-reply disabled for organization', { organizationId });
        return;
      }

      // Verificar horário comercial
      const isWithinHours = this.aiService.isWithinBusinessHours(businessConfig);
      if (!isWithinHours && businessConfig.business_hours?.enabled) {
        logger.debug('Outside business hours, skipping AI response', { organizationId });
        return;
      }

      // CONTEXTO ENRIQUECIDO - Buscar histórico completo
      const conversationHistory = await this.supabaseService.getConversationMessages(
        conversation.id,
        10 // últimas 10 mensagens
      );

      // Buscar pets do cliente
      const customerPets = await this.supabaseService.getCustomerPets(contact.id);

      // Buscar últimos agendamentos
      const recentAppointments = await this.supabaseService.getCustomerAppointments(
        contact.id,
        3 // últimos 3 agendamentos
      );

      // Contexto completo do cliente
      const customerContext = {
        name: contact.name,
        phone: contact.phone,
        pets: customerPets?.map((pet: any) => ({
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          age: pet.age
        })) || [],
        lastInteraction: conversation.updated_at,
        recentServices: recentAppointments?.map((apt: any) => ({
          service: apt.service_type,
          date: apt.scheduled_date
        })) || []
      };

      // Analisar mensagem com IA
      const analysis = await this.aiService.analyzeMessage(
        message.content,
        customerContext,
        businessConfig
      );

      // Verificar se precisa escalar para humano
      if (this.aiService.shouldEscalateToHuman(message.content, analysis, businessConfig)) {
        logger.info('Escalating to human', {
          conversationId: conversation.id,
          reason: analysis.urgency
        });

        // Atualizar status da conversa
        await this.supabaseService.updateConversationStatus(conversation.id, 'escalated');

        // Notificar equipe
        if (this.wsService) {
          this.wsService.sendNotification(organizationId, {
            title: '🚨 Conversa Escalada',
            message: `Cliente ${contact.name} precisa de atendimento humano`,
            type: 'warning'
          });
        }

        return;
      }

      // DETECTAR OPORTUNIDADES DE VENDA
      const opportunities = this.aiService.detectOpportunities(
        message.content,
        customerContext,
        recentAppointments
      );

      const topOpportunity = opportunities.length > 0 ? opportunities[0] : undefined;

      if (topOpportunity) {
        logger.info('Sales opportunity detected', {
          conversationId: conversation.id,
          service: topOpportunity.service,
          confidence: topOpportunity.confidence,
          urgency: topOpportunity.urgency
        });
      }

      // Gerar resposta com IA (com ou sem oportunidade)
      const aiResponseText = await this.aiService.generateResponseWithOpportunity(
        analysis.intent,
        customerContext,
        businessConfig,
        conversationHistory.map((msg: any) => ({
          content: msg.content,
          direction: msg.direction
        })),
        topOpportunity
      );

      if (aiResponseText) {
        // Aguardar delay configurado antes de enviar
        const delay = businessConfig.response_delay_seconds || 2;
        await new Promise(resolve => setTimeout(resolve, delay * 1000));

        // ENVIO REAL VIA EVOLUTION API - Fragmentar e enviar
        const fragments = this.messageSender.fragmentMessage(aiResponseText, 120);

        const sendResult = await this.messageSender.sendFragmentedMessages(
          instance.instance_name,
          contact.phone,
          fragments,
          2500 // 2.5s entre fragmentos
        );

        if (sendResult.success) {
          // Salvar mensagens enviadas no banco
          for (const fragment of fragments) {
            await this.supabaseService.saveMessage({
              conversation_id: conversation.id,
              instance_id: instance.id,
              content: fragment,
              direction: 'outbound',
              message_type: 'text',
              external_id: `ai_${Date.now()}_${Math.random()}`,
              organization_id: organizationId,
              metadata: {
                aiGenerated: true,
                intent: analysis.intent,
                confidence: analysis.confidence,
                sender_type: 'ai'
              }
            });
          }

          logger.info('AI response sent successfully', {
            conversationId: conversation.id,
            fragments: fragments.length,
            messageIds: sendResult.messageIds
          });

          // Notificar via WebSocket
          if (this.wsService) {
            this.wsService.notifyNewMessage(organizationId, {
              id: `ai_${Date.now()}`,
              conversation_id: conversation.id,
              instance_id: instance.id,
              content: aiResponseText,
              direction: 'outbound',
              message_type: 'text',
              external_id: `ai_${Date.now()}_notification`,
              organization_id: organizationId,
              created_at: new Date().toISOString(),
              customerName: contact.name || contact.phone,
              metadata: { sender_type: 'ai' }
            });
          }
        } else {
          logger.error('Failed to send AI response', {
            conversationId: conversation.id
          });
        }
      }
    } catch (error) {
      logger.error('Error processing message with AI:', error);
    }
  }

  /**
   * Processa atualizações de mensagens
   */
  private async handleMessageUpdate(event: WebhookEvent, userId?: string) {
    try {
      const { instance, data } = event;
      const instanceName = instance.instanceName;

      logger.debug('Message update received', {
        instanceName,
        messageId: data?.key?.id,
        status: data?.update?.status
      });

      // TODO: Implementar atualização de status de mensagem
    } catch (error) {
      logger.error('Error handling message update:', error);
    }
  }

  /**
   * Processa exclusão de mensagens
   */
  private async handleMessageDelete(event: WebhookEvent, userId?: string) {
    try {
      const { instance, data } = event;
      const instanceName = instance.instanceName;

      logger.debug('Message delete received', {
        instanceName,
        messageId: data?.key?.id
      });

      // TODO: Implementar exclusão de mensagem
    } catch (error) {
      logger.error('Error handling message delete:', error);
    }
  }

  /**
   * Processa atualizações de presença
   */
  private async handlePresenceUpdate(event: WebhookEvent, userId?: string) {
    try {
      const { instance, data } = event;
      const instanceName = instance.instanceName;

      logger.debug('Presence update received', {
        instanceName,
        presence: data
      });

      // TODO: Implementar atualização de presença
    } catch (error) {
      logger.error('Error handling presence update:', error);
    }
  }

  /**
   * Processa atualizações de chat
   */
  private async handleChatUpdate(event: WebhookEvent, userId?: string) {
    try {
      const { instance, data } = event;
      const instanceName = instance.instanceName;

      logger.debug('Chat update received', {
        instanceName,
        chatId: data?.id
      });

      // TODO: Implementar atualização de chat
    } catch (error) {
      logger.error('Error handling chat update:', error);
    }
  }

  /**
   * Processa exclusão de chat
   */
  private async handleChatDelete(event: WebhookEvent, userId?: string) {
    try {
      const { instance, data } = event;
      const instanceName = instance.instanceName;

      logger.debug('Chat delete received', {
        instanceName,
        chatId: data?.id
      });

      // TODO: Implementar exclusão de chat
    } catch (error) {
      logger.error('Error handling chat delete:', error);
    }
  }

  /**
   * Processa atualizações de contatos
   */
  private async handleContactUpdate(event: WebhookEvent, userId?: string) {
    try {
      const { instance, data } = event;
      const instanceName = instance.instanceName;

      logger.debug('Contact update received', {
        instanceName,
        contactId: data?.id
      });

      // TODO: Implementar atualização de contato
    } catch (error) {
      logger.error('Error handling contact update:', error);
    }
  }

  /**
   * Processa atualizações de grupos
   */
  private async handleGroupUpdate(event: WebhookEvent, userId?: string) {
    try {
      const { instance, data } = event;
      const instanceName = instance.instanceName;

      logger.debug('Group update received', {
        instanceName,
        groupId: data?.id
      });

      // TODO: Implementar atualização de grupo
    } catch (error) {
      logger.error('Error handling group update:', error);
    }
  }
}