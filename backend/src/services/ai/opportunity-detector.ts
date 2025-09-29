import { logger } from '../../utils/logger';
import { PNL_TECHNIQUES } from './pnl-patterns';

/**
 * Opportunity Detector - Detecta oportunidades de venda em mensagens
 * Usa sinais sutis para identificar necessidades e sugerir soluções
 */

export interface DetectedOpportunity {
  type: 'service' | 'product' | 'package';
  category: string;
  service: string;
  confidence: number; // 0 a 1
  urgency: 'low' | 'medium' | 'high' | 'critical';
  triggers: string[]; // Palavras que dispararam
  suggestedResponse: string;
  pnlTechnique: string;
}

export interface OpportunityPattern {
  keywords: string[];
  category: string;
  service: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  responseTemplate: string;
  pnlTechnique: keyof typeof PNL_TECHNIQUES;
}

/**
 * Padrões de oportunidades baseados em problemas/necessidades
 */
export const OPPORTUNITY_PATTERNS: OpportunityPattern[] = [
  // BANHO E TOSA
  {
    keywords: ['sujo', 'fedendo', 'cheiro', 'fedorento', 'mal cheiro', 'precisa banho'],
    category: 'higiene',
    service: 'banho_tosa',
    urgency: 'medium',
    responseTemplate: 'Aiii, imagino como deve estar desconfortável! 😢 Que tal um banho relaxante pra ele? Deixa o {pet} cheirosinho e confortável de novo!',
    pnlTechnique: 'ancoragem'
  },
  {
    keywords: ['pelo comprido', 'pelo longo', 'muito pelo', 'precisa cortar', 'tosa'],
    category: 'estética',
    service: 'tosa',
    urgency: 'low',
    responseTemplate: 'Nossa, ele deve estar quentinho com esse pelão todo! 😅 Uma tosin resolveria... Ele vai ficar lindão! Que tal?',
    pnlTechnique: 'escassez'
  },
  {
    keywords: ['unha', 'arranhando', 'arranha', 'unha grande', 'unha comprida'],
    category: 'higiene',
    service: 'corte_unha',
    urgency: 'medium',
    responseTemplate: 'Olha, isso pode ser as unhinhas dele precisando de um corte... Além de incomodar, pode machucar. Quer que eu veja uma vaga pra já resolver isso?',
    pnlTechnique: 'autoridade'
  },

  // SAÚDE E VETERINÁRIA
  {
    keywords: ['coçando', 'se coça', 'coceira', 'arranhando muito', 'pulgas', 'carrapato'],
    category: 'saúde',
    service: 'consulta_dermatologica',
    urgency: 'high',
    responseTemplate: 'Aiii coitadinho, ele deve estar super incomodado 😢 Isso pode ser alergia ou parasitas... Nossa veterinária pode dar uma olhada hoje mesmo! Posso agendar?',
    pnlTechnique: 'rapport'
  },
  {
    keywords: ['vômito', 'vomitando', 'diarreia', 'não come', 'sem apetite', 'fraco', 'abatido'],
    category: 'saúde',
    service: 'consulta_emergencia',
    urgency: 'critical',
    responseTemplate: 'Nossa, vamos cuidar do {pet} agora mesmo! Isso precisa de atenção rápida. Pode trazer imediatamente ou precisa que alguém vá buscar?',
    pnlTechnique: 'rapport'
  },
  {
    keywords: ['vacina', 'precisa vacina', 'vacinação', 'imunização'],
    category: 'prevenção',
    service: 'vacinacao',
    urgency: 'medium',
    responseTemplate: 'Ótimo você lembrar disso! 💕 Vacina é super importante pra manter ele sempre saudável. Temos todas as vacinas aqui! Quer agendar?',
    pnlTechnique: 'autoridade'
  },

  // COMPORTAMENTO
  {
    keywords: ['ansioso', 'ansiedade', 'destruindo', 'latindo muito', 'chorando', 'estresse'],
    category: 'comportamento',
    service: 'consulta_comportamental',
    urgency: 'medium',
    responseTemplate: 'Entendo completamente... 💙 Ansiedade em pets é mais comum do que parece! Temos uma especialista que pode ajudar muito. Quer que eu explique como funciona?',
    pnlTechnique: 'rapport'
  },

  // VIAGEM/HOSPEDAGEM
  {
    keywords: ['viagem', 'viajar', 'férias', 'deixar', 'ficar sozinho', 'final de semana fora'],
    category: 'hospedagem',
    service: 'hotel_pet',
    urgency: 'medium',
    responseTemplate: 'Ahhh, vai viajar! 😊 Olha, o {pet} pode ficar aqui no nosso hotel! Ele fica super bem cuidado, com veterinária 24h. Quer conhecer?',
    pnlTechnique: 'ancoragem'
  },

  // ALIMENTAÇÃO
  {
    keywords: ['ração', 'comida', 'alimentação', 'não come', 'come pouco', 'peso'],
    category: 'nutricao',
    service: 'consulta_nutricional',
    urgency: 'low',
    responseTemplate: 'Nutrição é super importante! 🍖 Nossa veterinária pode avaliar e indicar a melhor alimentação pro {pet}. Também temos rações especiais aqui!',
    pnlTechnique: 'autoridade'
  },

  // FILHOTE
  {
    keywords: ['filhote', 'filhotinho', 'bebê', 'novo', 'acabei de pegar', 'acabei de adotar'],
    category: 'filhote',
    service: 'pacote_filhote',
    urgency: 'high',
    responseTemplate: 'Aiii que fofinho! 😍 Bem-vindo à família! Olha, temos um pacote especial pra filhotes com tudo que ele precisa: vacinas, vermífugo, orientações... Quer saber mais?',
    pnlTechnique: 'ancoragem'
  },

  // IDADE AVANÇADA
  {
    keywords: ['idoso', 'velho', 'idoso', 'velhinho', 'idade', 'anos'],
    category: 'geriatria',
    service: 'check_up_senior',
    urgency: 'medium',
    responseTemplate: 'Pets mais velhinhos são especiais né? 💙 Eles precisam de cuidados específicos... Temos um check-up completo pra pets seniors. Previne várias coisinhas!',
    pnlTechnique: 'autoridade'
  },

  // ESTÉTICA
  {
    keywords: ['bonito', 'lindo', 'beleza', 'spa', 'estética', 'hidratação'],
    category: 'estética',
    service: 'spa_pet',
    urgency: 'low',
    responseTemplate: 'Ahhh, você cuida super bem do {pet}! 😍 Que tal um spa completo? Hidratação, massagem, tudo pra ele ficar ainda mais lindo e relaxado!',
    pnlTechnique: 'ancoragem'
  }
];

