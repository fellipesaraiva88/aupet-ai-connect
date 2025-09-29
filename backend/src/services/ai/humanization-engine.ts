import { logger } from '../../utils/logger';

/**
 * Engine de Humanização - Faz IA parecer humana
 * Aplica variações, erros sutis, humor e naturalidade
 */

export interface HumanizationConfig {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  customerTone: 'formal' | 'informal' | 'neutral';
  useEmojis: boolean;
  errorProbability: number; // 0 a 1
  variationLevel: number; // 0 a 1
}

export class HumanizationEngine {
  /**
   * Humaniza uma mensagem completamente
   */
  humanize(message: string, config: Partial<HumanizationConfig> = {}): string {
    const fullConfig: HumanizationConfig = {
      timeOfDay: this.detectTimeOfDay(),
      customerTone: config.customerTone || 'informal',
      useEmojis: config.useEmojis !== undefined ? config.useEmojis : true,
      errorProbability: config.errorProbability || 0.05, // 5% de chance de "erro"
      variationLevel: config.variationLevel || 0.7
    };

    let humanized = message;

    // 1. Ajusta tom baseado no horário
    humanized = this.adjustByTimeOfDay(humanized, fullConfig.timeOfDay);

    // 2. Adiciona variações naturais
    humanized = this.addNaturalVariations(humanized, fullConfig.variationLevel);

    // 3. Espelha tom do cliente
    humanized = this.mirrorTone(humanized, fullConfig.customerTone);

    // 4. Adiciona emojis se apropriado
    if (fullConfig.useEmojis) {
      humanized = this.addContextualEmojis(humanized);
    }

    // 5. Adiciona "erros" humanos ocasionais
    if (Math.random() < fullConfig.errorProbability) {
      humanized = this.addHumanErrors(humanized);
    }

    logger.ai('HUMANIZATION_APPLIED', {
      originalLength: message.length,
      humanizedLength: humanized.length,
      timeOfDay: fullConfig.timeOfDay
    });

    return humanized;
  }

  /**
   * Detecta horário do dia
   */
  private detectTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Ajusta mensagem baseado no horário
   */
  private adjustByTimeOfDay(message: string, timeOfDay: string): string {
    const greetings: Record<string, string[]> = {
      morning: ['Bom dia!', 'Oi! Bom dia!', 'Bom diaa!', 'Oi, bom dia!'],
      afternoon: ['Boa tarde!', 'Oi! Boa tarde!', 'Boa tardee!', 'Oi, boa tarde!'],
      evening: ['Boa noite!', 'Oi! Boa noite!', 'Boa noitee!', 'Oi, boa noite!'],
      night: ['Oi!', 'Olá!', 'Oi, tudo bem?']
    };

    const energyLevels: Record<string, number> = {
      morning: 0.9, // Mais animada
      afternoon: 0.7, // Normal
      evening: 0.6, // Mais calma
      night: 0.5 // Bem calma
    };

    // Adiciona saudação contextual se começar com "Oi"
    if (message.startsWith('Oi!') || message.startsWith('Olá!')) {
      const greeting = this.randomChoice(greetings[timeOfDay]);
      message = message.replace(/^(Oi!|Olá!)/, greeting);
    }

    // Ajusta energia (quantidade de pontos de exclamação)
    const energy = energyLevels[timeOfDay];
    if (energy < 0.7 && message.includes('!!')) {
      message = message.replace(/!!/g, '!'); // Menos energia à noite
    }

    return message;
  }

  /**
   * Adiciona variações naturais
   */
  private addNaturalVariations(message: string, variationLevel: number): string {
    // Variações comuns em palavras
    const variations: Record<string, string[]> = {
      'Oi': ['Oi', 'Oii', 'Oi!', 'Olá'],
      'Olá': ['Olá', 'Oi', 'Oii'],
      'tudo bem': ['tudo bem', 'tudo certo', 'tudo bom', 'td bem'],
      'sim': ['sim', 'sim sim', 'com certeza', 'claro'],
      'não': ['não', 'não não', 'nãoo'],
      'obrigado': ['obrigado', 'obrigada', 'obg', 'valeu']
    };

    if (Math.random() < variationLevel) {
      Object.keys(variations).forEach(word => {
        if (message.includes(word)) {
          const variant = this.randomChoice(variations[word]);
          message = message.replace(word, variant);
        }
      });
    }

    return message;
  }

  /**
   * Espelha o tom do cliente
   */
  private mirrorTone(message: string, customerTone: string): string {
    switch (customerTone) {
      case 'formal':
        // Remove gírias e emojis excessivos
        message = message.replace(/haha|rsrs|kk/g, '');
        message = message.replace(/(😄|😂|🤣)/g, '😊');
        break;

      case 'informal':
        // Adiciona informalidade sutil
        if (Math.random() < 0.3) {
          message = message.replace('você', 'vc');
        }
        break;

      case 'neutral':
        // Mantém equilíbrio
        break;
    }

    return message;
  }

