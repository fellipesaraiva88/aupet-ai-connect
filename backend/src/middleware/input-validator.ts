import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';

// ===================================================================
// INPUT VALIDATION MIDDLEWARE COM ZOD
// OBJETIVO: Validação robusta de entrada para todos os endpoints
// ===================================================================

export interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validateInput = (config: ValidationConfig) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (config.body) {
        const bodyResult = config.body.safeParse(req.body);
        if (!bodyResult.success) {
          logger.warn('Body validation failed', {
            path: req.path,
            errors: bodyResult.error.errors,
            body: req.body
          });
          throw createError(`Dados inválidos: ${bodyResult.error.errors.map(e => e.message).join(', ')}`, 400);
        }
        req.body = bodyResult.data;
      }

      // Validate query parameters
      if (config.query) {
        const queryResult = config.query.safeParse(req.query);
        if (!queryResult.success) {
          logger.warn('Query validation failed', {
            path: req.path,
            errors: queryResult.error.errors,
            query: req.query
          });
          throw createError(`Parâmetros inválidos: ${queryResult.error.errors.map(e => e.message).join(', ')}`, 400);
        }
        req.query = queryResult.data;
      }

      // Validate path parameters
      if (config.params) {
        const paramsResult = config.params.safeParse(req.params);
        if (!paramsResult.success) {
          logger.warn('Params validation failed', {
            path: req.path,
            errors: paramsResult.error.errors,
            params: req.params
          });
          throw createError(`Parâmetros de rota inválidos: ${paramsResult.error.errors.map(e => e.message).join(', ')}`, 400);
        }
        req.params = paramsResult.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// ===================================================================
// SCHEMAS COMUNS DE VALIDAÇÃO
// ===================================================================

export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid('UUID inválido'),

  // Email validation
  email: z.string().email('Email inválido'),

  // Phone validation (Brazilian format)
  phone: z.string().regex(/^\+?55[1-9]{2}9[0-9]{8}$/, 'Telefone deve estar no formato brasileiro'),

  // Pagination
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0, 'Página deve ser maior que 0').optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limite deve ser entre 1 e 100').optional()
  }),

  // WhatsApp message
  whatsappMessage: z.object({
    to: z.string().min(1, 'Destinatário é obrigatório'),
    message: z.string().min(1, 'Mensagem é obrigatória').max(4096, 'Mensagem muito longa'),
    messageType: z.enum(['text', 'image', 'audio', 'document']).optional(),
    mediaUrl: z.string().url('URL de mídia inválida').optional()
  }),

  // Evolution API instance
  evolutionInstance: z.object({
    instanceName: z.string().min(1, 'Nome da instância é obrigatório').max(50, 'Nome muito longo'),
    integration: z.enum(['WHATSAPP-BAILEYS', 'WHATSAPP-BUSINESS']).optional()
  }),

  // AI configuration
  aiConfig: z.object({
    personality: z.enum(['professional', 'friendly', 'casual', 'formal']),
    responseDelay: z.number().min(0).max(30),
    autoReply: z.boolean(),
    escalationKeywords: z.array(z.string()).optional()
  })
};

// ===================================================================
// MIDDLEWARE DE SANITIZAÇÃO
// ===================================================================

export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    next();
  } catch (error) {
    next(error);
  }
};

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove potential XSS attempts
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
    } else {
      sanitized[key] = sanitizeObject(value);
    }
  }

  return sanitized;
};