export class OpportunityDetector {
  /**
   * Detecta oportunidades em uma mensagem
   */
  detectOpportunities(message: string, customerContext?: any): DetectedOpportunity[] {
    const messageLower = message.toLowerCase();
    const opportunities: DetectedOpportunity[] = [];

    for (const pattern of OPPORTUNITY_PATTERNS) {
      const matchedKeywords = pattern.keywords.filter(keyword =>
        messageLower.includes(keyword.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        // Calcula confiança baseado em quantas keywords matcharam
        const confidence = Math.min(matchedKeywords.length / pattern.keywords.length, 1);

        // Personaliza resposta com dados do cliente
        let suggestedResponse = pattern.responseTemplate;
        if (customerContext?.pets?.[0]) {
          suggestedResponse = suggestedResponse.replace(/{pet}/g, customerContext.pets[0].name || 'seu pet');
          suggestedResponse = suggestedResponse.replace(/{especie}/g, customerContext.pets[0].species || 'pet');
        } else {
          suggestedResponse = suggestedResponse.replace(/{pet}/g, 'seu pet');
          suggestedResponse = suggestedResponse.replace(/{especie}/g, 'pet');
        }

        opportunities.push({
          type: 'service',
          category: pattern.category,
          service: pattern.service,
          confidence,
          urgency: pattern.urgency,
          triggers: matchedKeywords,
          suggestedResponse,
          pnlTechnique: pattern.pnlTechnique
        });
      }
    }

    // Ordena por urgência e confiança
    opportunities.sort((a, b) => {
      const urgencyWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.confidence - a.confidence;
    });

    logger.ai('OPPORTUNITIES_DETECTED', {
      messageLength: message.length,
      opportunitiesFound: opportunities.length,
      topOpportunity: opportunities[0]?.service
    });

    return opportunities;
  }

  /**
   * Verifica se deve oferecer serviço baseado em contexto histórico
   */
  shouldOfferService(
    service: string,
    customerContext: any,
    recentServices: any[] = []
  ): boolean {
    // Não oferece se cliente fez recentemente (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const hasRecentService = recentServices.some((s: any) =>
      s.service_type === service &&
      new Date(s.scheduled_date) > thirtyDaysAgo
    );

    if (hasRecentService) {
      logger.ai('OPPORTUNITY_SKIPPED', {
        service,
        reason: 'recent_service'
      });
      return false;
    }

    return true;
  }

