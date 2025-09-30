/**
 * Redis Cache Service with Advanced Caching Strategies
 * Implements multi-layer caching, invalidation strategies, and performance optimization
 */

import Redis, { Redis as RedisClient } from 'ioredis';
import { logger } from '../utils/logger';
import { createHash } from 'crypto';

// Cache configuration
interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl: {
    default: number;
    short: number;
    medium: number;
    long: number;
    permanent: number;
  };
  maxRetries?: number;
  enableOfflineQueue?: boolean;
  lazyConnect?: boolean;
}

// Cache entry metadata
interface CacheEntry<T = any> {
  data: T;
  metadata: {
    createdAt: number;
    expiresAt?: number;
    version: number;
    tags?: string[];
    hitCount?: number;
  };
}

// Cache options for individual operations
interface CacheOptions {
  ttl?: number;
  tags?: string[];
  version?: number;
  compress?: boolean;
}

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
  avgResponseTime: number;
}

export class CacheService {
  private client: RedisClient | null = null;
  private subscriber: RedisClient | null = null;
  private config: CacheConfig;
  private stats: CacheStats;
  private isConnected: boolean = false;
  private invalidationHandlers: Map<string, Function[]> = new Map();

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: 'auzap:',
      ttl: {
        default: 300, // 5 minutes
        short: 60, // 1 minute
        medium: 900, // 15 minutes
        long: 3600, // 1 hour
        permanent: 0 // No expiration
      },
      maxRetries: 3,
      enableOfflineQueue: true,
      lazyConnect: false,
      ...config
    };

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
      avgResponseTime: 0
    };

    this.initializeRedis();
  }

  /**
   * Initialize Redis connections
   */
  private async initializeRedis(): Promise<void> {
    try {
      // Main client for cache operations
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        maxRetriesPerRequest: this.config.maxRetries,
        enableOfflineQueue: this.config.enableOfflineQueue,
        lazyConnect: this.config.lazyConnect,
        retryStrategy: (times: number) => {
          if (times > (this.config.maxRetries || 3)) {
            logger.error('Redis connection failed after max retries');
            return null;
          }
          return Math.min(times * 100, 3000);
        }
      });

      // Subscriber client for invalidation events
      this.subscriber = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db
      });

      // Setup event handlers
      this.setupEventHandlers();

      // Subscribe to invalidation channels
      await this.setupInvalidationSubscriptions();

      this.isConnected = true;
      logger.info('Redis cache service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis cache:', error);
      this.isConnected = false;
    }
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client || !this.subscriber) return;

    this.client.on('connect', () => {
      logger.info('Redis cache connected');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      logger.error('Redis cache error:', error);
      this.stats.errors++;
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Redis cache connection closed');
      this.isConnected = false;
    });

    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleInvalidationMessage(channel, message);
    });
  }

  /**
   * Setup invalidation subscriptions
   */
  private async setupInvalidationSubscriptions(): Promise<void> {
    if (!this.subscriber) return;

    // Subscribe to invalidation channels
    await this.subscriber.subscribe(
      'cache:invalidate:tag',
      'cache:invalidate:pattern',
      'cache:invalidate:all'
    );

    logger.info('Cache invalidation subscriptions setup');
  }

  /**
   * Generate cache key with namespace
   */
  private generateKey(namespace: string, identifier: string | object): string {
    if (typeof identifier === 'object') {
      // Create deterministic hash for object identifiers
      const hash = createHash('sha256')
        .update(JSON.stringify(identifier))
        .digest('hex')
        .substring(0, 8);
      return `${namespace}:${hash}`;
    }
    return `${namespace}:${identifier}`;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(
    namespace: string,
    identifier: string | object
  ): Promise<T | null> {
    if (!this.isConnected || !this.client) return null;

    const startTime = Date.now();
    const key = this.generateKey(namespace, identifier);

    try {
      const cached = await this.client.get(key);

      if (!cached) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Update hit count
      entry.metadata.hitCount = (entry.metadata.hitCount || 0) + 1;
      await this.client.set(key, JSON.stringify(entry), 'KEEPTTL');

      this.stats.hits++;
      this.updateHitRate();
      this.updateResponseTime(Date.now() - startTime);

      logger.debug(`Cache hit: ${key}`);
      return entry.data;
    } catch (error) {
      logger.error(`Cache get error for ${key}:`, error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Set value in cache with options
   */
  async set<T = any>(
    namespace: string,
    identifier: string | object,
    data: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isConnected || !this.client) return false;

    const key = this.generateKey(namespace, identifier);
    const ttl = options.ttl || this.config.ttl.default;

    try {
      const entry: CacheEntry<T> = {
        data,
        metadata: {
          createdAt: Date.now(),
          expiresAt: ttl > 0 ? Date.now() + (ttl * 1000) : undefined,
          version: options.version || 1,
          tags: options.tags,
          hitCount: 0
        }
      };

      const serialized = JSON.stringify(entry);

      if (ttl > 0) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }

      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.storeTags(key, options.tags);
      }

      this.stats.sets++;
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(`Cache set error for ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(namespace: string, identifier: string | object): Promise<boolean> {
    if (!this.isConnected || !this.client) return false;

    const key = this.generateKey(namespace, identifier);

    try {
      const result = await this.client.del(key);
      this.stats.deletes++;
      logger.debug(`Cache delete: ${key}`);
      return result === 1;
    } catch (error) {
      logger.error(`Cache delete error for ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.client) return 0;

    try {
      const keys = await this.client.keys(`${this.config.keyPrefix}${pattern}`);

      if (keys.length === 0) return 0;

      // Remove prefix from keys for deletion
      const cleanKeys = keys.map(k => k.replace(this.config.keyPrefix || '', ''));
      const pipeline = this.client.pipeline();

      cleanKeys.forEach(key => pipeline.del(key));
      await pipeline.exec();

      this.stats.deletes += keys.length;
      logger.info(`Invalidated ${keys.length} keys matching pattern: ${pattern}`);

      // Publish invalidation event
      await this.publishInvalidation('pattern', pattern);

      return keys.length;
    } catch (error) {
      logger.error(`Pattern invalidation error for ${pattern}:`, error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateTags(tags: string[]): Promise<number> {
    if (!this.isConnected || !this.client) return 0;

    try {
      let totalDeleted = 0;

      for (const tag of tags) {
        const tagKey = `tags:${tag}`;
        const members = await this.client.smembers(tagKey);

        if (members.length > 0) {
          const pipeline = this.client.pipeline();
          members.forEach(key => pipeline.del(key));
          await pipeline.exec();

          await this.client.del(tagKey);
          totalDeleted += members.length;
        }
      }

      this.stats.deletes += totalDeleted;
      logger.info(`Invalidated ${totalDeleted} keys with tags: ${tags.join(', ')}`);

      // Publish invalidation event
      await this.publishInvalidation('tag', tags.join(','));

      return totalDeleted;
    } catch (error) {
      logger.error(`Tag invalidation error for ${tags}:`, error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    if (!this.isConnected || !this.client) return false;

    try {
      await this.client.flushdb();
      this.resetStats();
      logger.warn('All cache cleared');

      // Publish invalidation event
      await this.publishInvalidation('all', '*');

      return true;
    } catch (error) {
      logger.error('Cache clear error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Store tags for a cache key
   */
  private async storeTags(key: string, tags: string[]): Promise<void> {
    if (!this.client) return;

    const pipeline = this.client.pipeline();

    for (const tag of tags) {
      const tagKey = `tags:${tag}`;
      pipeline.sadd(tagKey, key);
      // Set expiration for tag set (24 hours)
      pipeline.expire(tagKey, 86400);
    }

    await pipeline.exec();
  }

  /**
   * Publish invalidation event
   */
  private async publishInvalidation(type: string, data: string): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.publish(`cache:invalidate:${type}`, data);
    } catch (error) {
      logger.error('Failed to publish invalidation event:', error);
    }
  }

  /**
   * Handle invalidation messages
   */
  private handleInvalidationMessage(channel: string, message: string): void {
    const handlers = this.invalidationHandlers.get(channel) || [];

    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        logger.error('Invalidation handler error:', error);
      }
    });
  }

  /**
   * Register invalidation handler
   */
  onInvalidation(type: 'tag' | 'pattern' | 'all', handler: Function): void {
    const channel = `cache:invalidate:${type}`;

    if (!this.invalidationHandlers.has(channel)) {
      this.invalidationHandlers.set(channel, []);
    }

    this.invalidationHandlers.get(channel)?.push(handler);
  }

  /**
   * Wrap function with cache
   */
  wrap<T = any>(
    namespace: string,
    fn: (...args: any[]) => Promise<T>,
    options: CacheOptions = {}
  ): (...args: any[]) => Promise<T> {
    return async (...args: any[]): Promise<T> => {
      const identifier = args.length > 0 ? args : 'default';
      const cached = await this.get<T>(namespace, identifier);

      if (cached !== null) {
        return cached;
      }

      const result = await fn(...args);
      await this.set(namespace, identifier, result, options);
      return result;
    };
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Update average response time
   */
  private updateResponseTime(responseTime: number): void {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) {
      this.stats.avgResponseTime = responseTime;
    } else {
      this.stats.avgResponseTime =
        (this.stats.avgResponseTime * (total - 1) + responseTime) / total;
    }
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
      avgResponseTime: 0
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache info
   */
  async getInfo(): Promise<any> {
    if (!this.isConnected || !this.client) return null;

    try {
      const info = await this.client.info();
      return info;
    } catch (error) {
      logger.error('Failed to get cache info:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isConnected || !this.client) return false;

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
    if (this.subscriber) {
      await this.subscriber.quit();
    }
    this.isConnected = false;
    logger.info('Redis cache disconnected');
  }
}

// Export singleton instance
export const cacheService = new CacheService();