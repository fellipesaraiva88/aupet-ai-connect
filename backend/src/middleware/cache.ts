/**
 * Cache Middleware for API Routes
 * Provides automatic caching with intelligent invalidation
 */

import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache';
import { logger } from '../utils/logger';
import { createHash } from 'crypto';

// Cache configuration per route
interface RouteCacheConfig {
  ttl?: number;
  tags?: string[];
  keyGenerator?: (req: Request) => string;
  shouldCache?: (req: Request, res: Response) => boolean;
  invalidateOn?: string[];
}

// Default cache configurations for different route types
const DEFAULT_CONFIGS: Record<string, RouteCacheConfig> = {
  dashboard: {
    ttl: 60, // 1 minute
    tags: ['dashboard'],
    invalidateOn: ['POST', 'PUT', 'DELETE']
  },
  list: {
    ttl: 300, // 5 minutes
    tags: ['list'],
    invalidateOn: ['POST', 'PUT', 'DELETE']
  },
  detail: {
    ttl: 600, // 10 minutes
    tags: ['detail'],
    invalidateOn: ['PUT', 'DELETE']
  },
  report: {
    ttl: 1800, // 30 minutes
    tags: ['report'],
    invalidateOn: []
  }
};

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request, customGenerator?: (req: Request) => string): string {
  if (customGenerator) {
    return customGenerator(req);
  }

  // Create deterministic key from request properties
  const keyData = {
    method: req.method,
    path: req.path,
    query: req.query,
    userId: req.user?.id,
    organizationId: req.user?.organizationId
  };

  const hash = createHash('sha256')
    .update(JSON.stringify(keyData))
    .digest('hex')
    .substring(0, 16);

  return `api:${req.method}:${req.path}:${hash}`;
}

/**
 * Cache middleware factory
 */
export function cache(config: RouteCacheConfig | string = {}): (req: Request, res: Response, next: NextFunction) => void {
  // If string provided, use default config
  const cacheConfig: RouteCacheConfig = typeof config === 'string'
    ? DEFAULT_CONFIGS[config] || {}
    : config;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // Check if this request should invalidate cache
      if (cacheConfig.invalidateOn?.includes(req.method)) {
        await handleCacheInvalidation(req, cacheConfig);
      }
      return next();
    }

    // Check if caching should be skipped
    if (cacheConfig.shouldCache && !cacheConfig.shouldCache(req, res)) {
      return next();
    }

    // Skip cache if no-cache header is present
    if (req.headers['cache-control'] === 'no-cache') {
      return next();
    }

    const cacheKey = generateCacheKey(req, cacheConfig.keyGenerator);

    try {
      // Try to get from cache
      const cached = await cacheService.get('org-cache', cacheKey);

      if (cached) {
        // Add cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);

        logger.debug(`Cache HIT: ${cacheKey}`);

        // Send cached response
        res.json(cached);
        return;
      }

      // Cache MISS - continue with request
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache the response
      res.json = function(data: any) {
        // Cache the response
        cacheService.set('org-cache', cacheKey, data, {
          ttl: cacheConfig.ttl,
          tags: cacheConfig.tags
        }).catch(error => {
          logger.error('Failed to cache response:', error);
        });

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Continue without cache on error
      next();
    }
  };
}

/**
 * Handle cache invalidation
 */
async function handleCacheInvalidation(req: Request, config: RouteCacheConfig): Promise<void> {
  try {
    // Invalidate by tags if specified
    if (config.tags && config.tags.length > 0) {
      await cacheService.invalidateTags(config.tags);
    }

    // Invalidate related patterns
    const patterns = generateInvalidationPatterns(req);
    for (const pattern of patterns) {
      await cacheService.invalidatePattern(pattern);
    }

    logger.info(`Cache invalidated for ${req.method} ${req.path}`);
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
}

/**
 * Generate invalidation patterns based on request
 */
function generateInvalidationPatterns(req: Request): string[] {
  const patterns: string[] = [];

  // Invalidate all list endpoints for the resource
  const resourceMatch = req.path.match(/\/api\/(\w+)/);
  if (resourceMatch) {
    const resource = resourceMatch[1];
    patterns.push(`api:GET:/api/${resource}*`);
  }

  // Invalidate specific resource if ID is present
  if (req.params.id) {
    patterns.push(`api:*:${req.path}*`);
  }

  // Invalidate dashboard and stats
  if (req.path.includes('dashboard') || req.path.includes('stats')) {
    patterns.push('api:GET:/api/dashboard*');
    patterns.push('api:GET:/api/stats*');
  }

  return patterns;
}

/**
 * Cache invalidation middleware
 * Manually invalidate cache for specific patterns
 */
export function invalidateCache(patterns: string | string[]): (req: Request, res: Response, next: NextFunction) => void {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const patternsArray = Array.isArray(patterns) ? patterns : [patterns];

      for (const pattern of patternsArray) {
        await cacheService.invalidatePattern(pattern);
      }

      logger.info(`Manual cache invalidation: ${patternsArray.join(', ')}`);
    } catch (error) {
      logger.error('Manual cache invalidation error:', error);
    }

    next();
  };
}

/**
 * Clear all cache middleware
 */
export async function clearAllCache(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await cacheService.clear();
    logger.warn('All cache cleared via middleware');
  } catch (error) {
    logger.error('Failed to clear all cache:', error);
  }

  next();
}

/**
 * Cache statistics middleware
 */
export function cacheStats(req: Request, res: Response): void {
  const stats = cacheService.getStats();

  res.json({
    success: true,
    stats: {
      ...stats,
      hitRate: `${stats.hitRate.toFixed(2)}%`,
      avgResponseTime: `${stats.avgResponseTime.toFixed(2)}ms`
    }
  });
}

/**
 * Conditional caching based on response
 */
export function conditionalCache(
  condition: (req: Request, res: Response) => boolean,
  config: RouteCacheConfig = {}
): (req: Request, res: Response, next: NextFunction) => void {
  return cache({
    ...config,
    shouldCache: condition
  });
}

/**
 * User-specific cache
 */
export function userCache(ttl: number = 300): (req: Request, res: Response, next: NextFunction) => void {
  return cache({
    ttl,
    keyGenerator: (req: Request) => {
      const userId = req.user?.id || 'anonymous';
      return `user:${userId}:${req.method}:${req.path}`;
    },
    tags: ['user-cache']
  });
}

/**
 * Organization-specific cache
 */
export function orgCache(ttl: number = 300): (req: Request, res: Response, next: NextFunction) => void {
  return cache({
    ttl,
    keyGenerator: (req: Request) => {
      const orgId = req.user?.organizationId || 'default';
      return `org:${orgId}:${req.method}:${req.path}`;
    },
    tags: ['org-cache']
  });
}

/**
 * Smart cache with automatic TTL adjustment
 */
export function smartCache(): (req: Request, res: Response, next: NextFunction) => void {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Determine TTL based on endpoint pattern
    let ttl = 300; // Default 5 minutes

    if (req.path.includes('/dashboard') || req.path.includes('/stats')) {
      ttl = 60; // 1 minute for real-time data
    } else if (req.path.includes('/reports')) {
      ttl = 1800; // 30 minutes for reports
    } else if (req.path.includes('/settings') || req.path.includes('/config')) {
      ttl = 3600; // 1 hour for configuration
    }

    // Apply cache with determined TTL
    const cacheMiddleware = cache({ ttl, tags: ['smart-cache'] });
    cacheMiddleware(req, res, next);
  };
}