  /**
   * Gera resposta combinando oportunidade com PNL
   */
  generateOpportunityResponse(
    opportunity: DetectedOpportunity,
    customerContext: any,
    businessConfig: any
  ): string {
    let response = opportunity.suggestedResponse;

    // Adiciona gatilho de escassez se urgência for alta
    if (opportunity.urgency === 'high' || opportunity.urgency === 'critical') {
      const scarcityPhrases = [
        ' Posso encaixar hoje ainda!',
        ' Tenho uma vaguinha hoje!',
        ' Podemos ver isso agora mesmo!',
        ' Vamos resolver isso rápido!'
      ];
      response += this.randomChoice(scarcityPhrases);
    }

    // Adiciona prova social para serviços não urgentes
    if (opportunity.urgency === 'low' || opportunity.urgency === 'medium') {
      if (Math.random() < 0.4) { // 40% das vezes
        const socialProof = [
          ' Outros tutores adoraram! 💕',
          ' Os pets saem super felizes daqui!',
          ' Todo mundo que fez amou o resultado!',
          ' É um dos nossos serviços mais procurados!'
        ];
        response += this.randomChoice(socialProof);
      }
    }

    return response;
  }

  /**
   * Detecta oportunidade de upsell (serviço adicional)
   */
  detectUpsellOpportunity(
    currentService: string,
    customerContext: any
  ): DetectedOpportunity | null {
    const upsellMap: Record<string, OpportunityPattern> = {
      'banho_tosa': {
        keywords: [],
        category: 'adicional',
        service: 'corte_unha',
        urgency: 'low',
        responseTemplate: 'Já que o {pet} vai estar aqui, que tal aproveitar e fazer as unhinhas também? Fica perfeito! 😊',
        pnlTechnique: 'pressuposicao'
      },
      'consulta': {
        keywords: [],
        category: 'prevenção',
        service: 'exames',
        urgency: 'medium',
        responseTemplate: 'Aproveitando a consulta, a veterinária pode pedir uns examinhos de rotina... Previne várias coisas!',
        pnlTechnique: 'autoridade'
      },
      'vacinacao': {
        keywords: [],
        category: 'prevenção',
        service: 'vermifugo',
        urgency: 'medium',
        responseTemplate: 'Enquanto estamos aqui, que tal fazer o vermífugo também? Protege ele de dentro pra fora! 💊',
        pnlTechnique: 'autoridade'
      }
    };

    const upsellPattern = upsellMap[currentService];
    if (!upsellPattern) return null;

    return {
      type: 'service',
      category: upsellPattern.category,
      service: upsellPattern.service,
      confidence: 0.8,
      urgency: upsellPattern.urgency,
      triggers: ['upsell'],
      suggestedResponse: upsellPattern.responseTemplate.replace(/{pet}/g, customerContext?.pets?.[0]?.name || 'seu pet'),
      pnlTechnique: upsellPattern.pnlTechnique
    };
  }

  /**
   * Escolhe item aleatório
   */
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}