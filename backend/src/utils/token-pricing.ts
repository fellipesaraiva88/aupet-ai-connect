/**
 * Token Pricing Calculator
 * Calcula custos estimados baseado no modelo e número de tokens
 *
 * Preços são baseados na API OpenAI (valores podem mudar)
 * Última atualização: Janeiro 2025
 */

export interface TokenUsage {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface TokenPricing {
  model: string;
  input_cost_per_1k: number;  // USD per 1K input tokens
  output_cost_per_1k: number; // USD per 1K output tokens
}

/**
 * Preços por modelo (USD por 1000 tokens)
 * Fonte: https://openai.com/pricing
 */
const MODEL_PRICING: Record<string, TokenPricing> = {
  // GPT-4 Turbo
  'gpt-4-turbo': {
    model: 'gpt-4-turbo',
    input_cost_per_1k: 0.01,
    output_cost_per_1k: 0.03
  },
  'gpt-4-turbo-preview': {
    model: 'gpt-4-turbo-preview',
    input_cost_per_1k: 0.01,
    output_cost_per_1k: 0.03
  },
  'gpt-4-1106-preview': {
    model: 'gpt-4-1106-preview',
    input_cost_per_1k: 0.01,
    output_cost_per_1k: 0.03
  },

  // GPT-4
  'gpt-4': {
    model: 'gpt-4',
    input_cost_per_1k: 0.03,
    output_cost_per_1k: 0.06
  },
  'gpt-4-0613': {
    model: 'gpt-4-0613',
    input_cost_per_1k: 0.03,
    output_cost_per_1k: 0.06
  },
  'gpt-4-32k': {
    model: 'gpt-4-32k',
    input_cost_per_1k: 0.06,
    output_cost_per_1k: 0.12
  },

  // GPT-3.5 Turbo
  'gpt-3.5-turbo': {
    model: 'gpt-3.5-turbo',
    input_cost_per_1k: 0.0005,
    output_cost_per_1k: 0.0015
  },
  'gpt-3.5-turbo-0125': {
    model: 'gpt-3.5-turbo-0125',
    input_cost_per_1k: 0.0005,
    output_cost_per_1k: 0.0015
  },
  'gpt-3.5-turbo-1106': {
    model: 'gpt-3.5-turbo-1106',
    input_cost_per_1k: 0.001,
    output_cost_per_1k: 0.002
  },
  'gpt-3.5-turbo-16k': {
    model: 'gpt-3.5-turbo-16k',
    input_cost_per_1k: 0.003,
    output_cost_per_1k: 0.004
  },

  // Text Embedding Models
  'text-embedding-3-small': {
    model: 'text-embedding-3-small',
    input_cost_per_1k: 0.00002,
    output_cost_per_1k: 0
  },
  'text-embedding-3-large': {
    model: 'text-embedding-3-large',
    input_cost_per_1k: 0.00013,
    output_cost_per_1k: 0
  },
  'text-embedding-ada-002': {
    model: 'text-embedding-ada-002',
    input_cost_per_1k: 0.0001,
    output_cost_per_1k: 0
  }
};

/**
 * Calcula o custo estimado em USD baseado no uso de tokens
 */
export function calculateTokenCost(usage: TokenUsage): number {
  const pricing = MODEL_PRICING[usage.model] || MODEL_PRICING['gpt-3.5-turbo']; // Default fallback

  const inputCost = (usage.prompt_tokens / 1000) * pricing.input_cost_per_1k;
  const outputCost = (usage.completion_tokens / 1000) * pricing.output_cost_per_1k;

  return inputCost + outputCost;
}

/**
 * Formata o custo para exibição (USD)
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(6)}`;
}

/**
 * Converte custo em USD para BRL (taxa aproximada)
 */
export function convertToBRL(costUSD: number, exchangeRate: number = 5.0): number {
  return costUSD * exchangeRate;
}

/**
 * Calcula custo total de múltiplos usos
 */
export function calculateTotalCost(usages: TokenUsage[]): number {
  return usages.reduce((total, usage) => total + calculateTokenCost(usage), 0);
}

/**
 * Estima tokens baseado no comprimento do texto
 * (aproximação: 1 token ≈ 4 caracteres em inglês, 2-3 em português)
 */
export function estimateTokens(text: string, language: 'en' | 'pt' = 'pt'): number {
  const charsPerToken = language === 'en' ? 4 : 2.5;
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Verifica se o modelo está disponível na lista de preços
 */
export function isSupportedModel(model: string): boolean {
  return model in MODEL_PRICING;
}

/**
 * Obtém informações de preço de um modelo
 */
export function getModelPricing(model: string): TokenPricing | null {
  return MODEL_PRICING[model] || null;
}

/**
 * Lista todos os modelos suportados
 */
export function getSupportedModels(): string[] {
  return Object.keys(MODEL_PRICING);
}

/**
 * Calcula estatísticas de uso
 */
export interface UsageStatistics {
  total_requests: number;
  total_tokens: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_cost_usd: number;
  average_tokens_per_request: number;
  average_cost_per_request: number;
}

export function calculateUsageStatistics(usages: TokenUsage[]): UsageStatistics {
  const totalTokens = usages.reduce((sum, u) => sum + u.total_tokens, 0);
  const totalPromptTokens = usages.reduce((sum, u) => sum + u.prompt_tokens, 0);
  const totalCompletionTokens = usages.reduce((sum, u) => sum + u.completion_tokens, 0);
  const totalCost = calculateTotalCost(usages);

  return {
    total_requests: usages.length,
    total_tokens: totalTokens,
    total_prompt_tokens: totalPromptTokens,
    total_completion_tokens: totalCompletionTokens,
    total_cost_usd: totalCost,
    average_tokens_per_request: usages.length > 0 ? totalTokens / usages.length : 0,
    average_cost_per_request: usages.length > 0 ? totalCost / usages.length : 0
  };
}

export default {
  calculateTokenCost,
  formatCost,
  convertToBRL,
  calculateTotalCost,
  estimateTokens,
  isSupportedModel,
  getModelPricing,
  getSupportedModels,
  calculateUsageStatistics
};