import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { createError } from './errorHandler';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';

interface JWTPayload {
  id: string;
  email: string;
  organizationId: string;
  role: string;
  iat: number;
  exp: number;
}

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
    // Extract token from Authorization header or x-api-key header
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] as string;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (apiKey) {
      // For now, we'll use a simple API key approach for development
      // In production, this should be replaced with proper JWT validation
      if (apiKey === process.env.API_KEY || apiKey === 'dev-api-key') {
        req.user = {
          id: 'default-user',
          email: 'dev@auzap.ai',
          organizationId: 'default-org',
          role: 'admin'
        };
        return next();
      } else {
        throw createError('API Key inválida', 401);
      }
    }

    if (!token) {
      throw createError('Token de autenticação necessário', 401);
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      organizationId: decoded.organizationId,
      role: decoded.role
    };

    logger.debug('User authenticated', { userId: decoded.id, organizationId: decoded.organizationId });
    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(createError('Token inválido', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(createError('Token expirado', 401));
    }
    next(error);
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

// Generate JWT token
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const jwtSecret = process.env.JWT_SECRET || 'default-secret';
  const expiresIn = process.env.JWT_EXPIRE_TIME || '24h';

  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign(payload as any, jwtSecret, options);
};