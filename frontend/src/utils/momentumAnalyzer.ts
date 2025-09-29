import { MomentumData } from "@/components/momentum/MomentumCard";

// Conversation interface matching our existing data structure
interface ConversationData {
  id: string;
  customerName: string;
  customerPhone: string;
  petName?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isAIHandled: boolean;
  status: string;
  contact_id: string;
  updated_at: string;
}

// Keywords that indicate purchase intent by momentum level
const HOT_KEYWORDS = [
  'preço', 'quanto custa', 'valor', 'orçamento', 'pagar', 'comprar',
  'agendar', 'hoje', 'urgente', 'preciso', 'emergência', 'agora',
  'disponível', 'vaga', 'horário', 'consulta', 'atendimento'
];

const WARM_KEYWORDS = [
  'informação', 'como funciona', 'gostaria', 'interesse', 'possível',
  'dúvida', 'pergunta', 'serviço', 'tratamento', 'cuidado',
  'prevenção', 'vacina', 'consulta', 'exame', 'check-up'
];

const COLD_KEYWORDS = [
  'olá', 'oi', 'bom dia', 'boa tarde', 'primeira vez', 'conhecer',
  'recomendar', 'indicar', 'ajuda', 'dica', 'orientação'
];

// Urgency indicators
const URGENCY_INDICATORS = [
  'urgente', 'emergência', 'grave', 'preocupado', 'doente',
  'machucado', 'sangue', 'dor', 'gemendo', 'não come',
  'vomitando', 'diarreia', 'febre', 'hoje', 'agora', 'rápido'
];

// Time-based scoring factors
const TIME_FACTORS = {
  lastHour: 1.0,
  last3Hours: 0.9,
  last6Hours: 0.8,
  lastDay: 0.7,
  lastWeek: 0.5,
  lastMonth: 0.3,
  older: 0.1
};

/**
 * Calculate momentum score based on message content, timing, and patterns
 */
export function calculateMomentumScore(conversation: ConversationData): {
  momentum: 'hot' | 'warm' | 'cold';
  score: number;
  triggers: string[];
} {
  const message = conversation.lastMessage.toLowerCase();
  const triggers: string[] = [];
  let score = 0;

  // Base score from keyword matching
  let hotMatches = 0;
  let warmMatches = 0;
  let coldMatches = 0;

  HOT_KEYWORDS.forEach(keyword => {
    if (message.includes(keyword)) {
      hotMatches++;
      triggers.push(`Interesse imediato: "${keyword}"`);
    }
  });

  WARM_KEYWORDS.forEach(keyword => {
    if (message.includes(keyword)) {
      warmMatches++;
      triggers.push(`Demonstra interesse: "${keyword}"`);
    }
  });

  COLD_KEYWORDS.forEach(keyword => {
    if (message.includes(keyword)) {
      coldMatches++;
      triggers.push(`Primeiro contato: "${keyword}"`);
    }
  });

  // Calculate time factor
  const lastInteraction = new Date(conversation.updated_at);
  const now = new Date();
  const timeDiff = now.getTime() - lastInteraction.getTime();
  const hoursAgo = timeDiff / (1000 * 60 * 60);

  let timeFactor = TIME_FACTORS.older;
  if (hoursAgo < 1) timeFactor = TIME_FACTORS.lastHour;
  else if (hoursAgo < 3) timeFactor = TIME_FACTORS.last3Hours;
  else if (hoursAgo < 6) timeFactor = TIME_FACTORS.last6Hours;
  else if (hoursAgo < 24) timeFactor = TIME_FACTORS.lastDay;
  else if (hoursAgo < 168) timeFactor = TIME_FACTORS.lastWeek;
  else if (hoursAgo < 720) timeFactor = TIME_FACTORS.lastMonth;

  // Urgency boost
  let urgencyBoost = 1;
  URGENCY_INDICATORS.forEach(indicator => {
    if (message.includes(indicator)) {
      urgencyBoost = 1.5;
      triggers.push(`🚨 Urgência detectada: "${indicator}"`);
    }
  });

  // Unread messages boost (engagement)
  const unreadBoost = Math.min(conversation.unread * 0.1, 0.5);

  // Calculate base score
  if (hotMatches > 0) {
    score = 60 + (hotMatches * 10);
    triggers.push(`${hotMatches} indicadores de compra detectados`);
  } else if (warmMatches > 0) {
    score = 30 + (warmMatches * 8);
    triggers.push(`${warmMatches} indicadores de interesse detectados`);
  } else if (coldMatches > 0) {
    score = 10 + (coldMatches * 5);
  } else {
    score = 5; // Default minimum score
  }

  // Apply modifiers
  score = score * timeFactor * urgencyBoost + (unreadBoost * 100);

  // Ensure score is within bounds
  score = Math.min(Math.max(score, 0), 100);

  // Add time-based triggers
  if (hoursAgo < 1) {
    triggers.push('⚡ Interação muito recente');
  } else if (hoursAgo < 6) {
    triggers.push('🕐 Interação recente');
  } else if (hoursAgo > 168) {
    triggers.push('📅 Precisa reativar relacionamento');
  }

  // Add engagement triggers
  if (conversation.unread > 2) {
    triggers.push(`📱 ${conversation.unread} mensagens não lidas`);
  }

  if (conversation.isAIHandled) {
    triggers.push('🤖 Atendido pela IA');
  }

  // Determine momentum category
  let momentum: 'hot' | 'warm' | 'cold';
  if (score >= 60) {
    momentum = 'hot';
  } else if (score >= 30) {
    momentum = 'warm';
  } else {
    momentum = 'cold';
  }

  return { momentum, score: Math.round(score), triggers };
}

