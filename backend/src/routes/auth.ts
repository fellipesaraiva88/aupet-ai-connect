import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { jwtService, validateToken, refreshTokens } from '../services/jwt-service';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/index';
import { authMiddleware } from '../middleware/auth';

// ===================================================================
// ROTAS DE AUTENTICAÇÃO JWT AVANÇADA
// OBJETIVO: Endpoints para login, refresh e revogação de tokens
// ===================================================================

const router = Router();

// ===================================================================
// SCHEMAS DE VALIDAÇÃO
// ===================================================================

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  organizationId: z.string().uuid('Organization ID inválido').optional()
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório')
});

const revokeTokenSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  type: z.enum(['access', 'refresh']).default('access')
});

// ===================================================================
// ENDPOINTS DE AUTENTICAÇÃO
// ===================================================================

/**
 * POST /auth/login
 * Autentica usuário e retorna par de tokens
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, organizationId } = loginSchema.parse(req.body);

    // TODO: Implementar validação real com Supabase/banco de dados
    // Por agora, usar validação simples para demonstração
    if (email === 'admin@auzap.ai' && password === 'admin123') {
      const tokenPair = jwtService.generateTokenPair({
        id: 'admin-user-id',
        email: email,
        organizationId: organizationId || 'default-org',
        role: 'admin'
      });

      logger.info('User logged in successfully', { email, organizationId });

      res.json({
        success: true,
        data: {
          user: {
            id: 'admin-user-id',
            email: email,
            organizationId: organizationId || 'default-org',
            role: 'admin'
          },
          tokens: tokenPair
        }
      });
    } else {
      throw createError('Credenciais inválidas', 401);
    }

  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/refresh
 * Atualiza access token usando refresh token
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    const newTokenPair = await refreshTokens(refreshToken);

    if (!newTokenPair) {
      throw createError('Refresh token inválido ou expirado', 401);
    }

    logger.info('Tokens refreshed successfully');

    res.json({
      success: true,
      data: {
        tokens: newTokenPair
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/logout
 * Revoga tokens do usuário atual
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw createError('Token de autorização necessário', 401);
    }

    const token = jwtService.extractTokenFromHeader(authHeader);
    if (!token) {
      throw createError('Formato de token inválido', 401);
    }

    const validation = validateToken(token, 'access');
    if (validation.valid && validation.payload?.jti) {
      jwtService.revokeToken(validation.payload.jti, validation.payload.exp);
    }

    logger.info('User logged out successfully', { userId: authReq.user?.id });

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/revoke
 * Revoga token específico (admin only)
 */
router.post('/revoke', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    // Verificar se usuário é admin
    if (authReq.user?.role !== 'admin' && authReq.user?.role !== 'super_admin') {
      throw createError('Acesso negado - apenas administradores', 403);
    }

    const { token, type } = revokeTokenSchema.parse(req.body);

    const validation = validateToken(token, type);
    if (validation.valid && validation.payload?.jti) {
      jwtService.revokeToken(validation.payload.jti, validation.payload.exp);

      logger.info('Token revoked by admin', {
        adminId: authReq.user.id,
        revokedTokenJti: validation.payload.jti,
        revokedTokenUserId: validation.payload.id
      });

      res.json({
        success: true,
        message: `Token ${type} revogado com sucesso`
      });
    } else {
      throw createError('Token inválido para revogação', 400);
    }

  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/me
 * Retorna informações do usuário atual
 */
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    throw createError('Usuário não autenticado', 401);
  }

  res.json({
    success: true,
    data: {
      user: authReq.user
    }
  });
});

/**
 * POST /auth/validate
 * Valida se um token está válido (útil para outras aplicações)
 */
router.post('/validate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw createError('Token de autorização necessário', 401);
    }

    const token = jwtService.extractTokenFromHeader(authHeader);
    if (!token) {
      throw createError('Formato de token inválido', 401);
    }

    const validation = validateToken(token, 'access');

    res.json({
      success: true,
      data: {
        valid: validation.valid,
        needsRefresh: validation.needsRefresh,
        payload: validation.valid ? validation.payload : null,
        error: validation.error
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/health
 * Health check para o serviço de autenticação
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: 'auth',
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
});

export default router;