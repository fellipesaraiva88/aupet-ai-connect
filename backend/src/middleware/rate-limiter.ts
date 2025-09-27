import { Request, Response, NextFunction } from 'express';
import { envValidator } from '../config/env-validator';
import { logger } from '../utils/logger';
import { createError } from './errorHandler';

// ===================================================================
// RATE LIMITER AVANÇADO
// OBJETIVO: Proteção contra ataques de força bruta e spam
// ===================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
  blocked: boolean;
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
  blockDuration: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;
  private config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      windowMs: parseInt(envValidator.get('RATE_LIMIT_WINDOW_MS').toString()) || 900000, // 15 min
      max: parseInt(envValidator.get('RATE_LIMIT_MAX').toString()) || 100,
      blockDuration: 60000, // 1 minute
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    };

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const identifier = this.getIdentifier(req);
      const now = Date.now();

      let entry = this.store.get(identifier);

      // Se não existe entrada, criar nova
      if (!entry) {
        entry = {
          count: 0,
          resetTime: now + this.config.windowMs,
          firstRequest: now,
          blocked: false
        };
      }

      // Reset se janela expirou
      if (now > entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + this.config.windowMs;
        entry.firstRequest = now;
        entry.blocked = false;
      }

      // Verificar se está bloqueado
      if (entry.blocked && now < entry.resetTime) {
        this.logViolation(req, identifier, 'blocked');
        return this.sendRateLimitResponse(res, entry, 'IP temporariamente bloqueado');
      }

      // Incrementar contador
      entry.count++;
      this.store.set(identifier, entry);

      // Verificar se excedeu limite
      if (entry.count > this.config.max) {
        entry.blocked = true;
        entry.resetTime = now + this.config.blockDuration;
        this.store.set(identifier, entry);

        this.logViolation(req, identifier, 'rate_limit_exceeded');
        return this.sendRateLimitResponse(res, entry, 'Rate limit excedido');
      }

      // Adicionar headers informativos
      res.set({
        'X-RateLimit-Limit': this.config.max.toString(),
        'X-RateLimit-Remaining': Math.max(0, this.config.max - entry.count).toString(),
        'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
        'X-RateLimit-Window': this.config.windowMs.toString()
      });

      // Log warning quando próximo do limite
      if (entry.count > this.config.max * 0.8) {
        logger.warn('Rate limit warning', {
          identifier,
          count: entry.count,
          max: this.config.max,
          remaining: this.config.max - entry.count,
          userAgent: req.get('User-Agent'),
          path: req.path
        });
      }

      next();
    };
  }

  private getIdentifier(req: Request): string {
    // Usar múltiplos identificadores para melhor detecção
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || '';
    const apiKey = req.headers['x-api-key'] as string || '';

    // Se tem API key, usar ela como identificador principal
    if (apiKey) {
      return `api:${apiKey}`;
    }

    // Caso contrário, usar IP + User-Agent hash
    const userAgentHash = this.simpleHash(userAgent);
    return `ip:${ip}:${userAgentHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private sendRateLimitResponse(res: Response, entry: RateLimitEntry, message: string): void {
    const retryAfter = Math.ceil((entry.resetTime - Date.now()) / 1000);

    res.status(429).set({
      'Retry-After': retryAfter.toString(),
      'X-RateLimit-Limit': this.config.max.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
    }).json({
      success: false,
      error: message,
      retryAfter,
      timestamp: new Date().toISOString()
    });
  }

  private logViolation(req: Request, identifier: string, type: string): void {
    logger.warn('Rate limit violation', {
      type,
      identifier,
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime && !entry.blocked) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Rate limiter cleanup', {
        entriesRemoved: cleaned,
        totalEntries: this.store.size
      });
    }
  }

  public getStats(): any {
    const now = Date.now();
    const activeEntries = Array.from(this.store.values()).filter(
      entry => now <= entry.resetTime
    );

    return {
      totalEntries: this.store.size,
      activeEntries: activeEntries.length,
      blockedEntries: activeEntries.filter(e => e.blocked).length,
      config: this.config
    };
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// ===================================================================
// RATE LIMITERS ESPECÍFICOS
// ===================================================================

// Rate limiter geral para API
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests por janela
  blockDuration: 1 * 60 * 1000 // 1 minute block
});

// Rate limiter mais restritivo para auth endpoints
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // apenas 10 tentativas de login por janela
  blockDuration: 5 * 60 * 1000 // 5 minutes block
});

// Rate limiter para webhook endpoints
export const webhookRateLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests por minuto
  blockDuration: 30 * 1000 // 30 seconds block
});

// ===================================================================
// MIDDLEWARE FUNCTIONS
// ===================================================================
export const rateLimitAPI = apiRateLimiter.middleware();
export const rateLimitAuth = authRateLimiter.middleware();
export const rateLimitWebhook = webhookRateLimiter.middleware();