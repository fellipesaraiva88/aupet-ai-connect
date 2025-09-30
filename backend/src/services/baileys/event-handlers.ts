import { BaileysEventMap, WASocket, proto } from '@whiskeysockets/baileys';
import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

/**
 * Gerencia eventos do Baileys e os converte em eventos customizados
 * Substitui os webhooks HTTP do Evolution API por event emitters nativos
 */
export class BaileysEventHandlers extends EventEmitter {

  /**
   * Configura todos os event listeners para um socket
   */
  setupHandlers(sock: WASocket, userId: string, saveCreds: () => Promise<void>) {
    // Conexão
    sock.ev.on('connection.update', (update) => {
      this.handleConnectionUpdate(userId, update);
    });

    // Mensagens recebidas
    sock.ev.on('messages.upsert', (msg) => {
      this.handleMessagesUpsert(userId, msg);
    });

    // Mensagens atualizadas (status, edição, etc)
    sock.ev.on('messages.update', (updates) => {
      this.handleMessagesUpdate(userId, updates);
    });

    // Mensagens deletadas
    sock.ev.on('messages.delete', (deletion) => {
      this.handleMessagesDelete(userId, deletion);
    });

    // Chats (conversas)
    sock.ev.on('chats.upsert', (chats) => {
      this.emit('chats:upsert', { userId, chats });
    });

    sock.ev.on('chats.update', (updates) => {
      this.emit('chats:update', { userId, updates });
    });

    sock.ev.on('chats.delete', (deletions) => {
      this.emit('chats:delete', { userId, deletions });
    });

    // Contatos
    sock.ev.on('contacts.upsert', (contacts) => {
      this.emit('contacts:upsert', { userId, contacts });
    });

    sock.ev.on('contacts.update', (updates) => {
      this.emit('contacts:update', { userId, updates });
    });

    // Presença (digitando, online, etc)
    sock.ev.on('presence.update', (presence) => {
      this.emit('presence:update', { userId, presence });
    });

    // Grupos
    sock.ev.on('groups.update', (updates) => {
      this.emit('groups:update', { userId, updates });
    });

    sock.ev.on('group-participants.update', (update) => {
      this.emit('group-participants:update', { userId, update });
    });

    // Credenciais (IMPORTANTE: salvar quando atualizar)
    sock.ev.on('creds.update', saveCreds);

    logger.info('Event handlers setup completed', { userId });
  }

  private handleConnectionUpdate(userId: string, update: Partial<BaileysEventMap['connection.update']>) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // QR Code gerado
      this.emit('qr:updated', { userId, qr });
      logger.info('QR code generated', { userId });
    }

    if (connection) {
      this.emit('connection:update', { userId, connection, lastDisconnect });
      logger.info('Connection update', { userId, connection });
    }
  }

  private handleMessagesUpsert(userId: string, msg: BaileysEventMap['messages.upsert']) {
    const { messages, type } = msg;

    // Filtrar mensagens próprias (de protocolo)
    const userMessages = messages.filter(m => !m.key.fromMe && m.message);

    if (userMessages.length > 0) {
      this.emit('message:upsert', { userId, messages: userMessages, type });
      logger.info('New messages received', { userId, count: userMessages.length });
    }
  }

  private handleMessagesUpdate(userId: string, updates: BaileysEventMap['messages.update']) {
    // Processar atualizações de mensagens (lidas, entregues, etc)
    updates.forEach(update => {
      if (update.update.status) {
        this.emit('message:status', {
          userId,
          key: update.key,
          status: update.update.status
        });
      }

      // Poll updates (votações)
      if (update.update.pollUpdates) {
        this.emit('poll:update', {
          userId,
          key: update.key,
          pollUpdates: update.update.pollUpdates
        });
      }
    });
  }

  private handleMessagesDelete(userId: string, deletion: BaileysEventMap['messages.delete']) {
    this.emit('message:delete', { userId, deletion });
    logger.info('Messages deleted', { userId, keys: deletion.keys.length });
  }
}