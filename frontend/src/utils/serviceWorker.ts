// Service Worker Registration and Management
// Auzap AI Connect - Cache Optimization

const SW_URL = '/sw.js';
const SW_SCOPE = '/';

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  registration?: ServiceWorkerRegistration;
}

export interface CacheStatus {
  [cacheName: string]: number;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  /**
   * Registra o Service Worker
   */
  async register(): Promise<ServiceWorkerStatus> {
    const status: ServiceWorkerStatus = {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: false,
      isActive: false
    };

    if (!status.isSupported) {
      console.warn('[SW Manager] Service Workers não são suportados neste navegador');
      return status;
    }

    try {
      // Registra o service worker
      this.registration = await navigator.serviceWorker.register(SW_URL, {
        scope: SW_SCOPE,
        updateViaCache: 'none' // Sempre verifica atualizações
      });

      status.isRegistered = true;
      status.registration = this.registration;

      console.log('[SW Manager] Service Worker registrado com sucesso:', this.registration.scope);

      // Configura event listeners
      this.setupEventListeners();

      // Verifica se está ativo
      if (this.registration.active) {
        status.isActive = true;
        console.log('[SW Manager] Service Worker está ativo');
      }

      // Verifica atualizações
      await this.checkForUpdates();

      return status;
    } catch (error) {
      console.error('[SW Manager] Falha ao registrar Service Worker:', error);
      return status;
    }
  }

  /**
   * Configura event listeners do Service Worker
   */
  private setupEventListeners(): void {
    if (!this.registration) return;

    // Listener para quando uma nova versão está instalando
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (!newWorker) return;

      console.log('[SW Manager] Nova versão do Service Worker encontrada');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nova versão disponível
          this.updateAvailable = true;
          console.log('[SW Manager] Nova versão pronta para ativação');
          this.notifyUpdateAvailable();
        }
      });
    });

    // Listener para mudanças no controller
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW Manager] Service Worker controller mudou');
      if (this.updateAvailable) {
        // Página será recarregada automaticamente
        window.location.reload();
      }
    });

    // Listener para mensagens do Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });
  }

  /**
   * Verifica por atualizações do Service Worker
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('[SW Manager] Verificação de atualização concluída');
    } catch (error) {
      console.error('[SW Manager] Erro ao verificar atualizações:', error);
    }
  }

  /**
   * Força ativação da nova versão
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) return;

    // Envia mensagem para o service worker
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Limpa todos os caches
   */
  async clearCaches(): Promise<void> {
    if (!navigator.serviceWorker.controller) return;

    const messageChannel = new MessageChannel();

    return new Promise((resolve) => {
      messageChannel.port1.onmessage = () => {
        console.log('[SW Manager] Caches limpos');
        resolve();
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CACHE_CLEAR' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Obtém status dos caches
   */
  async getCacheStatus(): Promise<CacheStatus> {
    if (!navigator.serviceWorker.controller) return {};

    const messageChannel = new MessageChannel();

    return new Promise((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CACHE_STATUS' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Manipula mensagens do Service Worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event;

    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('[SW Manager] Cache atualizado:', data.url);
        break;
      case 'OFFLINE_READY':
        console.log('[SW Manager] Aplicação pronta para uso offline');
        break;
      default:
        console.log('[SW Manager] Mensagem recebida:', data);
    }
  }

  /**
   * Notifica usuário sobre atualização disponível
   */
  private notifyUpdateAvailable(): void {
    // Dispara evento customizado
    const event = new CustomEvent('sw-update-available', {
      detail: { registration: this.registration }
    });
    window.dispatchEvent(event);

    // Log para desenvolvimento
    console.log('[SW Manager] 🔄 Nova versão disponível! Atualize a página para aplicar.');
  }

  /**
   * Desregistra o Service Worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      console.log('[SW Manager] Service Worker desregistrado:', result);
      return result;
    } catch (error) {
      console.error('[SW Manager] Erro ao desregistrar Service Worker:', error);
      return false;
    }
  }

  /**
   * Obtém status atual do Service Worker
   */
  getStatus(): ServiceWorkerStatus {
    return {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: !!this.registration,
      isActive: !!this.registration?.active,
      registration: this.registration || undefined
    };
  }
}

// Instância global do manager
export const swManager = new ServiceWorkerManager();

/**
 * Funções utilitárias para usar Service Worker
 */
export const serviceWorkerUtils = {
  getStatus: () => swManager.getStatus(),
  checkForUpdates: () => swManager.checkForUpdates(),
  skipWaiting: () => swManager.skipWaiting(),
  clearCaches: () => swManager.clearCaches(),
  getCacheStatus: () => swManager.getCacheStatus(),
  unregister: () => swManager.unregister()
};

/**
 * Registra Service Worker (para uso em main.tsx)
 */
export async function registerServiceWorker(): Promise<ServiceWorkerStatus> {
  // Aguarda o DOM estar pronto
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }

  return swManager.register();
}

// Export da classe para uso avançado
export { ServiceWorkerManager };