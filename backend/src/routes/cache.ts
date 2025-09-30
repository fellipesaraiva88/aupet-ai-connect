/**
 * Cache Management Routes
 * Provides endpoints for cache health, statistics, and management
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { cacheService } from '../services/cache';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const invalidatePatternSchema = z.object({
  pattern: z.string().min(1, 'Pattern is required')
});

const invalidateTagsSchema = z.object({
  tags: z.array(z.string()).min(1, 'At least one tag is required')
});

/**
 * GET /api/cache/health
 * Check cache service health status
 */
router.get('/health', authMiddleware, async (req: Request, res: Response) => {
  try {
    const isHealthy = await cacheService.healthCheck();
    const stats = cacheService.getStats();

    res.json({
      success: true,
      data: {
        healthy: isHealthy,
        status: isHealthy ? 'connected' : 'disconnected',
        stats: {
          ...stats,
          hitRate: `${stats.hitRate.toFixed(2)}%`,
          avgResponseTime: `${stats.avgResponseTime.toFixed(2)}ms`
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Cache health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Cache health check failed'
    });
  }
});

/**
 * GET /api/cache/stats
 * Get detailed cache statistics
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = cacheService.getStats();
    const info = await cacheService.getInfo();

    // Parse Redis INFO output for key metrics
    const memoryUsed = info?.match(/used_memory_human:(\S+)/)?.[1] || 'N/A';
    const connectedClients = info?.match(/connected_clients:(\d+)/)?.[1] || '0';
    const totalKeys = info?.match(/db0:keys=(\d+)/)?.[1] || '0';

    res.json({
      success: true,
      data: {
        performance: {
          hits: stats.hits,
          misses: stats.misses,
          hitRate: `${stats.hitRate.toFixed(2)}%`,
          sets: stats.sets,
          deletes: stats.deletes,
          errors: stats.errors,
          avgResponseTime: `${stats.avgResponseTime.toFixed(2)}ms`
        },
        redis: {
          memoryUsed,
          connectedClients,
          totalKeys,
          version: info?.match(/redis_version:(\S+)/)?.[1] || 'N/A'
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics'
    });
  }
});

/**
 * POST /api/cache/invalidate/pattern
 * Invalidate cache entries by pattern
 */
router.post('/invalidate/pattern', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { pattern } = invalidatePatternSchema.parse(req.body);

    const deletedCount = await cacheService.invalidatePattern(pattern);

    logger.info(`Cache invalidation by pattern: ${pattern} (${deletedCount} keys deleted)`);

    res.json({
      success: true,
      data: {
        pattern,
        deletedCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    logger.error('Cache pattern invalidation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Cache invalidation failed'
    });
  }
});

/**
 * POST /api/cache/invalidate/tags
 * Invalidate cache entries by tags
 */
router.post('/invalidate/tags', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tags } = invalidateTagsSchema.parse(req.body);

    const deletedCount = await cacheService.invalidateTags(tags);

    logger.info(`Cache invalidation by tags: ${tags.join(', ')} (${deletedCount} keys deleted)`);

    res.json({
      success: true,
      data: {
        tags,
        deletedCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    logger.error('Cache tags invalidation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Cache invalidation failed'
    });
  }
});

/**
 * DELETE /api/cache/clear
 * Clear all cache (admin only)
 */
router.delete('/clear', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Additional admin check could be added here
    const authReq = req as any;
    if (authReq.user?.role !== 'admin' && authReq.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const success = await cacheService.clear();

    if (success) {
      logger.warn(`Cache cleared by user: ${authReq.user?.id}`);
    }

    res.json({
      success,
      data: {
        message: success ? 'Cache cleared successfully' : 'Failed to clear cache',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Cache clear failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

/**
 * GET /api/cache/info
 * Get detailed Redis server information (admin only)
 */
router.get('/info', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    if (authReq.user?.role !== 'admin' && authReq.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const info = await cacheService.getInfo();

    if (!info) {
      return res.status(503).json({
        success: false,
        error: 'Redis not available'
      });
    }

    // Parse INFO into structured data
    const sections = info.split('#').filter(Boolean);
    const parsedInfo: Record<string, any> = {};

    sections.forEach((section: string) => {
      const lines = section.trim().split('\n');
      const sectionName = lines[0].trim().toLowerCase();

      if (sectionName) {
        parsedInfo[sectionName] = {};
        lines.slice(1).forEach((line: string) => {
          const [key, value] = line.split(':');
          if (key && value) {
            parsedInfo[sectionName][key.trim()] = value.trim();
          }
        });
      }
    });

    res.json({
      success: true,
      data: parsedInfo
    });
  } catch (error) {
    logger.error('Failed to get cache info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache information'
    });
  }
});

export default router as Router;