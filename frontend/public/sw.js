// Service Worker otimizado para cache - Auzap AI Connect
// Injeção do manifesto Workbox
self.__WB_MANIFEST
const CACHE_NAME = 'auzap-ai-connect-v1';
const STATIC_CACHE_NAME = 'auzap-static-v1';
const DYNAMIC_CACHE_NAME = 'auzap-dynamic-v1';
const API_CACHE_NAME = 'auzap-api-v1';

// Recursos para cache imediato (Critical Resources)
const CRITICAL_CACHE = [
  '/',
  '/index.html',
  '/offline.html', // Página offline
  '/manifest.json'
];

// Recursos estáticos para cache
const STATIC_RESOURCES = [
  // Assets JS/CSS serão adicionados dinamicamente após o build
  '/assets/',
  // Fonts
  '/assets/fonts/',
  // Images
  '/assets/images/',
  '/placeholder.svg',
  '/favicon.ico'
];

// URLs da API para cache estratégico
const API_URLS = [
  '/api/health',
  '/api/user/profile'
];

// Estratégias de cache
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Configuração de TTL para diferentes tipos de recursos
const CACHE_TTL = {
  STATIC: 365 * 24 * 60 * 60 * 1000, // 1 ano
  DYNAMIC: 7 * 24 * 60 * 60 * 1000,  // 1 semana
  API: 5 * 60 * 1000,                 // 5 minutos
  IMAGES: 30 * 24 * 60 * 60 * 1000    // 30 dias
};

// Event: Install
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    Promise.all([
      // Cache crítico
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching critical resources');
        return cache.addAll(CRITICAL_CACHE);
      }),
      // Cache estático
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_RESOURCES.filter(url => !url.endsWith('/')));
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      self.skipWaiting(); // Ativa imediatamente
    }).catch(err => {
      console.error('[SW] Installation failed:', err);
    })
  );
});

// Event: Activate
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Remove caches antigos
          if (cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== API_CACHE_NAME) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim(); // Controla todas as páginas imediatamente
    })
  );
});

// Event: Fetch
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignora requests não HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Determina a estratégia de cache baseada no tipo de recurso
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isImageAsset(url.pathname)) {
    event.respondWith(handleImageAsset(request));
  } else {
    event.respondWith(handleDocumentRequest(request));
  }
});

// Estratégia: API Requests (Network First com cache de fallback)
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);

  try {
    // Tenta network primeiro
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache apenas responses bem-sucedidas
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);

      // Adiciona header de cache timestamp
      const response = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cache-timestamp': Date.now().toString()
        }
      });

      return response;
    }

    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);

    // Fallback para cache
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Verifica TTL
      const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
      if (cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < CACHE_TTL.API) {
        return cachedResponse;
      }
    }

    // Se não há cache válido, retorna erro offline
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Recurso não disponível offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Estratégia: Static Assets (Cache First)
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);

  // Tenta cache primeiro
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Se não está em cache, busca na network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Estratégia: Images (Stale While Revalidate)
async function handleImageAsset(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);

  // Retorna cache imediatamente se disponível
  const cachedResponse = await cache.match(request);

  // Busca nova versão em background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Ignora erros de network para imagens
  });

  // Retorna cache ou network, o que vier primeiro
  return cachedResponse || networkPromise;
}

// Estratégia: Documents/HTML (Network First com fallback offline)
async function handleDocumentRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for document, trying cache:', request.url);

    // Tenta cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback para página offline
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }

    // Último recurso: resposta básica
    return new Response('Página não disponível offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// Utilitários
function isStaticAsset(pathname) {
  return /\.(js|css|woff2?|ttf|eot)$/i.test(pathname) ||
         pathname.startsWith('/assets/');
}

function isImageAsset(pathname) {
  return /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i.test(pathname);
}

// Event: Message (para comunicação com a aplicação)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'CACHE_CLEAR':
        clearCaches();
        break;
      case 'CACHE_STATUS':
        getCacheStatus().then(status => {
          event.ports[0].postMessage(status);
        });
        break;
    }
  }
});

// Funções de gerenciamento de cache
async function clearCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = keys.length;
  }

  return status;
}

// Background Sync para requests falhados (opcional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-api-requests') {
    event.waitUntil(retryFailedRequests());
  }
});

async function retryFailedRequests() {
  // Implementação de retry para requests que falharam
  console.log('[SW] Retrying failed requests...');
  // TODO: Implementar queue de requests falhados
}

console.log('[SW] Service Worker loaded successfully');