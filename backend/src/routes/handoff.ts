import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { HandoffManager } from '../services/handoff-manager';
import { WebSocketService } from '../services/websocket';
import { logger } from '../utils/logger';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { z } from 'zod';

const router = Router();

// Lazy initialize HandoffManager
let handoffManager: HandoffManager;

const getHandoffManager = (req: Request): HandoffManager => {
  if (!handoffManager) {
    const wsService = req.app.get('wsService') as WebSocketService;
    handoffManager = new HandoffManager(wsService);
  }
  return handoffManager;
};

// Validation schemas
const transferSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
  notifyCustomer: z.boolean().optional().default(true)
});

/**
 * GET /api/handoff/:conversationId/status
 * Obter status atual do handoff para uma conversa
 */
router.get('/:conversationId/status', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { conversationId } = req.params;

  if (!conversationId) {
    throw createError('Conversation ID is required', 400);
  }

  try {
    const manager = getHandoffManager(req);
    const status = await manager.getHandoffStatus(conversationId);

    if (!status) {
      throw createError('Conversation not found', 404);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: status,
      message: 'Handoff status retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting handoff status:', error);
    throw createError('Erro ao obter status do handoff', 500);
  }
}));

/**
 * POST /api/handoff/:conversationId/enable
 * Ativar IA para uma conversa (desativar atendimento humano)
 */
router.post('/:conversationId/enable', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { conversationId } = req.params;
  const userId = authReq.user?.id;

  if (!conversationId) {
    throw createError('Conversation ID is required', 400);
  }

  try {
    const manager = getHandoffManager(req);
    const success = await manager.enableAI(conversationId, userId);

    if (!success) {
      throw createError('Failed to enable AI', 500);
    }

    logger.info('AI enabled via API', { conversationId, userId });

    const response: ApiResponse<any> = {
      success: true,
      data: { conversationId, enabled: true },
      message: 'IA ativada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error enabling AI:', error);
    throw createError('Erro ao ativar IA', 500);
  }
}));

/**
 * POST /api/handoff/:conversationId/disable
 * Desativar IA para uma conversa (ativar atendimento humano)
 */
router.post('/:conversationId/disable', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { conversationId } = req.params;
  const userId = authReq.user?.id;

  if (!conversationId) {
    throw createError('Conversation ID is required', 400);
  }

  try {
    const manager = getHandoffManager(req);
    const success = await manager.disableAI(conversationId, userId);

    if (!success) {
      throw createError('Failed to disable AI', 500);
    }

    logger.info('AI disabled via API', { conversationId, userId });

    const response: ApiResponse<any> = {
      success: true,
      data: { conversationId, enabled: false },
      message: 'IA desativada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error disabling AI:', error);
    throw createError('Erro ao desativar IA', 500);
  }
}));

/**
 * POST /api/handoff/:conversationId/transfer-to-human
 * Transferir conversa da IA para atendimento humano
 */
router.post('/:conversationId/transfer-to-human', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { conversationId } = req.params;
  const userId = authReq.user?.id;

  if (!conversationId) {
    throw createError('Conversation ID is required', 400);
  }

  try {
    const validatedData = transferSchema.parse(req.body);
    const manager = getHandoffManager(req);

    const success = await manager.transferToHuman(conversationId, {
      reason: validatedData.reason,
      triggeredBy: 'manual',
      userId,
      notifyCustomer: validatedData.notifyCustomer
    });

    if (!success) {
      throw createError('Failed to transfer to human', 500);
    }

    logger.info('Conversation transferred to human via API', {
      conversationId,
      userId,
      reason: validatedData.reason
    });

    const response: ApiResponse<any> = {
      success: true,
      data: { conversationId, currentHandler: 'human' },
      message: 'Conversa transferida para atendimento humano',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error transferring to human:', error);
    throw createError('Erro ao transferir para humano', 500);
  }
}));

/**
 * POST /api/handoff/:conversationId/transfer-to-ai
 * Transferir conversa do atendimento humano para IA
 */
router.post('/:conversationId/transfer-to-ai', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { conversationId } = req.params;
  const userId = authReq.user?.id;

  if (!conversationId) {
    throw createError('Conversation ID is required', 400);
  }

  try {
    const reasonSchema = z.object({
      reason: z.string().min(1, 'Reason is required')
    });

    const validatedData = reasonSchema.parse(req.body);
    const manager = getHandoffManager(req);

    const success = await manager.transferToAI(conversationId, {
      reason: validatedData.reason,
      triggeredBy: 'manual',
      userId
    });

    if (!success) {
      throw createError('Failed to transfer to AI', 500);
    }

    logger.info('Conversation transferred to AI via API', {
      conversationId,
      userId,
      reason: validatedData.reason
    });

    const response: ApiResponse<any> = {
      success: true,
      data: { conversationId, currentHandler: 'ai' },
      message: 'Conversa transferida para IA',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error transferring to AI:', error);
    throw createError('Erro ao transferir para IA', 500);
  }
}));

/**
 * GET /api/handoff/:conversationId/history
 * Obter histórico de handoffs de uma conversa
 */
router.get('/:conversationId/history', asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;

  if (!conversationId) {
    throw createError('Conversation ID is required', 400);
  }

  try {
    const manager = getHandoffManager(req);
    const history = await manager.getHandoffHistory(conversationId, limit);

    const response: ApiResponse<any> = {
      success: true,
      data: history,
      message: 'Handoff history retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting handoff history:', error);
    throw createError('Erro ao obter histórico de handoff', 500);
  }
}));

/**
 * GET /api/handoff/metrics
 * Obter métricas gerais de handoff para a organização
 */
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';
  const days = parseInt(req.query.days as string) || 7;

  try {
    const manager = getHandoffManager(req);
    const metrics = await manager.getHandoffMetrics(organizationId, days);

    if (!metrics) {
      throw createError('Failed to get metrics', 500);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: metrics,
      message: 'Handoff metrics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting handoff metrics:', error);
    throw createError('Erro ao obter métricas de handoff', 500);
  }
}));

/**
 * POST /api/handoff/batch-enable
 * Ativar IA para múltiplas conversas
 */
router.post('/batch-enable', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;

  const batchSchema = z.object({
    conversationIds: z.array(z.string().uuid()).min(1).max(50)
  });

  try {
    const validatedData = batchSchema.parse(req.body);
    const manager = getHandoffManager(req);

    const results = await Promise.allSettled(
      validatedData.conversationIds.map(id => manager.enableAI(id, userId))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - succeeded;

    logger.info('Batch AI enable completed', { total: results.length, succeeded, failed });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        total: results.length,
        succeeded,
        failed
      },
      message: `${succeeded} conversas com IA ativada`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error in batch enable:', error);
    throw createError('Erro ao ativar IA em lote', 500);
  }
}));

/**
 * POST /api/handoff/batch-disable
 * Desativar IA para múltiplas conversas
 */
router.post('/batch-disable', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;

  const batchSchema = z.object({
    conversationIds: z.array(z.string().uuid()).min(1).max(50)
  });

  try {
    const validatedData = batchSchema.parse(req.body);
    const manager = getHandoffManager(req);

    const results = await Promise.allSettled(
      validatedData.conversationIds.map(id => manager.disableAI(id, userId))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - succeeded;

    logger.info('Batch AI disable completed', { total: results.length, succeeded, failed });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        total: results.length,
        succeeded,
        failed
      },
      message: `${succeeded} conversas transferidas para humano`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error in batch disable:', error);
    throw createError('Erro ao desativar IA em lote', 500);
  }
}));

export default router;
