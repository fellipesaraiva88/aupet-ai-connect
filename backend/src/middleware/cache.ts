/**
 * Cache Middleware for Express.js
 * Auzap AI Connect - Performance Optimization
 */

import { Request, Response, NextFunction } from 'express';

interface CacheOptions {
  maxAge?: number; // em segundos
  sMaxAge?: number; // cache do CDN em segundos
  public?: boolean;
  private?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  proxyRevalidate?: boolean;
  immutable?: boolean;
  staleWhileRevalidate?: number; // em segundos
  staleIfError?: number; // em segundos
}

/**
 * Middleware para configurar cache headers HTTP
 */
export function cacheControl(options: CacheOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const {
      maxAge = 0,
      sMaxAge,
      public: isPublic = false,
      private: isPrivate = false,
      noCache = false,
      noStore = false,
      mustRevalidate = false,
      proxyRevalidate = false,
      immutable = false,
      staleWhileRevalidate,
      staleIfError
    } = options;

    const cacheDirectives: string[] = [];

    // Visibilidade do cache
    if (isPublic) cacheDirectives.push('public');
    if (isPrivate) cacheDirectives.push('private');

    // Controles de revalidação
    if (noCache) cacheDirectives.push('no-cache');
    if (noStore) cacheDirectives.push('no-store');
    if (mustRevalidate) cacheDirectives.push('must-revalidate');
    if (proxyRevalidate) cacheDirectives.push('proxy-revalidate');

    // TTL do cache
    if (maxAge > 0) cacheDirectives.push(`max-age=${maxAge}`);
    if (sMaxAge !== undefined) cacheDirectives.push(`s-maxage=${sMaxAge}`);

    // Otimizações especiais
    if (immutable) cacheDirectives.push('immutable');
    if (staleWhileRevalidate) cacheDirectives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    if (staleIfError) cacheDirectives.push(`stale-if-error=${staleIfError}`);

    // Define o header Cache-Control
    if (cacheDirectives.length > 0) {
      res.set('Cache-Control', cacheDirectives.join(', '));
    }

    // Headers adicionais para performance
    res.set('Vary', 'Accept-Encoding');

    next();
  };
}

/**
 * Configurações de cache pré-definidas
 */
export const cachePresets = {
  /**
   * Sem cache - para conteúdo dinâmico
   */
  noCache: () => cacheControl({
    noCache: true,
    noStore: true,
    mustRevalidate: true,
    proxyRevalidate: true
  }),

  /**
   * Cache curto - para APIs que mudam frequentemente
   */
  shortTerm: (seconds: number = 300) => cacheControl({
    public: true,
    maxAge: seconds,
    mustRevalidate: true,
    staleWhileRevalidate: seconds * 2
  }),

  /**
   * Cache médio - para dados que mudam ocasionalmente
   */
  mediumTerm: (seconds: number = 3600) => cacheControl({
    public: true,
    maxAge: seconds,
    sMaxAge: seconds * 2,
    staleWhileRevalidate: seconds,
    staleIfError: seconds * 24
  }),

  /**
   * Cache longo - para recursos estáticos
   */
  longTerm: (seconds: number = 86400) => cacheControl({
    public: true,
    maxAge: seconds,
    sMaxAge: seconds,
    immutable: true
  }),

  /**
   * Cache privado - para dados do usuário
   */
  private: (seconds: number = 300) => cacheControl({
    private: true,
    maxAge: seconds,
    mustRevalidate: true
  }),

  /**
   * Cache para assets estáticos
   */
  staticAssets: () => cacheControl({
    public: true,
    maxAge: 31536000, // 1 ano
    immutable: true
  }),

  /**
   * Cache para imagens
   */
  images: () => cacheControl({
    public: true,
    maxAge: 2592000, // 30 dias
    staleWhileRevalidate: 86400, // 1 dia
    staleIfError: 604800 // 7 dias
  }),

  /**
   * Cache para APIs de dados
   */
  apiData: (seconds: number = 60) => cacheControl({
    public: true,
    maxAge: seconds,
    sMaxAge: seconds * 2,
    staleWhileRevalidate: seconds * 5,
    mustRevalidate: true
  })
};

/**
 * Middleware para ETag automático
 */
export function etag(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;

  res.send = function(data: any) {
    if (data && typeof data === 'string') {
      const hash = require('crypto')
        .createHash('md5')
        .update(data)
        .digest('hex');

      res.set('ETag', `"${hash}"`);

      // Verifica If-None-Match
      const ifNoneMatch = req.get('If-None-Match');
      if (ifNoneMatch === `"${hash}"`) {
        res.status(304);
        return originalSend.call(this, '');
      }
    }

    return originalSend.call(this, data);
  } as any;

  next();
}

/**
 * Middleware para Last-Modified automático
 */
export function lastModified(date?: Date) {
  return (req: Request, res: Response, next: NextFunction) => {
    const modifiedDate = date || new Date();
    res.set('Last-Modified', modifiedDate.toUTCString());

    // Verifica If-Modified-Since
    const ifModifiedSince = req.get('If-Modified-Since');
    if (ifModifiedSince) {
      const ifModifiedSinceDate = new Date(ifModifiedSince);
      if (modifiedDate <= ifModifiedSinceDate) {
        res.status(304);
        return res.end();
      }
    }

    next();
  };
}

/**
 * Cache em memória simples para desenvolvimento
 */
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();

  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expires });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expires < now) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryCache = new MemoryCache();

/**
 * Middleware para cache em memória
 */
export function memoryCacheMiddleware(ttlSeconds: number = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.method}:${req.originalUrl}`;
    const cached = memoryCache.get(key);

    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    res.set('X-Cache', 'MISS');

    const originalJson = res.json;
    res.json = function(data: any) {
      memoryCache.set(key, data, ttlSeconds);
      return originalJson.call(this, data);
    };

    next();
  };
}

// Cleanup automático do cache em memória
setInterval(() => {
  memoryCache.cleanup();
}, 60000); // Limpa a cada minuto