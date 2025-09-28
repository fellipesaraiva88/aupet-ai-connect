import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { jwtService, validateToken, refreshTokens } from '../services/jwt-service';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/index';
import { authMiddleware } from '../middleware/auth';
import { SupabaseService } from '../services/supabase';

// ===================================================================
// ROTAS DE AUTENTICAÇÃO JWT AVANÇADA
// OBJETIVO: Endpoints para login, refresh e revogação de tokens
// ===================================================================

const router = Router();

// Instanciar serviço Supabase
const supabaseService = new SupabaseService();

// ===================================================================
// SCHEMAS DE VALIDAÇÃO
// ===================================================================

const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  organizationName: z.string().min(2, 'Nome da organização deve ter pelo menos 2 caracteres'),
  subscriptionTier: z.enum(['free', 'pro', 'enterprise']).default('free')
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
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
 * POST /auth/signup
 * Cria nova conta de usuário e organização
 */
router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, organizationName, subscriptionTier } = signupSchema.parse(req.body);

    // Criar usuário no Supabase Auth com metadata
    const { data: authData, error: authError } = await supabaseService.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          organization_name: organizationName,
          subscription_tier: subscriptionTier
        }
      }
    });

    if (authError) {
      throw createError(`Erro ao criar conta: ${authError.message}`, 400);
    }

    if (!authData.user) {
      throw createError('Erro ao criar usuário', 500);
    }

    // Criar organização primeiro
    const organizationSlug = organizationName.toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    const { data: organization, error: orgError } = await supabaseService.supabase
      .from('organizations')
      .insert({
        name: organizationName,
        slug: organizationSlug,
        subscription_tier: subscriptionTier
      })
      .select()
      .single();

    if (orgError || !organization) {
      logger.error('Erro ao criar organização:', orgError);
      // Se falhou, tentar deletar o usuário do Auth
      await supabaseService.supabase.auth.admin.deleteUser(authData.user.id);
      throw createError('Erro ao criar organização', 500);
    }

    // Criar perfil do usuário
    const { data: profile, error: profileError } = await supabaseService.supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        user_id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        role: 'admin',
        organization_id: organization.id,
        is_active: true,
        onboarding_completed: false
      })
      .select(`
        id,
        email,
        full_name,
        role,
        organization_id
      `)
      .single();

    if (profileError || !profile) {
      logger.error('Erro ao criar profile:', profileError);
      // Cleanup: deletar organização e usuário
      await supabaseService.supabase.from('organizations').delete().eq('id', organization.id);
      await supabaseService.supabase.auth.admin.deleteUser(authData.user.id);
      throw createError('Database error saving new user', 500);
    }

    // Gerar tokens JWT
    const tokenPair = jwtService.generateTokenPair({
      id: authData.user.id,
      email: authData.user.email!,
      organizationId: profile.organization_id,
      role: profile.role
    });

    logger.info('User signed up successfully', {
      email,
      userId: authData.user.id,
      organizationId: profile.organization_id
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          fullName: profile.full_name,
          role: profile.role,
          organizationId: profile.organization_id,
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            subscription_tier: organization.subscription_tier
          }
        },
        tokens: tokenPair,
        needsEmailVerification: !authData.user.email_confirmed_at
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/login
 * Autentica usuário e retorna par de tokens
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Autenticar com Supabase Auth
    const { data: authData, error: authError } = await supabaseService.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      throw createError(`Credenciais inválidas: ${authError.message}`, 401);
    }

    if (!authData.user) {
      throw createError('Erro ao autenticar usuário', 500);
    }

    // Buscar dados completos do usuário (profile + organization)
    const { data: profile, error: profileError } = await supabaseService.supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        organization_id,
        is_active,
        organizations (
          id,
          name,
          slug,
          subscription_tier,
          is_active
        )
      `)
      .eq('user_id', authData.user.id)
      .eq('is_active', true)
      .single();

    if (profileError || !profile) {
      logger.error('Erro ao buscar profile no login:', profileError);
      throw createError('Usuário não encontrado ou inativo', 404);
    }

    if (!(profile.organizations as any)?.is_active) {
      throw createError('Organização inativa', 403);
    }

    // Gerar tokens JWT
    const tokenPair = jwtService.generateTokenPair({
      id: authData.user.id,
      email: authData.user.email!,
      organizationId: profile.organization_id,
      role: profile.role
    });

    logger.info('User logged in successfully', {
      email,
      userId: authData.user.id,
      organizationId: profile.organization_id
    });

    res.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          fullName: profile.full_name,
          role: profile.role,
          organizationId: profile.organization_id,
          organization: profile.organizations
        },
        tokens: tokenPair
      }
    });

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