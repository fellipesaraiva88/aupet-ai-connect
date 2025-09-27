import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { createError } from './errorHandler';
import { AuthenticatedRequest } from '../types/index';
import { logger } from '../utils/logger';
import { envValidator } from '../config/env-validator';
import { encryption } from '../utils/encryption';
import { jwtService, validateToken } from '../services/jwt-service';

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
      // Validate API key using secure environment configuration
      const validApiKey = envValidator.get('API_KEY');

      if (apiKey && apiKey === validApiKey) {
        req.user = {
          id: 'default-user',
          email: 'dev@auzap.ai',
          organizationId: '51cff6e5-0bd2-47bd-8840-ec65d5df265a',
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

    // Validate JWT token using advanced JWT service
    const validation = validateToken(token, 'access');

    if (!validation.valid || !validation.payload) {
      if (validation.needsRefresh) {
        throw createError('Token expirado - refresh necessário', 401);
      }
      throw createError(validation.error || 'Token inválido', 401);
    }

    // Add user info to request
    req.user = {
      id: validation.payload.id,
      email: validation.payload.email,
      organizationId: validation.payload.organizationId,
      role: validation.payload.role
    };

    // Log warning if token needs refresh soon
    if (validation.needsRefresh) {
      logger.warn('Token expires soon - client should refresh', {
        userId: validation.payload.id,
        jti: validation.payload.jti
      });
    }

    logger.debug('User authenticated with advanced JWT', {
      userId: validation.payload.id,
      organizationId: validation.payload.organizationId,
      jti: validation.payload.jti
    });
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

// Generate JWT token pair using advanced service
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  // Para compatibilidade, retorna apenas o access token
  const tokenPair = jwtService.generateTokenPair(payload);
  return tokenPair.accessToken;
};

// Generate complete token pair (recommended)
export const generateTokenPair = (payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti' | 'type'>) => {
  return jwtService.generateTokenPair(payload);
};