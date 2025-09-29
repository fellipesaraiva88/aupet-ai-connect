import { logger } from '../../utils/logger';
import { SupabaseService } from '../supabase';
import { MessageSender } from '../message-sender';
import { HumanizationEngine } from './humanization-engine';
import { PNL_TECHNIQUES } from './pnl-patterns';

/**
 * Proactive Engagement Engine
 * Motor de Follow-up Proativo com PNL
 * Toma iniciativa de conversar com clientes estrategicamente
 */

export interface FollowUpRule {
  name: string;
  description: string;
  daysAfterLastContact: number;
  priority: 'low' | 'medium' | 'high';
  messageTemplates: string[];
  pnlTechnique: keyof typeof PNL_TECHNIQUES;
  includeOffer: boolean;
}

export const FOLLOWUP_RULES: FollowUpRule[] = [
  // Follow-up pós-serviço (RECIPROCIDADE)
  {
    name: 'post_service_care',
    description: 'Cuidado após serviço - Perguntar como está o pet',
    daysAfterLastContact: 3,
    priority: 'high',
    pnlTechnique: 'reciprocidade',
    includeOffer: false,
    messageTemplates: [
      'Oi {nome}! 💕 Tava lembrando do {pet} aqui... Como ele tá depois do {serviço}? Ficou bem?',
      'Oi {nome}! Como o {pet} está? Espero que ele tenha gostado do {serviço}! 😊',
      '{nome}! Tudo bem? O {pet} está curtindo depois do {serviço}? 🐾'
    ]
  },

  // Follow-up saudade (VÍNCULO EMOCIONAL)
  {
    name: 'miss_you',
    description: 'Saudades - Retomar contato',
    daysAfterLastContact: 7,
    priority: 'medium',
    pnlTechnique: 'ancoragem',
    includeOffer: false,
    messageTemplates: [
      'Oi {nome}! Saudades do {pet} por aqui! 💙 Como vocês estão?',
      '{nome}! Faz tempo que não vejo o {pet}... Tudo bem com vocês?',
      'Oi {nome}! Estava lembrando do {pet} aqui... Como ele anda? 😊'
    ]
  },

  // Follow-up com oferta sutil (ESCASSEZ)
  {
    name: 'gentle_offer',
    description: 'Oferta gentil após período sem contato',
    daysAfterLastContact: 15,
    priority: 'high',
    pnlTechnique: 'escassez',
    includeOffer: true,
    messageTemplates: [
      'Oi {nome}! Tava pensando no {pet}... Que tal marcar aquele {serviço_sugerido}? Tenho umas vaguinhas essa semana! 😊',
      '{nome}! O {pet} deve estar precisando de um carinho especial né? Posso reservar um horário pra {serviço_sugerido}?',
      'Oi {nome}! Olha, essa semana tá mais tranquila aqui... Quer trazer o {pet} pra {serviço_sugerido}? 🐾'
    ]
  },

  // Follow-up sazonal (PREVENÇÃO)
  {
    name: 'seasonal_care',
    description: 'Cuidados sazonais importantes',
    daysAfterLastContact: 20,
    priority: 'medium',
    pnlTechnique: 'autoridade',
    includeOffer: true,
    messageTemplates: [
      'Oi {nome}! Com essa mudança de clima, o {pet} precisa de cuidados especiais! Quer que eu explique?',
      '{nome}! Sabia que nessa época é importante {cuidado_sazonal} pro {pet}? Posso te ajudar com isso!',
      'Oi {nome}! Essa estação pede atenção especial pros pets... O {pet} já fez {cuidado_sazonal}?'
    ]
  },

  // Aniversário do pet (VÍNCULO EMOCIONAL MAX)
  {
    name: 'pet_birthday',
    description: 'Aniversário do pet',
    daysAfterLastContact: 0, // Não depende de último contato
    priority: 'high',
    pnlTechnique: 'ancoragem',
    includeOffer: true,
    messageTemplates: [
      'PARABÉNS PRO {pet}! 🎉🎂 {nome}, ele tá fazendo quantos aninhos? Que tal comemorar com um spa especial? 💕',
      '{nome}! É aniversário do {pet} hoje! 🎉 Parabéns pra ele! Merece um mimo especial né?',
      'FELIZ ANIVERSÁRIO {pet}! 🎂🐾 {nome}, vamos comemorar? Tenho um pacote especial pra aniversariantes!'
    ]
  },

  // Follow-up reengajamento (ÚLTIMO RECURSO)
  {
    name: 're_engagement',
    description: 'Reengajar cliente inativo',
    daysAfterLastContact: 45,
    priority: 'high',
    pnlTechnique: 'reciprocidade',
    includeOffer: true,
    messageTemplates: [
      '{nome}! Faz tempo que não vejo você e o {pet} por aqui... Tá tudo bem? Se precisar de algo, estou aqui! 💙',
      'Oi {nome}! Sentimos sua falta! O {pet} está bem? Se quiser, posso separar um horário especial pra vocês!',
      '{nome}! Estava aqui pensando em você e no {pet}... Vocês sumiram! Tem alguma coisa que eu possa fazer?'
    ]
  }
];

export class ProactiveEngagementEngine {
  private supabaseService: SupabaseService;
  private messageSender: MessageSender;
  private humanizationEngine: HumanizationEngine;

  constructor() {
    this.supabaseService = new SupabaseService();
    this.messageSender = new MessageSender();
    this.humanizationEngine = new HumanizationEngine();
  }

