import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../utils/logger';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  connectTimeout: number;
  lazyConnect: boolean;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  retryDelayOnClusterDown: number;
  enableOfflineQueue: boolean;
  family: 4 | 6;
}

export class RedisManager {
  private static instance: Redis;
  private static config: RedisConfig;

  public static getConfig(): RedisConfig {
    if (!this.config) {
      this.config = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'aupet:',
        connectTimeout: 10000,
        lazyConnect: true,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        retryDelayOnClusterDown: 300,
        enableOfflineQueue: false,
        family: 4
      };
    }
    return this.config;
  }

  public static getInstance(): Redis {
    if (!this.instance) {
      this.instance = this.createConnection();
    }
    return this.instance;
  }

  public static createConnection(customConfig?: Partial<RedisConfig>): Redis {
    const config = { ...this.getConfig(), ...customConfig };

    const redisOptions: RedisOptions = {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      keyPrefix: config.keyPrefix,
      connectTimeout: config.connectTimeout,
      lazyConnect: config.lazyConnect,
      // retryDelayOnFailover: config.retryDelayOnFailover,
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      // retryDelayOnClusterDown: config.retryDelayOnClusterDown,
      enableOfflineQueue: config.enableOfflineQueue,
      family: config.family,

      // Connection retry strategy
      retryDelayOnConnect: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection retry ${times}, delay: ${delay}ms`);
        return delay;
      },

      // Reconnect on error
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      }
    };

    const redis = new Redis(redisOptions);

    // Event listeners
    redis.on('connect', () => {
      logger.info('Redis connected successfully', {
        host: config.host,
        port: config.port,
        db: config.db
      });
    });

    redis.on('ready', () => {
      logger.info('Redis ready to accept commands');
    });

    redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redis.on('reconnecting', (ms) => {
      logger.info(`Redis reconnecting in ${ms}ms`);
    });

    redis.on('end', () => {
      logger.warn('Redis connection ended');
    });

    return redis;
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      if (!this.instance) {
        return false;
      }

      const result = await this.instance.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  public static async getInfo(): Promise<any> {
    try {
      if (!this.instance) {
        throw new Error('Redis instance not initialized');
      }

      const info = await this.instance.info();
      const memory = await this.instance.info('memory');
      const stats = await this.instance.info('stats');

      return {
        connected: await this.healthCheck(),
        info: this.parseRedisInfo(info),
        memory: this.parseRedisInfo(memory),
        stats: this.parseRedisInfo(stats),
        config: this.getConfig()
      };
    } catch (error) {
      logger.error('Failed to get Redis info:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public static async flushDatabase(): Promise<void> {
    try {
      if (!this.instance) {
        throw new Error('Redis instance not initialized');
      }

      await this.instance.flushdb();
      logger.info('Redis database flushed');
    } catch (error) {
      logger.error('Failed to flush Redis database:', error);
      throw error;
    }
  }

  public static async closeConnection(): Promise<void> {
    try {
      if (this.instance) {
        await this.instance.quit();
        logger.info('Redis connection closed gracefully');
      }
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    } finally {
      // @ts-ignore
      this.instance = null;
    }
  }

  private static parseRedisInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {};

    info.split('\r\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value !== undefined) {
          // Try to parse as number if possible
          const numValue = Number(value);
          result[key] = isNaN(numValue) ? value : numValue;
        }
      }
    });

    return result;
  }
}

// Cache utilities
export class CacheManager {
  private redis: Redis;
  private defaultTTL: number;

  constructor(redis: Redis, defaultTTL = 3600) {
    this.redis = redis;
    this.defaultTTL = defaultTTL;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const result = await this.redis.setex(key, ttl || this.defaultTTL, serialized);
      return result === 'OK';
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result > 0;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async incr(key: string, by = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, by);
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      logger.error(`Cache keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      logger.error(`Cache mget error for keys ${keys.join(', ')}:`, error);
      return keys.map(() => null);
    }
  }

  async mset<T>(keyValues: Record<string, T>, ttl?: number): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();

      Object.entries(keyValues).forEach(([key, value]) => {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      });

      const results = await pipeline.exec();
      return results?.every(([err, result]) => !err && result === 'OK') || false;
    } catch (error) {
      logger.error(`Cache mset error:`, error);
      return false;
    }
  }

  // Rate limiting utilities
  async isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
    try {
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.expire(key, Math.ceil(windowMs / 1000));
      }

      return current > limit;
    } catch (error) {
      logger.error(`Rate limit check error for key ${key}:`, error);
      return false;
    }
  }

  // Session utilities
  async saveSession(sessionId: string, data: any, ttl?: number): Promise<boolean> {
    return this.set(`session:${sessionId}`, data, ttl || this.defaultTTL);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`);
  }

  async extendSession(sessionId: string, ttl: number): Promise<boolean> {
    return this.expire(`session:${sessionId}`, ttl);
  }
}