import { useMultiFileAuthState, AuthenticationState, SignalDataTypeMap } from '@whiskeysockets/baileys';
import { makeCacheableSignalKeyStore } from '@whiskeysockets/baileys/lib/Utils/make-cacheable-signal-store';
import path from 'path';
import { logger } from '../../utils/logger';
import fs from 'fs/promises';

/**
 * Gerencia autenticação e sessões do Baileys
 * Usa useMultiFileAuthState para persistência em arquivos
 */
export class AuthManager {
  private sessionsPath: string;

  constructor(sessionsPath?: string) {
    this.sessionsPath = sessionsPath || path.join(__dirname, '../../../auth_sessions');
    this.ensureSessionsDir();
  }

  private async ensureSessionsDir() {
    try {
      await fs.mkdir(this.sessionsPath, { recursive: true });
    } catch (error) {
      logger.error('Error creating sessions directory:', error);
    }
  }

  /**
   * Carrega ou cria estado de autenticação para um usuário
   */
  async getAuthState(userId: string): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
  }> {
    const sessionPath = path.join(this.sessionsPath, userId);

    try {
      // useMultiFileAuthState cria automaticamente a pasta se não existe
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

      // Otimizar auth store com cache (melhora performance)
      const cachedState = {
        ...state,
        keys: makeCacheableSignalKeyStore(state.keys, logger as any)
      };

      logger.info('Auth state loaded for user', { userId });
      return { state: cachedState, saveCreds };
    } catch (error) {
      logger.error('Error loading auth state:', error);
      throw error;
    }
  }

  /**
   * Limpa sessão de um usuário (logout)
   */
  async clearAuth(userId: string): Promise<void> {
    const sessionPath = path.join(this.sessionsPath, userId);

    try {
      await fs.rm(sessionPath, { recursive: true, force: true });
      logger.info('Auth cleared for user', { userId });
    } catch (error) {
      logger.error('Error clearing auth:', error);
      throw error;
    }
  }

  /**
   * Verifica se usuário tem sessão salva
   */
  async hasSession(userId: string): Promise<boolean> {
    const sessionPath = path.join(this.sessionsPath, userId, 'creds.json');

    try {
      await fs.access(sessionPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lista todos os usuários com sessões ativas
   */
  async listSessions(): Promise<string[]> {
    try {
      const dirs = await fs.readdir(this.sessionsPath);
      return dirs;
    } catch (error) {
      logger.error('Error listing sessions:', error);
      return [];
    }
  }
}