import { EvolutionAPIService } from './evolution';
import { logger } from '../utils/logger';

export interface MessageToSend {
  instanceName: string;
  phoneNumber: string;
  content: string;
  delay?: number; // em segundos
}

export class MessageSender {
  private evolutionService: EvolutionAPIService;

  constructor() {
    this.evolutionService = new EvolutionAPIService();
  }

  /**
   * Envia uma mensagem de texto simples
   */
  async sendTextMessage(
    instanceName: string,
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      logger.info('Sending text message', {
        instanceName,
        phoneNumber,
        messageLength: message.length
      });

      // Envia via Evolution API (sendText já formata o número internamente)
      const response = await this.evolutionService.sendText(
        instanceName,
        phoneNumber,
        message
      );

      if (response && response.key) {
        logger.info('Message sent successfully', {
          messageId: response.key.id,
          instanceName
        });

        return {
          success: true,
          messageId: response.key.id
        };
      }

      return {
        success: false,
        error: 'No response from Evolution API'
      };

    } catch (error: any) {
      logger.error('Error sending text message:', error);
      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Envia mensagem com indicador de "digitando..."
   */
  async sendWithTypingIndicator(
    instanceName: string,
    phoneNumber: string,
    message: string,
    typingDuration: number = 2000 // ms
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      // Envia presença de digitando
      await this.evolutionService.setPresence(instanceName, phoneNumber, 'composing');

      // Aguarda um tempo simulando digitação
      await this.sleep(typingDuration);

      // Volta presença para disponível
      await this.evolutionService.setPresence(instanceName, phoneNumber, 'available');

      // Envia a mensagem
      return await this.sendTextMessage(instanceName, phoneNumber, message);

    } catch (error) {
      logger.error('Error sending with typing indicator:', error);
      // Tenta enviar sem o typing indicator
      return await this.sendTextMessage(instanceName, phoneNumber, message);
    }
  }

  /**
   * Envia múltiplas mensagens com delays entre elas (fragmentação humanizada)
   */
  async sendFragmentedMessages(
    instanceName: string,
    phoneNumber: string,
    messages: string[],
    delayBetween: number = 2000 // ms entre mensagens
  ): Promise<{ success: boolean; messageIds: string[] }> {
    const messageIds: string[] = [];

    try {
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];

        // Calcula delay baseado no tamanho da mensagem (mais natural)
        const typingTime = this.calculateTypingTime(message);

        // Envia com indicador de digitando
        const result = await this.sendWithTypingIndicator(
          instanceName,
          phoneNumber,
          message,
          typingTime
        );

        if (result.success && result.messageId) {
          messageIds.push(result.messageId);
        }

        // Aguarda entre mensagens (exceto na última)
        if (i < messages.length - 1) {
          await this.sleep(delayBetween);
        }
      }

      return {
        success: messageIds.length > 0,
        messageIds
      };

    } catch (error) {
      logger.error('Error sending fragmented messages:', error);
      return {
        success: false,
        messageIds
      };
    }
  }

  /**
   * Calcula tempo de "digitação" baseado no tamanho da mensagem
   * Simula velocidade humana de digitação (40-60 caracteres por segundo)
   */
  private calculateTypingTime(message: string): number {
    const charsPerSecond = 45 + Math.random() * 15; // 45-60 chars/sec
    const baseTime = (message.length / charsPerSecond) * 1000;

    // Mínimo 1s, máximo 5s
    return Math.min(Math.max(baseTime, 1000), 5000);
  }

  /**
   * Fragmenta mensagem longa em partes naturais
   */
  fragmentMessage(message: string, maxCharsPerFragment: number = 100): string[] {
    if (message.length <= maxCharsPerFragment) {
      return [message];
    }

    const fragments: string[] = [];
    const sentences = message.split(/([.!?]\s+)/);
    let currentFragment = '';

    for (const sentence of sentences) {
      if ((currentFragment + sentence).length <= maxCharsPerFragment) {
        currentFragment += sentence;
      } else {
        if (currentFragment.trim()) {
          fragments.push(currentFragment.trim());
        }
        currentFragment = sentence;
      }
    }

    if (currentFragment.trim()) {
      fragments.push(currentFragment.trim());
    }

    return fragments.length > 0 ? fragments : [message];
  }

  /**
   * Aguarda um tempo em ms
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Envia mensagem com retry automático
   */
  async sendWithRetry(
    instanceName: string,
    phoneNumber: string,
    message: string,
    maxRetries: number = 3
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let lastError = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.sendTextMessage(instanceName, phoneNumber, message);

      if (result.success) {
        return result;
      }

      lastError = result.error || 'Unknown error';

      if (attempt < maxRetries) {
        // Aguarda antes de tentar novamente (backoff exponencial)
        await this.sleep(1000 * Math.pow(2, attempt));
        logger.warn(`Retrying message send (attempt ${attempt + 1}/${maxRetries})`);
      }
    }

    return {
      success: false,
      error: `Failed after ${maxRetries} attempts: ${lastError}`
    };
  }
}