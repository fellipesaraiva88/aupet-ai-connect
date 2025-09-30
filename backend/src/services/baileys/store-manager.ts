import { makeInMemoryStore, WASocket } from '@whiskeysockets/baileys';
import path from 'path';
import { logger } from '../../utils/logger';
import fs from 'fs/promises';

/**
 * Gerencia store in-memory do Baileys para mensagens, chats e contatos
 * Persiste dados em arquivo para não perder histórico entre restarts
 */
export class StoreManager {
  private stores: Map<string, ReturnType<typeof makeInMemoryStore>>;
  private storePath: string;
  private saveInterval: NodeJS.Timeout | null = null;

  constructor(storePath?: string) {
    this.stores = new Map();
    this.storePath = storePath || path.join(__dirname, '../../../auth_sessions/stores');
    this.ensureStoreDir();
    this.startAutoSave();
  }

  private async ensureStoreDir() {
    try {
      await fs.mkdir(this.storePath, { recursive: true });
    } catch (error) {
      logger.error('Error creating store directory:', error);
    }
  }

  /**
   * Cria ou retorna store para um usuário
   */
  getStore(userId: string): ReturnType<typeof makeInMemoryStore> {
    if (this.stores.has(userId)) {
      return this.stores.get(userId)!;
    }

    // Criar novo store
    const store = makeInMemoryStore({
      logger: logger as any
    });

    // Tentar carregar dados salvos
    const storeFile = path.join(this.storePath, `${userId}.json`);
    try {
      store.readFromFile(storeFile);
      logger.info('Store loaded from file', { userId });
    } catch (error) {
      // Arquivo não existe ainda, normal na primeira vez
      logger.debug('No previous store file', { userId });
    }

    this.stores.set(userId, store);
    return store;
  }

  /**
   * Bind store ao socket do usuário
   */
  bindStore(userId: string, sock: WASocket) {
    const store = this.getStore(userId);
    store.bind(sock.ev);
    logger.info('Store bound to socket', { userId });
  }

  /**
   * Salva store de um usuário em arquivo
   */
  async saveStore(userId: string): Promise<void> {
    const store = this.stores.get(userId);
    if (!store) return;

    const storeFile = path.join(this.storePath, `${userId}.json`);

    try {
      store.writeToFile(storeFile);
      logger.debug('Store saved to file', { userId });
    } catch (error) {
      logger.error('Error saving store:', error);
    }
  }

  /**
   * Salva todos os stores
   */
  async saveAllStores(): Promise<void> {
    const promises = Array.from(this.stores.keys()).map(userId =>
      this.saveStore(userId)
    );
    await Promise.all(promises);
  }

  /**
   * Auto-save periódico (a cada 10 segundos)
   */
  private startAutoSave() {
    // Salvar a cada 10 segundos
    this.saveInterval = setInterval(async () => {
      await this.saveAllStores();
    }, 10000);

    logger.info('Store auto-save started (10s interval)');
  }

  /**
   * Para auto-save
   */
  stopAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
      logger.info('Store auto-save stopped');
    }
  }

  /**
   * Remove store de um usuário
   */
  async removeStore(userId: string): Promise<void> {
    this.stores.delete(userId);

    const storeFile = path.join(this.storePath, `${userId}.json`);
    try {
      await fs.unlink(storeFile);
      logger.info('Store removed', { userId });
    } catch (error) {
      logger.debug('Store file not found', { userId });
    }
  }

  /**
   * Retorna mensagens de um chat
   */
  getMessages(userId: string, jid: string, limit: number = 50) {
    const store = this.stores.get(userId);
    if (!store) return [];

    try {
      return store.loadMessages(jid, limit);
    } catch (error) {
      logger.error('Error loading messages from store:', error);
      return [];
    }
  }

  /**
   * Retorna todos os chats
   */
  getChats(userId: string) {
    const store = this.stores.get(userId);
    if (!store) return [];

    return store.chats.all();
  }

  /**
   * Retorna todos os contatos
   */
  getContacts(userId: string) {
    const store = this.stores.get(userId);
    if (!store) return {};

    return store.contacts;
  }
}