  /**
   * Processa follow-ups diários
   */
  async processDailyFollowups(organizationId: string): Promise<{
    processed: number;
    sent: number;
    skipped: number;
  }> {
    let processed = 0;
    let sent = 0;
    let skipped = 0;

    try {
      logger.info('Starting daily follow-up processing', { organizationId });

      // Buscar todos os contatos da organização
      const { data: contacts } = await this.supabaseService.supabase
        .from('whatsapp_contacts')
        .select(`
          *,
          whatsapp_conversations (
            id,
            updated_at,
            status
          )
        `)
        .eq('organization_id', organizationId);

      if (!contacts || contacts.length === 0) {
        logger.info('No contacts found for follow-up', { organizationId });
        return { processed: 0, sent: 0, skipped: 0 };
      }

      // Buscar configuração de negócio
      const businessConfig = await this.supabaseService.getBusinessConfig(organizationId);

      if (!businessConfig || !businessConfig.auto_reply) {
        logger.info('Auto-reply disabled, skipping follow-ups', { organizationId });
        return { processed: 0, sent: 0, skipped: 0 };
      }

      // Processar cada contato
      for (const contact of contacts) {
        processed++;

        const shouldSend = await this.shouldSendFollowup(contact, organizationId);

        if (shouldSend.should) {
          const success = await this.sendFollowupMessage(
            contact,
            shouldSend.rule!,
            organizationId,
            businessConfig
          );

          if (success) {
            sent++;
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }
      }

      logger.info('Daily follow-up processing completed', {
        organizationId,
        processed,
        sent,
        skipped
      });

      return { processed, sent, skipped };

    } catch (error) {
      logger.error('Error processing daily follow-ups:', error);
      return { processed, sent, skipped };
    }
  }

  /**
   * Verifica se deve enviar follow-up para contato
   */
  private async shouldSendFollowup(
    contact: any,
    organizationId: string
  ): Promise<{ should: boolean; rule?: FollowUpRule }> {
    try {
      // Pega última conversa
      const lastConversation = contact.whatsapp_conversations?.[0];

      if (!lastConversation) {
        return { should: false };
      }

      const daysSinceLastContact = this.getDaysSince(lastConversation.updated_at);

      // Verifica se já não enviou follow-up hoje
      const { data: recentMessages } = await this.supabaseService.supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', lastConversation.id)
        .eq('sender_type', 'ai')
        .eq('direction', 'outbound')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (recentMessages && recentMessages.length > 0) {
        // Já enviou mensagem nas últimas 24h
        return { should: false };
      }

      // Encontra regra aplicável
      const applicableRule = FOLLOWUP_RULES.find(rule =>
        daysSinceLastContact >= rule.daysAfterLastContact
      );

      if (!applicableRule) {
        return { should: false };
      }

      return { should: true, rule: applicableRule };

    } catch (error) {
      logger.error('Error checking follow-up eligibility:', error);
      return { should: false };
    }
  }

  /**
   * Envia mensagem de follow-up
   */
  private async sendFollowupMessage(
    contact: any,
    rule: FollowUpRule,
    organizationId: string,
    businessConfig: any
  ): Promise<boolean> {
    try {
      // Buscar pets do contato
      const pets = await this.supabaseService.getCustomerPets(contact.id);
      const pet = pets?.[0];

      if (!pet) {
        logger.warn('No pet found for contact, skipping follow-up', { contactId: contact.id });
        return false;
      }

      // Buscar instância WhatsApp da organização
      const { data: instance } = await this.supabaseService.supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'connected')
        .single();

      if (!instance) {
        logger.warn('No active WhatsApp instance for organization', { organizationId });
        return false;
      }

      // Selecionar template e personalizar
      const template = this.randomChoice(rule.messageTemplates);
      let message = template
        .replace(/{nome}/g, contact.name || 'querido cliente')
        .replace(/{pet}/g, pet.name || 'seu pet');

      // Adicionar serviço sugerido se includeOffer
      if (rule.includeOffer) {
        const suggestedService = this.suggestService(pet);
        message = message.replace(/{serviço_sugerido}/g, suggestedService);
      }

      // Humanizar mensagem
      message = this.humanizationEngine.humanize(message, {
        customerTone: 'informal',
        useEmojis: true
      });

      // Enviar mensagem
      const result = await this.messageSender.sendWithTypingIndicator(
        instance.instance_name,
        contact.phone,
        message,
        3000 // 3s de "digitando"
      );

      if (result.success) {
        // Salvar no banco
        await this.supabaseService.saveMessage({
          conversation_id: contact.whatsapp_conversations[0].id,
          instance_id: instance.id,
          content: message,
          direction: 'outbound',
          message_type: 'text',
          external_id: result.messageId || `followup_${Date.now()}`,
          organization_id: organizationId,
          metadata: {
            proactive: true,
            followupRule: rule.name,
            pnlTechnique: rule.pnlTechnique
          }
        });

        logger.info('Follow-up message sent', {
          contactId: contact.id,
          rule: rule.name,
          messageId: result.messageId
        });

        return true;
      }

      return false;

    } catch (error) {
      logger.error('Error sending follow-up message:', error);
      return false;
    }
  }

  /**
   * Sugere serviço baseado no pet
   */
  private suggestService(pet: any): string {
    const services = {
      dog: ['banho e tosa', 'spa pet', 'corte de unha', 'hidratação'],
      cat: ['banho', 'tosa', 'corte de unha']
    };

    const petType = pet.species?.toLowerCase() === 'gato' ? 'cat' : 'dog';
    const serviceList = services[petType];

    return this.randomChoice(serviceList);
  }

  /**
   * Calcula dias desde uma data
   */
  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Escolhe item aleatório
   */
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}