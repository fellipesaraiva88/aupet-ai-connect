import { SupabaseService } from './supabase';
import { WebSocketService } from './websocket';
import { logger } from '../utils/logger';

interface WebhookEvent {
  event: string;
  instance: string;
  data: any;
  destination?: string;
  date_time: string;
  sender?: string;
  server_url?: string;
}

interface MessageEvent {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  pushName?: string;
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      url: string;
      caption?: string;
    };
    videoMessage?: {
      url: string;
      caption?: string;
    };
    audioMessage?: {
      url: string;
    };
    documentMessage?: {
      url: string;
      fileName?: string;
    };
  };
  messageTimestamp: number;
  status?: string;
}

interface ConnectionEvent {
  state: string;
  statusReason?: number;
}

interface QRCodeEvent {
  qrcode: {
    base64: string;
    code: string;
  };
}

export class WebhookProcessor {
  private supabaseService: SupabaseService;
  private wsService?: WebSocketService;

  constructor(wsService?: WebSocketService) {
    this.supabaseService = new SupabaseService();
    this.wsService = wsService;
  }

  async processWebhook(payload: WebhookEvent): Promise<void> {
    try {
      logger.webhook('RECEIVED', payload.event, {
        instance: payload.instance,
        event: payload.event,
        timestamp: payload.date_time
      });

      switch (payload.event) {
        case 'MESSAGES_UPSERT':
          await this.handleMessagesUpsert(payload);
          break;
        case 'MESSAGES_UPDATE':
          await this.handleMessagesUpdate(payload);
          break;
        case 'CONNECTION_UPDATE':
          await this.handleConnectionUpdate(payload);
          break;
        case 'QRCODE_UPDATED':
          await this.handleQRCodeUpdate(payload);
          break;
        case 'SEND_MESSAGE':
          await this.handleSendMessage(payload);
          break;
        default:
          logger.webhook('UNKNOWN_EVENT', payload.event, payload);
      }
    } catch (error) {
      logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  private async handleMessagesUpsert(payload: WebhookEvent): Promise<void> {
    const messages = Array.isArray(payload.data) ? payload.data : [payload.data];

    for (const messageData of messages) {
      await this.processMessage(payload.instance, messageData);
    }
  }

  private async processMessage(instanceName: string, messageData: MessageEvent): Promise<void> {
    try {
      // Obter instância
      const instance = await this.supabaseService.supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('instance_name', instanceName)
        .single();

      if (!instance.data) {
        logger.error('Instance not found:', instanceName);
        return;
      }

      // Extrair informações da mensagem
      const phoneNumber = this.extractPhoneNumber(messageData.key.remoteJid);
      const content = this.extractMessageContent(messageData);
      const messageType = this.detectMessageType(messageData);
      const isFromMe = messageData.key.fromMe;
      const direction = isFromMe ? 'outbound' : 'inbound';

      // Buscar ou criar contato
      const contact = await this.getOrCreateContact(
        phoneNumber,
        messageData.pushName,
        instance.data.organization_id,
        instance.data.id
      );

      // Buscar ou criar conversa
      const conversation = await this.getOrCreateConversation(
        contact.id,
        instance.data.id,
        instance.data.organization_id,
        phoneNumber
      );

      // Verificar se a mensagem já existe
      const existingMessage = await this.supabaseService.supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('external_id', messageData.key.id)
        .eq('instance_id', instance.data.id)
        .single();

      if (existingMessage.data) {
        logger.info('Message already exists, skipping:', messageData.key.id);
        return;
      }

      // Salvar mensagem
      const { data: savedMessage, error: messageError } = await this.supabaseService.supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          instance_id: instance.data.id,
          message_id: messageData.key.id,
          external_id: messageData.key.id,
          from_number: phoneNumber,
          to_number: isFromMe ? phoneNumber : instance.data.phone_number,
          is_from_me: isFromMe,
          message_type: messageType,
          content: content.text,
          media_url: content.mediaUrl,
          caption: content.caption,
          timestamp: new Date(messageData.messageTimestamp * 1000).toISOString(),
          direction,
          organization_id: instance.data.organization_id,
          metadata: {
            pushName: messageData.pushName,
            remoteJid: messageData.key.remoteJid,
            raw: messageData
          }
        })
        .select()
        .single();

      if (messageError) {
        logger.error('Error saving message:', messageError);
        return;
      }

      // Atualizar conversa
      await this.supabaseService.supabase
        .from('whatsapp_conversations')
        .update({
          last_message_id: savedMessage.id,
          last_message_time: savedMessage.timestamp,
          last_message_content: content.text || `${messageType} message`,
          unread_count: isFromMe ? 0 : conversation.unread_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

      // Notificar via WebSocket
      if (this.wsService && !isFromMe) {
        this.wsService.notifyNewMessage(instance.data.organization_id, {
          id: savedMessage.id,
          conversation_id: conversation.id,
          instance_id: instance.data.id,
          content: content.text,
          direction,
          message_type: messageType,
          external_id: messageData.key.id,
          organization_id: instance.data.organization_id,
          created_at: savedMessage.timestamp,
          customerName: contact.name,
          customerPhone: phoneNumber
        });
      }

      // Processar auto-respostas
      if (!isFromMe && content.text) {
        await this.processAutoReplies(instance.data.id, phoneNumber, content.text, conversation.id);
      }

      logger.webhook('MESSAGE_PROCESSED', instanceName, {
        messageId: messageData.key.id,
        direction,
        type: messageType,
        conversationId: conversation.id
      });

    } catch (error) {
      logger.error('Error processing message:', error);
    }
  }

  private async handleMessagesUpdate(payload: WebhookEvent): Promise<void> {
    const updates = Array.isArray(payload.data) ? payload.data : [payload.data];

    for (const update of updates) {
      await this.updateMessageStatus(payload.instance, update);
    }
  }

  private async updateMessageStatus(instanceName: string, updateData: any): Promise<void> {
    try {
      const { data: message } = await this.supabaseService.supabase
        .from('whatsapp_messages')
        .update({
          status: updateData.status || 'delivered',
          updated_at: new Date().toISOString()
        })
        .eq('external_id', updateData.key.id)
        .select()
        .single();

      if (message && this.wsService) {
        this.wsService.notifyMessageUpdate(message.organization_id, {
          messageId: message.id,
          status: updateData.status || 'delivered'
        });
      }
    } catch (error) {
      logger.error('Error updating message status:', error);
    }
  }

  private async handleConnectionUpdate(payload: WebhookEvent): Promise<void> {
    const connectionData = payload.data as ConnectionEvent;

    try {
      await this.supabaseService.supabase
        .from('whatsapp_instances')
        .update({
          connection_status: connectionData.state,
          is_connected: connectionData.state === 'open',
          last_heartbeat: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', payload.instance);

      // Notificar via WebSocket
      if (this.wsService) {
        // Buscar organização da instância
        const { data: instance } = await this.supabaseService.supabase
          .from('whatsapp_instances')
          .select('organization_id')
          .eq('instance_name', payload.instance)
          .single();

        if (instance) {
          this.wsService.notifyWhatsAppStatus(
            instance.organization_id,
            payload.instance,
            connectionData.state
          );
        }
      }

      logger.webhook('CONNECTION_UPDATE', payload.instance, {
        state: connectionData.state,
        connected: connectionData.state === 'open'
      });

    } catch (error) {
      logger.error('Error updating connection status:', error);
    }
  }

  private async handleQRCodeUpdate(payload: WebhookEvent): Promise<void> {
    const qrData = payload.data as QRCodeEvent;

    try {
      await this.supabaseService.supabase
        .from('whatsapp_instances')
        .update({
          qr_code: qrData.qrcode.base64,
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', payload.instance);

      // Notificar via WebSocket
      if (this.wsService) {
        const { data: instance } = await this.supabaseService.supabase
          .from('whatsapp_instances')
          .select('organization_id')
          .eq('instance_name', payload.instance)
          .single();

        if (instance) {
          this.wsService.notifyWhatsAppStatus(
            instance.organization_id,
            payload.instance,
            'qr_updated',
            qrData.qrcode.base64
          );
        }
      }

      logger.webhook('QR_CODE_UPDATE', payload.instance);
    } catch (error) {
      logger.error('Error updating QR code:', error);
    }
  }

  private async handleSendMessage(payload: WebhookEvent): Promise<void> {
    // Atualizar status da mensagem enviada
    await this.updateMessageStatus(payload.instance, payload.data);
  }

  private extractPhoneNumber(remoteJid: string): string {
    return remoteJid.split('@')[0];
  }

  private extractMessageContent(messageData: MessageEvent): {
    text?: string;
    mediaUrl?: string;
    caption?: string;
  } {
    const message = messageData.message;
    if (!message) return {};

    if (message.conversation) {
      return { text: message.conversation };
    }

    if (message.extendedTextMessage) {
      return { text: message.extendedTextMessage.text };
    }

    if (message.imageMessage) {
      return {
        mediaUrl: message.imageMessage.url,
        caption: message.imageMessage.caption
      };
    }

    if (message.videoMessage) {
      return {
        mediaUrl: message.videoMessage.url,
        caption: message.videoMessage.caption
      };
    }

    if (message.audioMessage) {
      return { mediaUrl: message.audioMessage.url };
    }

    if (message.documentMessage) {
      return {
        mediaUrl: message.documentMessage.url,
        caption: message.documentMessage.fileName
      };
    }

    return {};
  }

  private detectMessageType(messageData: MessageEvent): string {
    const message = messageData.message;
    if (!message) return 'text';

    if (message.conversation || message.extendedTextMessage) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';

    return 'text';
  }

  private async getOrCreateContact(
    phoneNumber: string,
    pushName: string | undefined,
    organizationId: string,
    instanceId: string
  ): Promise<any> {
    // Tentar encontrar contato existente
    let { data: contact } = await this.supabaseService.supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('phone', phoneNumber)
      .eq('organization_id', organizationId)
      .single();

    if (!contact) {
      // Criar novo contato
      const { data: newContact, error } = await this.supabaseService.supabase
        .from('whatsapp_contacts')
        .insert({
          phone: phoneNumber,
          name: pushName || `Cliente ${phoneNumber}`,
          push_name: pushName,
          organization_id: organizationId,
          metadata: { instance_id: instanceId }
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating contact:', error);
        throw error;
      }

      contact = newContact;
    } else if (pushName && contact.push_name !== pushName) {
      // Atualizar pushName se mudou
      await this.supabaseService.supabase
        .from('whatsapp_contacts')
        .update({
          push_name: pushName,
          name: contact.name || pushName,
          updated_at: new Date().toISOString()
        })
        .eq('id', contact.id);
    }

    return contact;
  }

  private async getOrCreateConversation(
    contactId: string,
    instanceId: string,
    organizationId: string,
    phoneNumber: string
  ): Promise<any> {
    // Tentar encontrar conversa existente
    let { data: conversation } = await this.supabaseService.supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('contact_id', contactId)
      .eq('instance_id', instanceId)
      .single();

    if (!conversation) {
      // Criar nova conversa
      const { data: newConversation, error } = await this.supabaseService.supabase
        .from('whatsapp_conversations')
        .insert({
          contact_id: contactId,
          instance_id: instanceId,
          chat_id: phoneNumber,
          organization_id: organizationId,
          status: 'active',
          unread_count: 0
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating conversation:', error);
        throw error;
      }

      conversation = newConversation;
    }

    return conversation;
  }

  private async processAutoReplies(
    instanceId: string,
    phoneNumber: string,
    messageText: string,
    conversationId: string
  ): Promise<void> {
    try {
      // Buscar auto-respostas ativas para esta instância
      const { data: autoReplies } = await this.supabaseService.supabase
        .from('whatsapp_auto_replies')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (!autoReplies) return;

      for (const autoReply of autoReplies) {
        let shouldReply = false;

        switch (autoReply.trigger_type) {
          case 'keyword':
            shouldReply = messageText.toLowerCase().includes(autoReply.trigger_value?.toLowerCase() || '');
            break;
          case 'welcome':
            // Verificar se é a primeira mensagem desta conversa
            const { count } = await this.supabaseService.supabase
              .from('whatsapp_messages')
              .select('id', { count: 'exact' })
              .eq('conversation_id', conversationId);
            shouldReply = (count || 0) <= 1;
            break;
          case 'business_hours':
            // Verificar horário comercial
            const now = new Date();
            const hour = now.getHours();
            shouldReply = hour < 8 || hour > 18; // Fora do horário comercial
            break;
        }

        if (shouldReply) {
          // Adicionar à fila de mensagens
          await this.supabaseService.supabase
            .from('whatsapp_message_queue')
            .insert({
              instance_id: instanceId,
              to_number: phoneNumber,
              message_content: autoReply.reply_message,
              message_type: autoReply.reply_type,
              status: 'pending',
              priority: autoReply.priority || 0,
              scheduled_at: new Date().toISOString()
            });

          // Incrementar contador de uso
          await this.supabaseService.supabase
            .from('whatsapp_auto_replies')
            .update({
              usage_count: autoReply.usage_count + 1
            })
            .eq('id', autoReply.id);

          logger.info('Auto-reply queued:', {
            instanceId,
            phoneNumber,
            trigger: autoReply.trigger_type,
            replyId: autoReply.id
          });

          break; // Parar no primeiro match
        }
      }
    } catch (error) {
      logger.error('Error processing auto-replies:', error);
    }
  }
}