/**
 * Generate next action suggestion based on momentum
 */
export function getNextActionSuggestion(momentum: 'hot' | 'warm' | 'cold', triggers: string[]) {
  const hasUrgency = triggers.some(trigger => trigger.includes('🚨'));
  const hasRecent = triggers.some(trigger => trigger.includes('⚡'));
  const isAIHandled = triggers.some(trigger => trigger.includes('🤖'));

  switch (momentum) {
    case 'hot':
      if (hasUrgency) {
        return {
          type: 'emergency_contact',
          label: 'Contatar imediatamente - Emergência detectada',
          priority: 10
        };
      }
      if (hasRecent) {
        return {
          type: 'close_sale',
          label: 'Finalizar venda enquanto o interesse está alto',
          priority: 9
        };
      }
      return {
        type: 'send_quote',
        label: 'Enviar orçamento personalizado',
        priority: 8
      };

    case 'warm':
      if (isAIHandled) {
        return {
          type: 'human_takeover',
          label: 'Assumir conversa da IA para nutrir relacionamento',
          priority: 6
        };
      }
      return {
        type: 'nurture',
        label: 'Nutrir relacionamento com conteúdo relevante',
        priority: 5
      };

    case 'cold':
      if (hasRecent) {
        return {
          type: 'warm_greeting',
          label: 'Responder com saudação calorosa',
          priority: 4
        };
      }
      return {
        type: 'reactivate',
        label: 'Reativar relacionamento com dica ou promoção',
        priority: 3
      };

    default:
      return {
        type: 'general_follow_up',
        label: 'Acompanhamento geral',
        priority: 1
      };
  }
}

/**
 * Transform conversation data to momentum data
 */
export function transformToMomentumData(conversations: ConversationData[]): MomentumData[] {
  return conversations.map(conversation => {
    const { momentum, score, triggers } = calculateMomentumScore(conversation);
    const nextAction = getNextActionSuggestion(momentum, triggers);

    // Calculate potential value based on momentum and patterns
    let potentialValue = 150; // Base consultation value
    
    if (momentum === 'hot') {
      potentialValue *= 3; // Higher potential for hot leads
    } else if (momentum === 'warm') {
      potentialValue *= 1.5;
    }

    // Add random variation for demonstration
    potentialValue += Math.random() * 200 - 100;
    potentialValue = Math.max(potentialValue, 50);

    // Determine urgency level
    let urgencyLevel: 'high' | 'medium' | 'low' = 'low';
    if (triggers.some(t => t.includes('🚨'))) {
      urgencyLevel = 'high';
    } else if (momentum === 'hot' || triggers.some(t => t.includes('⚡'))) {
      urgencyLevel = 'medium';
    }

    return {
      id: conversation.id,
      customerName: conversation.customerName,
      customerPhone: conversation.customerPhone,
      petName: conversation.petName,
      petSpecies: 'Não informado', // Could be extracted from conversation context
      lastMessage: conversation.lastMessage,
      timestamp: conversation.timestamp,
      momentum,
      score,
      triggers,
      lastInteraction: formatLastInteraction(conversation.updated_at),
      potentialValue,
      urgencyLevel,
      nextAction
    };
  });
}

/**
 * Format last interaction time in a human-readable way
 */
function formatLastInteraction(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 1) {
    const minutes = Math.floor(diffMs / (1000 * 60));
    return `${minutes}min atrás`;
  } else if (diffHours < 24) {
    return `${Math.floor(diffHours)}h atrás`;
  } else if (diffDays < 7) {
    return `${Math.floor(diffDays)}d atrás`;
  } else {
    return date.toLocaleDateString('pt-BR');
  }
}