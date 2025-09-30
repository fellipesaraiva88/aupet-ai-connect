import { proto } from '@whiskeysockets/baileys';

/**
 * Utilitários para Baileys
 */

/**
 * Formata número de telefone para JID do WhatsApp
 * @param phone Número de telefone (com ou sem código do país)
 * @returns JID formatado (número@s.whatsapp.net)
 */
export function formatPhoneToJID(phone: string): string {
  // Remove todos os caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');

  // Remove JID se já existir
  cleaned = cleaned.replace(/@.*/, '');

  // Adicionar código do Brasil (55) se não presente
  if (cleaned.length === 11 && cleaned.startsWith('11')) {
    // DDD 11 + 9 dígitos
    cleaned = '55' + cleaned;
  } else if (cleaned.length === 10) {
    // DDD + 8 dígitos (número antigo)
    cleaned = '5511' + cleaned;
  } else if (!cleaned.startsWith('55') && cleaned.length >= 10) {
    cleaned = '55' + cleaned;
  }

  // Adicionar sufixo do WhatsApp
  return cleaned + '@s.whatsapp.net';
}

/**
 * Formata JID para número de telefone legível
 * @param jid JID do WhatsApp
 * @returns Número formatado (+55 11 99999-9999)
 */
export function formatJIDToPhone(jid: string): string {
  const cleaned = jid.replace(/@.*/, '').replace(/\D/g, '');

  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    const number = cleaned.substring(2);
    const ddd = number.substring(0, 2);
    const firstPart = number.substring(2, 7);
    const secondPart = number.substring(7);
    return `+55 ${ddd} ${firstPart}-${secondPart}`;
  }

  return cleaned;
}

/**
 * Verifica se JID é de grupo
 * @param jid JID do WhatsApp
 * @returns true se for grupo
 */
export function isGroupJID(jid: string): boolean {
  return jid.endsWith('@g.us');
}

/**
 * Verifica se JID é de broadcast
 * @param jid JID do WhatsApp
 * @returns true se for broadcast
 */
export function isBroadcastJID(jid: string): boolean {
  return jid.endsWith('@broadcast');
}

/**
 * Extrai tipo de conteúdo da mensagem
 * @param message Mensagem do WhatsApp
 * @returns Tipo de conteúdo (text, image, video, etc)
 */
export function getMessageType(message: proto.IMessage | null | undefined): string | null {
  if (!message) return null;

  const types = [
    'conversation',
    'extendedTextMessage',
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'documentMessage',
    'stickerMessage',
    'locationMessage',
    'contactMessage',
    'contactsArrayMessage',
    'listMessage',
    'buttonsMessage',
    'templateMessage',
    'pollCreationMessage',
    'pollUpdateMessage'
  ];

  for (const type of types) {
    if (message[type as keyof proto.IMessage]) {
      return type;
    }
  }

  return null;
}

/**
 * Extrai texto de uma mensagem
 * @param message Mensagem do WhatsApp
 * @returns Texto da mensagem ou null
 */
export function getMessageText(message: proto.IMessage | null | undefined): string | null {
  if (!message) return null;

  if (message.conversation) {
    return message.conversation;
  }

  if (message.extendedTextMessage?.text) {
    return message.extendedTextMessage.text;
  }

  if (message.imageMessage?.caption) {
    return message.imageMessage.caption;
  }

  if (message.videoMessage?.caption) {
    return message.videoMessage.caption;
  }

  if (message.documentMessage?.caption) {
    return message.documentMessage.caption;
  }

  return null;
}

/**
 * Valida se JID está no formato correto
 * @param jid JID do WhatsApp
 * @returns true se válido
 */
export function isValidJID(jid: string): boolean {
  return /^\d+@(s\.whatsapp\.net|g\.us|broadcast)$/.test(jid);
}

/**
 * Delay assíncrono
 * @param ms Milissegundos para esperar
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Limita taxa de execução (debounce)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Retry com backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const delayMs = baseDelay * Math.pow(2, attempt - 1);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}