  /**
   * Adiciona emojis contextuais
   */
  private addContextualEmojis(message: string): string {
    // Não adiciona se já tem muitos emojis
    const emojiCount = (message.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount >= 3) return message;

    // Contextos e emojis apropriados
    const contextEmojis: Record<string, string[]> = {
      'pet|cachorro|cão': ['🐶', '🐕', '❤️'],
      'gato': ['🐱', '😻', '❤️'],
      'banho|tosa|limpeza': ['🛁', '✨', '💕'],
      'consulta|veterinária|saúde': ['🏥', '💉', '❤️'],
      'emergência|urgente|socorro': ['🚨', '⚠️'],
      'feliz|alegre|legal|bom': ['😊', '💕', '✨'],
      'triste|preocupado': ['😢', '💙'],
      'obrigado|valeu': ['💕', '❤️', '😊']
    };

    // Adiciona emoji contextual no final se apropriado
    for (const [context, emojis] of Object.entries(contextEmojis)) {
      if (new RegExp(context, 'i').test(message)) {
        if (!message.endsWith('!') && !message.endsWith('?')) {
          message += ` ${this.randomChoice(emojis)}`;
        }
        break;
      }
    }

    return message;
  }

  /**
   * Adiciona "erros" humanos sutis
   */
  private addHumanErrors(message: string): string {
    const errorTypes = [
      'forget_emoji',    // Esquece emoji no meio
      'typo_correction', // Corrige palavra
      'repeat_letter',   // Repete letra
      'add_pause'        // Adiciona pausa
    ];

    const errorType = this.randomChoice(errorTypes);

    switch (errorType) {
      case 'forget_emoji':
        // Remove emoji do meio (mas não do fim)
        const words = message.split(' ');
        if (words.length > 3) {
          for (let i = 1; i < words.length - 1; i++) {
            if (/[\u{1F300}-\u{1F9FF}]/gu.test(words[i])) {
              words[i] = words[i].replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
              break;
            }
          }
          message = words.join(' ');
        }
        break;

      case 'typo_correction':
        // Simula correção de digitação
        // Ex: "Vou verificar isso para voce... pra você*"
        const corrections = [
          { wrong: 'voce', correct: 'você' },
          { wrong: 'pra', correct: 'para' },
          { wrong: 'ta', correct: 'está' }
        ];

        const correction = this.randomChoice(corrections);
        if (message.includes(correction.correct)) {
          // Substitui uma ocorrência e depois "corrige"
          message = message.replace(correction.correct, correction.wrong);
          message += `... ${correction.correct}*`;
        }
        break;

      case 'repeat_letter':
        // Repete letra final de palavra curta
        const shortWords = message.match(/\b\w{2,4}\b/g);
        if (shortWords && shortWords.length > 0) {
          const word = this.randomChoice(shortWords);
          const repeated = word + word.charAt(word.length - 1);
          message = message.replace(word, repeated);
        }
        break;

      case 'add_pause':
        // Adiciona "..." no meio
        const midWords = message.split(' ');
        if (midWords.length > 4) {
          const pauseIndex = Math.floor(midWords.length / 2);
          midWords[pauseIndex] += '...';
          message = midWords.join(' ');
        }
        break;
    }

    return message;
  }

  /**
   * Detecta se cliente usa emojis
   */
  detectEmojiUsage(customerMessages: string[]): boolean {
    const totalEmojis = customerMessages.reduce((count, msg) => {
      return count + (msg.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    }, 0);

    return totalEmojis > 0;
  }

  /**
   * Detecta tom do cliente
   */
  detectCustomerTone(customerMessages: string[]): 'formal' | 'informal' | 'neutral' {
    const allText = customerMessages.join(' ').toLowerCase();

    // Indicadores de formalidade
    const formalIndicators = ['senhor', 'senhora', 'você', 'poderia', 'gostaria'];
    const informalIndicators = ['vc', 'oi', 'vlw', 'blz', 'tbm', 'td', 'kk', 'haha'];

    const formalCount = formalIndicators.filter(ind => allText.includes(ind)).length;
    const informalCount = informalIndicators.filter(ind => allText.includes(ind)).length;

    if (formalCount > informalCount) return 'formal';
    if (informalCount > formalCount) return 'informal';
    return 'neutral';
  }

  /**
   * Escolhe item aleatório de array
   */
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Quebra mensagem em fragmentos naturais
   */
  fragmentNaturally(message: string, maxChars: number = 100): string[] {
    // Se for curta, retorna inteira
    if (message.length <= maxChars) {
      return [message];
    }

    const fragments: string[] = [];

    // Quebra por pontuação forte primeiro
    const strongBreaks = message.split(/([.!?]\s+)/);

    let current = '';
    for (const part of strongBreaks) {
      if ((current + part).length <= maxChars) {
        current += part;
      } else {
        if (current.trim()) {
          fragments.push(current.trim());
        }
        current = part;
      }
    }

    if (current.trim()) {
      fragments.push(current.trim());
    }

    // Se ainda tem fragmentos muito longos, quebra por vírgulas
    return fragments.flatMap(frag => {
      if (frag.length <= maxChars) return [frag];

      const commaBreaks = frag.split(/(,\s+)/);
      const subFragments: string[] = [];
      let subCurrent = '';

      for (const part of commaBreaks) {
        if ((subCurrent + part).length <= maxChars) {
          subCurrent += part;
        } else {
          if (subCurrent.trim()) {
            subFragments.push(subCurrent.trim());
          }
          subCurrent = part;
        }
      }

      if (subCurrent.trim()) {
        subFragments.push(subCurrent.trim());
      }

      return subFragments;
    });
  }
}