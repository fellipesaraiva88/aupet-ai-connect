import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';
import { SupabaseService } from '../services/supabase';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        organizationId: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Token de autorização necessário', 401);
    }

    const token = authHeader.substring(7);

    // Validate Supabase token
    const supabaseService = new SupabaseService();
    const { data: { user }, error } = await supabaseService.getClient().auth.getUser(token);

    if (error || !user) {
      logger.warn(`Invalid token: ${error?.message}`);
      throw createError('Token inválido ou expirado', 401);
    }

    // Add user info to request for multi-tenant isolation
    req.user = {
      id: user.id,
      email: user.email || '',
      organizationId: user.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000000',
      role: user.user_metadata?.role || 'user'
    };

    logger.info(`User authenticated: ${user.email} (${req.user.organizationId})`);
    next();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Token')) {
      return next(error);
    }
    logger.error('Auth middleware error:', error);
    return next(createError('Falha na autenticação', 401));
  }
};


// Middleware to check specific roles
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Usuário não autenticado', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError('Permissão insuficiente', 403));
    }

    next();
  };
};

// Middleware to check organization access
export const requireOrganization = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(createError('Usuário não autenticado', 401));
  }

  const { organizationId } = req.params;

  if (organizationId && organizationId !== req.user.organizationId && req.user.role !== 'super_admin') {
    return next(createError('Acesso negado para esta organização', 403));
  }

  next();
};