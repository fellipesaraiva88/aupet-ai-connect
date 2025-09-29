import OpenAI from 'openai';
import { logger } from '../utils/logger';
import {
  AIAnalysis,
  AIContext,
  BusinessConfig,
  CustomerData
} from '../types';
import { HumanizationEngine } from './ai/humanization-engine';
import { PNL_TECHNIQUES, selectPNLTechniqueByIntent, applyPNLTechnique } from './ai/pnl-patterns';
import { OpportunityDetector, DetectedOpportunity } from './ai/opportunity-detector';
import TokenTrackerService from './token-tracker';

export class AIService {
  private openai: OpenAI | null = null;
  private defaultPersonality = 'friendly';
  private defaultTemperature = 0.7;
  private defaultMaxTokens = 200;
  private humanizationEngine: HumanizationEngine;
  private opportunityDetector: OpportunityDetector;
  private tokenTracker: TokenTrackerService;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    this.humanizationEngine = new HumanizationEngine();
    this.opportunityDetector = new OpportunityDetector();
    this.tokenTracker = new TokenTrackerService();

    if (!apiKey) {
      logger.warn('OpenAI API key not provided. AI features will be limited.');
      return;
    }

    this.openai = new OpenAI({
      apiKey,
    });

    logger.info('AI service initialized with OpenAI, PNL, Opportunity Detection and Token Tracking');
  }

  // Main AI Analysis Method
  async analyzeMessage(
    message: string,
    customerContext: any,
    businessConfig: BusinessConfig,
    organizationId?: string,
    userId?: string
  ): Promise<AIAnalysis> {
    try {
      if (!this.openai) {
        return this.getFallbackAnalysis(message);
      }

      const context = this.buildAnalysisContext(message, customerContext, businessConfig);

      const prompt = `
Analise esta mensagem de WhatsApp para um pet shop e forneça uma análise estruturada.

CONTEXTO:
${context}

MENSAGEM DO CLIENTE: "${message}"

Analise e responda em JSON com:
{
  "intent": "string (agendar, duvida, emergencia, reclamacao, elogio, informacao, orcamento)",
  "sentiment": "positive | neutral | negative",
  "urgency": "low | medium | high | critical",
  "needsHuman": boolean,
  "confidence": number (0-1),
  "suggestedResponse": "string (resposta sugerida personalizada)",
  "extractedEntities": {
    "petName": "string ou null",
    "serviceType": "string ou null",
    "date": "string ou null",
    "time": "string ou null"
  }
}

REGRAS:
- Se mencionarem palavras como "humano", "atendente", "falar com alguém" → needsHuman: true
- Emergências (palavras como "urgente", "socorro", "machucado") → urgency: "critical", needsHuman: true
- Agendamentos → intent: "agendar", extrair data/hora se mencionadas
- Seja carinhoso e use o nome do pet quando possível
- Resposta deve ser calorosa e profissional
- Máximo 150 caracteres na resposta
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em atendimento para pet shops. Sempre responda em JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      // Track token usage
      if (organizationId && response.usage) {
        await this.tokenTracker.trackTokenUsage({
          organizationId,
          userId,
          model: response.model || 'gpt-4o-mini',
          promptTokens: response.usage.prompt_tokens || 0,
          completionTokens: response.usage.completion_tokens || 0,
          totalTokens: response.usage.total_tokens || 0,
          metadata: {
            feature: 'analyze_message',
            intent: 'analyze'
          }
        });
      }

      const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');

      logger.ai('ANALYZE_MESSAGE', {
        intent: analysis.intent,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        needsHuman: analysis.needsHuman,
        tokensUsed: response.usage?.total_tokens || 0
      });

      return {
        intent: analysis.intent || 'informacao',
        sentiment: analysis.sentiment || 'neutral',
        urgency: analysis.urgency || 'low',
        needsHuman: analysis.needsHuman || false,
        confidence: analysis.confidence || 0.7,
        suggestedResponse: analysis.suggestedResponse || '',
        extractedEntities: analysis.extractedEntities || {}
      };

    } catch (error) {
      logger.error('Error analyzing message with AI:', error);
      return this.getFallbackAnalysis(message);
    }
  }

  // Generate Personalized Response with PNL and Humanization
  async generateResponse(
    intent: string,
    customerContext: any,
    businessConfig: BusinessConfig,
    previousMessages: any[] = []
  ): Promise<string> {
    try {
      if (!this.openai) {
        return this.getFallbackResponse(intent, customerContext);
      }

      const context = this.buildResponseContext(customerContext, businessConfig, previousMessages);

      // Detectar preferências do cliente para humanização
      const customerMessages = previousMessages
        .filter((m: any) => m.direction === 'inbound')
        .map((m: any) => m.content);

      const useEmojis = this.humanizationEngine.detectEmojiUsage(customerMessages);
      const customerTone = this.humanizationEngine.detectCustomerTone(customerMessages);

      // Selecionar técnica de PNL baseada na intenção
      const pnlTechnique = selectPNLTechniqueByIntent(intent);
      const pnlInfo = PNL_TECHNIQUES[pnlTechnique];

      const personality = this.getPersonalityPrompt(businessConfig.ai_personality);

      const prompt = `
${personality}

CONTEXTO DO CLIENTE:
${context}

INTENÇÃO DETECTADA: ${intent}

TÉCNICA DE COMUNICAÇÃO (PNL):
Aplique a técnica "${pnlInfo.name}": ${pnlInfo.description}
Exemplos de padrões: ${pnlInfo.patterns.slice(0, 2).join(', ')}

Gere uma resposta personalizada seguindo estas diretrizes:

REGRAS DE COMUNICAÇÃO:
- Use o nome do cliente: ${customerContext?.name || 'querido cliente'}
- Use o nome do pet se disponível: ${customerContext?.pets?.[0]?.name || 'seu pet'}
- Seja EXTREMAMENTE natural e humana
- Fale como uma pessoa real, não como IA
- Fragmenta naturalmente (pontos, vírgulas)
- Tom: ${customerTone} (espelhe o cliente)
- Emojis: ${useEmojis ? 'Sim, sutilmente' : 'Não use'}
- Máximo 180 caracteres
- Demonstre empatia e cuidado genuíno
- NUNCA pareça robótica ou automática

APLICAR TÉCNICA PNL:
${pnlInfo.examples[0] || 'Aplique os padrões listados acima'}

EXEMPLOS DE NATURALIDADE:
- "Oi! Nossa, faz tempo que não vejo o Thor aqui... Como ele tá?"
- "Deixa eu ver aqui... Tenho uma vaguinha amanhã às 14h! Serve?"
- "Aiii que dó 😢 Vamos cuidar disso rapidinho, pode vir?"

Responda APENAS com a mensagem final, SEM explicações ou introduções.
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é uma atendente carinhosa de pet shop. Fale como um humano real, nunca como IA. Seja natural, empática e use PNL.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: businessConfig.ai_personality === 'formal' ? 0.5 : 0.8, // Mais criativo
        max_tokens: 200
      });

      let generatedResponse = response.choices[0]?.message?.content?.trim() || '';

      // APLICAR HUMANIZAÇÃO TOTAL
      generatedResponse = this.humanizationEngine.humanize(generatedResponse, {
        customerTone,
        useEmojis,
        variationLevel: 0.7,
        errorProbability: 0.08 // 8% de chance de "erro" humano
      });

      logger.ai('GENERATE_RESPONSE_PNL', {
        intent,
        pnlTechnique,
        responseLength: generatedResponse.length,
        customer: customerContext?.name,
        humanized: true
      });

      return generatedResponse || this.getFallbackResponse(intent, customerContext);

    } catch (error) {
      logger.error('Error generating AI response:', error);
      return this.getFallbackResponse(intent, customerContext);
    }
  }

  // Sentiment Analysis
  async analyzeSentiment(messages: string[]): Promise<'positive' | 'neutral' | 'negative'> {
    try {
      if (!this.openai || messages.length === 0) {
        return 'neutral';
      }

      const combinedText = messages.slice(-5).join(' ');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Analise o sentimento das mensagens e responda apenas: positive, neutral ou negative'
          },
          {
            role: 'user',
            content: `Analise o sentimento: "${combinedText}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      const sentiment = response.choices[0]?.message?.content?.trim().toLowerCase() as 'positive' | 'neutral' | 'negative';

      return ['positive', 'neutral', 'negative'].includes(sentiment) ? sentiment : 'neutral';

    } catch (error) {
      logger.error('Error analyzing sentiment:', error);
      return 'neutral';
    }
  }

  // Extract Insights from Conversations
  async extractInsights(conversations: any[]): Promise<any> {
    try {
      if (!this.openai || conversations.length === 0) {
        return this.getFallbackInsights();
      }

      const conversationSummary = conversations.slice(-10).map(conv => ({
        customer: conv.customer_name,
        messages: conv.messages?.slice(-3)?.map((m: any) => m.content).join(' ')
      }));

      const prompt = `
Analise estas conversações recentes de um pet shop e extraia insights:

CONVERSAÇÕES:
${JSON.stringify(conversationSummary, null, 2)}

Forneça insights em JSON:
{
  "commonTopics": ["string"],
  "sentimentTrend": "improving | stable | declining",
  "urgentPatterns": ["string"],
  "suggestions": ["string"],
  "customerSatisfaction": number (0-10),
  "responseEffectiveness": number (0-10)
}
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um analista de dados especializado em atendimento ao cliente. Responda em JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      });

      const insights = JSON.parse(response.choices[0]?.message?.content || '{}');

      logger.ai('EXTRACT_INSIGHTS', { conversationsAnalyzed: conversations.length });

      return insights;

    } catch (error) {
      logger.error('Error extracting insights:', error);
      return this.getFallbackInsights();
    }
  }

  // Check if message should be escalated to human
  shouldEscalateToHuman(
    message: string,
    analysis: AIAnalysis,
    businessConfig: BusinessConfig
  ): boolean {
    // Check escalation keywords
    const escalationKeywords = businessConfig.escalation_keywords || ['humano', 'atendente', 'falar com alguém'];
    const messageWords = message.toLowerCase();

    for (const keyword of escalationKeywords) {
      if (messageWords.includes(keyword.toLowerCase())) {
        logger.ai('ESCALATION_TRIGGERED', { reason: 'keyword', keyword });
        return true;
      }
    }

    // Check urgency and sentiment
    if (analysis.urgency === 'critical') {
      logger.ai('ESCALATION_TRIGGERED', { reason: 'critical_urgency' });
      return true;
    }

    if (analysis.sentiment === 'negative' && analysis.urgency === 'high') {
      logger.ai('ESCALATION_TRIGGERED', { reason: 'negative_high_urgency' });
      return true;
    }

    // Check AI confidence
    if (analysis.confidence < 0.5) {
      logger.ai('ESCALATION_TRIGGERED', { reason: 'low_confidence', confidence: analysis.confidence });
      return true;
    }

    return analysis.needsHuman;
  }

  // Business Hours Check
  isWithinBusinessHours(businessConfig: BusinessConfig): boolean {
    if (!businessConfig.business_hours?.enabled) {
      return true;
    }

    const now = new Date();
    const timezone = businessConfig.business_hours.timezone || 'America/Sao_Paulo';
    const currentTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long',
      hour12: false
    }).formatToParts(now);

    const weekday = currentTime.find(part => part.type === 'weekday')?.value.toLowerCase();
    const hour = parseInt(currentTime.find(part => part.type === 'hour')?.value || '0');
    const minute = parseInt(currentTime.find(part => part.type === 'minute')?.value || '0');
    const currentMinutes = hour * 60 + minute;

    const dayConfig = businessConfig.business_hours.schedule[weekday || 'monday'];

    if (!dayConfig?.enabled) {
      return false;
    }

    const [startHour = 9, startMinute = 0] = dayConfig.start?.split(':').map(Number) || [9, 0];
    const [endHour = 18, endMinute = 0] = dayConfig.end?.split(':').map(Number) || [18, 0];

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  // Private Helper Methods
  private buildAnalysisContext(message: string, customerContext: any, businessConfig: BusinessConfig): string {
    return `
Cliente: ${customerContext?.name || 'Nome não informado'}
Pet(s): ${customerContext?.pets?.map((p: any) => `${p.name} (${p.species})`).join(', ') || 'Nenhum pet cadastrado'}
Histórico: ${customerContext?.lastInteraction ? 'Cliente recorrente' : 'Primeira interação'}
Negócio: ${businessConfig.business_name}
Horário comercial: ${this.isWithinBusinessHours(businessConfig) ? 'Sim' : 'Não'}
`.trim();
  }

  private buildResponseContext(customerContext: any, businessConfig: BusinessConfig, previousMessages: any[]): string {
    return `
Cliente: ${customerContext?.name || 'Nome não informado'}
Pet principal: ${customerContext?.pets?.[0]?.name || 'Pet'} (${customerContext?.pets?.[0]?.species || 'espécie não informada'})
Últimas mensagens: ${previousMessages.slice(-3).map(m => m.content).join(' | ') || 'Nenhuma'}
Negócio: ${businessConfig.business_name}
Mensagem de boas-vindas padrão: ${businessConfig.welcome_message}
`.trim();
  }

  private getPersonalityPrompt(personality: string): string {
    const personalities = {
      professional: 'Seja profissional, cordial e direto. Use linguagem formal mas calorosa.',
      friendly: 'Seja caloroso, acolhedor e amigável. Use uma linguagem carinhosa e próxima.',
      casual: 'Seja descontraído, natural e espontâneo. Use linguagem informal mas respeitosa.',
      formal: 'Seja formal, elegante e respeitoso. Use linguagem culta e protocolar.'
    };

    return personalities[personality as keyof typeof personalities] || personalities.friendly;
  }

  private getFallbackAnalysis(message: string): AIAnalysis {
    const urgentWords = ['urgente', 'emergencia', 'socorro', 'machucado', 'sangue', 'doente'];
    const escalationWords = ['humano', 'atendente', 'falar com alguém', 'pessoa'];

    const isUrgent = urgentWords.some(word => message.toLowerCase().includes(word));
    const needsHuman = escalationWords.some(word => message.toLowerCase().includes(word));

    return {
      intent: isUrgent ? 'emergencia' : 'informacao',
      sentiment: 'neutral',
      urgency: isUrgent ? 'critical' : 'medium',
      needsHuman: needsHuman || isUrgent,
      confidence: 0.6,
      suggestedResponse: 'Obrigado pela sua mensagem! Nossa equipe irá te responder em breve. 💝',
      extractedEntities: {}
    };
  }

  private getFallbackResponse(intent: string, customerContext: any): string {
    const name = customerContext?.name || 'querido cliente';
    const petName = customerContext?.pets?.[0]?.name || 'seu pet';

    const responses = {
      agendar: `Olá ${name}! Vamos agendar um horário especial para o ${petName}! Te retorno com as opções em breve. 💝`,
      duvida: `Oi ${name}! Estamos aqui para esclarecer tudo sobre o ${petName}. Nossa equipe irá te responder rapidinho! 🐾`,
      emergencia: `${name}, vamos ajudar o ${petName} agora mesmo! Nossa equipe já foi notificada. Se for urgente, venha imediatamente!`,
      informacao: `Olá ${name}! Obrigado por entrar em contato. Vamos cuidar de tudo que o ${petName} precisa! 💝`,
      orcamento: `Oi ${name}! Vamos preparar um orçamento especial para o ${petName}. Te enviamos os valores em breve! 🐾`,
      elogio: `${name}, que alegria receber seu feedback! Ficamos felizes em cuidar do ${petName} com tanto carinho! 💝`,
      reclamacao: `${name}, nos desculpe pelo ocorrido. Vamos resolver isso imediatamente. O ${petName} merece nosso melhor! 🐾`
    };

    return responses[intent as keyof typeof responses] || responses.informacao;
  }

  private getFallbackInsights(): any {
    return {
      commonTopics: ['agendamentos', 'banho e tosa', 'consultas'],
      sentimentTrend: 'stable',
      urgentPatterns: ['emergências veterinárias', 'agendamentos urgentes'],
      suggestions: [
        'Implementar agendamento online',
        'Criar FAQ para dúvidas comuns',
        'Melhorar tempo de resposta'
      ],
      customerSatisfaction: 8.5,
      responseEffectiveness: 7.8
    };
  }

  // Detect Sales Opportunities
  detectOpportunities(
    message: string,
    customerContext: any,
    recentServices: any[] = []
  ): DetectedOpportunity[] {
    const opportunities = this.opportunityDetector.detectOpportunities(message, customerContext);

    // Filtra oportunidades que não devem ser oferecidas
    return opportunities.filter(opp =>
      this.opportunityDetector.shouldOfferService(opp.service, customerContext, recentServices)
    );
  }

  // Generate Response with Opportunity
  async generateResponseWithOpportunity(
    intent: string,
    customerContext: any,
    businessConfig: BusinessConfig,
    previousMessages: any[] = [],
    opportunity?: DetectedOpportunity
  ): Promise<string> {
    // Se tem oportunidade de alta confiança, usa ela
    if (opportunity && opportunity.confidence >= 0.6) {
      const opportunityResponse = this.opportunityDetector.generateOpportunityResponse(
        opportunity,
        customerContext,
        businessConfig
      );

      // Humaniza a resposta de oportunidade
      const humanized = this.humanizationEngine.humanize(opportunityResponse, {
        customerTone: this.humanizationEngine.detectCustomerTone(
          previousMessages.filter((m: any) => m.direction === 'inbound').map((m: any) => m.content)
        ),
        useEmojis: this.humanizationEngine.detectEmojiUsage(
          previousMessages.filter((m: any) => m.direction === 'inbound').map((m: any) => m.content)
        )
      });

      logger.ai('RESPONSE_WITH_OPPORTUNITY', {
        intent,
        opportunityService: opportunity.service,
        confidence: opportunity.confidence
      });

      return humanized;
    }

    // Caso contrário, gera resposta normal
    return this.generateResponse(intent, customerContext, businessConfig, previousMessages);
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.openai) {
        return false;
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      });

      return !!response.choices[0]?.message?.content;
    } catch (error) {
      logger.error('AI service health check failed:', error);
      return false;
    }
  }
}