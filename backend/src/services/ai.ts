import OpenAI from 'openai';
import { logger } from '../utils/logger';
import {
  AIAnalysis,
  AIContext,
  BusinessConfig,
  CustomerData
} from '../types';

export class AIService {
  private openai: OpenAI | null = null;
  private defaultPersonality = 'friendly';
  private defaultTemperature = 0.7;
  private defaultMaxTokens = 200;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      logger.warn('OpenAI API key not provided. AI features will be limited.');
      return;
    }

    this.openai = new OpenAI({
      apiKey,
    });

    logger.info('AI service initialized with OpenAI');
  }

  // Main AI Analysis Method
  async analyzeMessage(
    message: string,
    customerContext: any,
    businessConfig: BusinessConfig
  ): Promise<AIAnalysis> {
    try {
      if (!this.openai) {
        return this.getFallbackAnalysis(message);
      }

      const context = this.buildAnalysisContext(message, customerContext, businessConfig);

      const prompt = `
Você é uma assistente virtual HUMANIZADA de um pet shop, especializada em atendimento de excelência.

PERSONALIDADE:
- Tom de voz: Amigável, carinhoso e empático com tutores
- Linguagem: Informal mas profissional, usando termos do universo pet brasileiro
- Empatia: Apaixonada por animais, prestativa e consultiva
- Trate clientes como "tutor(a)" ou pelo nome
- Use emojis moderadamente (🐶🐱❤️🐾) para humanizar

CONTEXTO DO CLIENTE:
${context}

MENSAGEM RECEBIDA: "${message}"

ANÁLISE REQUERIDA (responda em JSON):
{
  "intent": "agendar | duvida | emergencia | reclamacao | elogio | informacao | orcamento | interesse_compra | duvida_produto",
  "sentiment": "positive | neutral | negative",
  "urgency": "low | medium | high | critical",
  "needsHuman": boolean,
  "confidence": number (0-1),
  "suggestedResponse": "string",
  "extractedEntities": {
    "petName": "string ou null",
    "petSpecies": "string ou null (cão, gato, etc)",
    "serviceType": "string ou null (banho, tosa, consulta, vacina, etc)",
    "productInterest": "string ou null",
    "date": "string ou null",
    "time": "string ou null",
    "budget": "string ou null"
  },
  "salesOpportunity": boolean,
  "recommendedProducts": ["string"] (opcional)
}

REGRAS DE DETECÇÃO:
1. ESCALAÇÃO HUMANA (needsHuman: true):
   - Palavras: "humano", "atendente", "falar com alguém", "pessoa"
   - Emergências: "urgente", "socorro", "machucado", "sangue", "envenenado"
   - Reclamações sérias: "péssimo", "horrível", "processo", "advogado"

2. URGÊNCIA:
   - critical: Emergências médicas, acidentes, intoxicação
   - high: Agendamentos urgentes, problemas graves
   - medium: Dúvidas importantes, orçamentos
   - low: Informações gerais, curiosidades

3. OPORTUNIDADES DE VENDA (salesOpportunity: true):
   - Interesse em produtos/serviços
   - Perguntas sobre preços
   - Necessidades de cuidados específicos
   - Pedidos de recomendação

4. RESPOSTA HUMANIZADA:
   - Use o nome do tutor e do pet
   - Seja calorosa e acolhedora
   - Demonstre conhecimento sobre pets
   - Ofereça soluções proativas
   - Máximo 180 caracteres
   - Use 1-2 emojis relacionados a pets
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

      const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');

      logger.ai('ANALYZE_MESSAGE', {
        intent: analysis.intent,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        needsHuman: analysis.needsHuman
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

  // Generate Personalized Response
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

      const personality = this.getPersonalityPrompt(businessConfig.ai_personality);

      const prompt = `
${personality}

VOCÊ É UMA ASSISTENTE VIRTUAL HUMANIZADA DE PET SHOP - ATENDIMENTO DE EXCELÊNCIA 24/7

OBJETIVO PRINCIPAL:
Aumentar receita através de conversas naturais, agendamentos automatizados e vendas consultivas

CONTEXTO DO CLIENTE:
${context}

INTENÇÃO DETECTADA: ${intent}

REGRAS PARA RESPOSTA HUMANIZADA:

1. PERSONALIZAÇÃO TOTAL:
   - SEMPRE use o nome do tutor: ${customerContext?.name || 'tutor(a)'}
   - SEMPRE mencione o pet: ${customerContext?.pets?.[0]?.name || 'seu pet'} ${customerContext?.pets?.[0]?.species ? `(${customerContext?.pets?.[0]?.species})` : ''}
   - Demonstre que conhece o histórico do cliente

2. TOM & LINGUAGEM:
   - Empático e carinhoso com tutores
   - Informal mas profissional
   - Use termos do universo pet brasileiro
   - Emojis moderados: 🐶🐱❤️🐾 (1-2 por mensagem)
   - Trate como "tutor(a)" ou pelo nome

3. ESTRATÉGIA DE VENDAS CONSULTIVAS:
   - Identifique necessidades não explícitas
   - Ofereça soluções proativas
   - Sugira produtos/serviços complementares
   - Crie senso de urgência sutil
   - Facilite o agendamento/compra

4. EXEMPLOS POR INTENÇÃO:

AGENDAMENTO:
"Oi ${customerContext?.name}! 💝 Vamos agendar um momento especial pro ${customerContext?.pets?.[0]?.name || 'seu pet'}! Temos horário amanhã às 14h ou sexta às 10h. Qual é melhor pra você?"

DÚVIDA PRODUTO:
"Olá ${customerContext?.name}! 🐾 Entendo sua dúvida sobre [produto]. Pro ${customerContext?.pets?.[0]?.name || 'seu pet'}, recomendo [solução]. Inclusive, temos uma promoção hoje! Quer que eu separe?"

EMERGÊNCIA:
"${customerContext?.name}, entendo a urgência! 🐶 Vamos ajudar o ${customerContext?.pets?.[0]?.name || 'seu pet'} AGORA. Pode vir imediatamente ao consultório ou prefere orientação por aqui primeiro?"

ORÇAMENTO:
"Oi ${customerContext?.name}! ❤️ Vou preparar um orçamento especial pro ${customerContext?.pets?.[0]?.name || 'seu pet'}. [Serviço] fica em R$X, mas tenho um combo que sai mais em conta. Te mando os detalhes?"

5. LIMITAÇÕES:
   - Máximo 200 caracteres (seja objetiva)
   - Linguagem simples e clara
   - Call-to-action sempre presente
   - Facilite próxima ação do cliente

IMPORTANTE: Responda APENAS a mensagem final, SEM explicações ou comentários adicionais.
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é uma assistente virtual HUMANIZADA especializada em pet shops.
Seu objetivo é criar conexões emocionais com tutores, aumentar receita através de vendas consultivas e fornecer atendimento de excelência 24/7.
Seja empática, carinhosa e sempre focada no bem-estar dos pets e satisfação dos tutores.
Responda APENAS com a mensagem final para o cliente, sem explicações adicionais.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: businessConfig.ai_personality === 'formal' ? 0.4 : 0.8,
        max_tokens: 200
      });

      const generatedResponse = response.choices[0]?.message?.content?.trim() || '';

      logger.ai('GENERATE_RESPONSE', {
        intent,
        responseLength: generatedResponse.length,
        customer: customerContext?.name
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