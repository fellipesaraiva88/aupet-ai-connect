import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';
import { authMiddleware, requireRole } from './auth';
import { AuthenticatedRequest } from '../types';
import { SupabaseService } from '../services/supabase';

/**
 * Middleware composto para proteger rotas administrativas
 * Verifica autenticação + role super_admin
 */
export const requireSuperAdmin = [
  authMiddleware,
  requireRole(['super_admin'])
];

/**
 * Middleware para logar todas as ações administrativas em audit log
 * Deve ser usado em TODAS as rotas /api/admin/*
 */
export const adminAuditLogger = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authReq = req as AuthenticatedRequest;

  try {
    // Capturar informações da requisição
    const adminUserId = authReq.user?.id;
    const action = `${req.method} ${req.path}`;
    const resourceType = extractResourceType(req.path);
    const resourceId = req.params.id || null;
    const organizationId = req.body.organization_id || req.params.organizationId || null;

    const metadata = {
      method: req.method,
      path: req.path,
      query: req.query,
      body: sanitizeBody(req.body),
      params: req.params
    };

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    // Salvar no banco após a requisição ser processada
    res.on('finish', async () => {
      try {
        const supabaseService = new SupabaseService();

        await supabaseService.supabase
          .from('admin_audit_logs')
          .insert({
            admin_user_id: adminUserId,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            organization_id: organizationId,
            metadata: metadata,
            ip_address: ipAddress,
            user_agent: userAgent,
            status_code: res.statusCode,
            created_at: new Date().toISOString()
          });

        logger.info('Admin action logged', {
          adminUserId,
          action,
          statusCode: res.statusCode
        });
      } catch (error) {
        logger.error('Failed to log admin action:', error);
        // Não bloqueamos a requisição se o log falhar
      }
    });

    next();
  } catch (error) {
    logger.error('Admin audit logger error:', error);
    next(); // Continua mesmo se o audit logger falhar
  }
};

/**
 * Extrai o tipo de recurso do path da requisição
 */
function extractResourceType(path: string): string {
  const parts = path.split('/').filter(p => p);

  // /api/admin/organizations -> 'organizations'
  // /api/admin/users -> 'users'
  if (parts.length >= 3 && parts[0] === 'api' && parts[1] === 'admin') {
    return parts[2] || 'unknown';
  }

  return 'unknown';
}

/**
 * Remove informações sensíveis do body antes de logar
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Middleware para verificar se o usuário pode acessar uma organização específica
 * Super admins podem acessar qualquer organização
 * Admins normais só podem acessar a própria organização
 */
export const requireOrganizationAccess = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    return next(createError('Usuário não autenticado', 401));
  }

  // Super admins podem acessar qualquer organização
  if (authReq.user.role === 'super_admin') {
    return next();
  }

  // Admins e usuários só podem acessar a própria organização
  const targetOrganizationId = req.params.organizationId || req.body.organization_id;

  if (targetOrganizationId && targetOrganizationId !== authReq.user.organizationId) {
    return next(createError('Acesso negado para esta organização', 403));
  }

  next();
};

/**
 * Middleware para validar que o usuário não está tentando
 * elevar seu próprio role ou fazer ações administrativas em si mesmo
 */
export const preventSelfElevation = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    return next(createError('Usuário não autenticado', 401));
  }

  const targetUserId = req.params.id || req.params.userId;

  // Não permitir que usuário modifique a si mesmo
  if (targetUserId === authReq.user.id) {
    const isRoleChange = req.body.role || req.path.includes('/change-role');
    const isOrgChange = req.body.organization_id || req.path.includes('/change-organization');

    if (isRoleChange || isOrgChange) {
      return next(createError('Você não pode modificar seu próprio role ou organização', 403));
    }
  }

  next();
};