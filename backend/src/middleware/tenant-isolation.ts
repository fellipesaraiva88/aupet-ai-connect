import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/index';

// ===================================================================
// MIDDLEWARE DE ISOLAMENTO MULTI-TENANT
// OBJETIVO: Garantir que cada organização veja apenas seus dados
// ===================================================================

/**
 * Middleware que injeta organization_id nas requests e valida acesso
 */
export const tenantIsolationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authReq = req as AuthenticatedRequest;

    // Verificar se usuário está autenticado
    if (!authReq.user) {
      throw createError('Usuário não autenticado', 401);
    }

    // Verificar se tem organizationId
    if (!authReq.user.organizationId) {
      throw createError('Usuário sem organização associada', 403);
    }

    // Injetar organizationId no body para operações POST/PUT
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      // Não sobrescrever se já existir (para casos especiais)
      if (!req.body.organization_id) {
        req.body.organization_id = authReq.user.organizationId;
      }

      // Validar que o organization_id do body corresponde ao do usuário
      if (req.body.organization_id !== authReq.user.organizationId) {
        throw createError('Acesso negado: organization_id inválido', 403);
      }
    }

    // Injetar organizationId nos query params para operações GET
    if (req.method === 'GET') {
      req.query.organization_id = authReq.user.organizationId;
    }

    // Adicionar organizationId no objeto de contexto para facilitar acesso
    (req as any).tenant = {
      organizationId: authReq.user.organizationId,
      userRole: authReq.user.role,
      userId: authReq.user.id
    };

    logger.debug('Tenant isolation applied', {
      userId: authReq.user.id,
      organizationId: authReq.user.organizationId,
      method: req.method,
      path: req.path
    });

    next();

  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para operações que precisam de validação de organização específica
 * Usado quando organization_id vem como parâmetro da rota
 */
export const validateOrganizationAccess = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { organizationId } = req.params;

    if (!authReq.user) {
      throw createError('Usuário não autenticado', 401);
    }

    // Verificar se o organization_id do parâmetro corresponde ao do usuário
    if (organizationId && organizationId !== authReq.user.organizationId) {
      // Apenas super_admin pode acessar outras organizações
      if (authReq.user.role !== 'super_admin') {
        throw createError('Acesso negado para esta organização', 403);
      }
    }

    next();

  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para validação de roles específicas
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        throw createError('Usuário não autenticado', 401);
      }

      if (!allowedRoles.includes(authReq.user.role)) {
        throw createError(`Acesso negado. Roles permitidas: ${allowedRoles.join(', ')}`, 403);
      }

      next();

    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para operações administrativas (apenas owners e admins)
 */
export const requireAdmin = requireRole(['owner', 'admin']);

/**
 * Middleware para operações de gestão (owners, admins e managers)
 */
export const requireManager = requireRole(['owner', 'admin', 'manager']);

/**
 * Wrapper para queries do Supabase que adiciona filtro de organização automaticamente
 */
export class TenantAwareSupabaseService {
  private supabaseService: any;

  constructor(supabaseService: any) {
    this.supabaseService = supabaseService;
  }

  /**
   * Cria query com filtro de organização automático
   */
  createTenantQuery(tableName: string, organizationId: string) {
    return this.supabaseService
      .getClient()
      .from(tableName)
      .eq('organization_id', organizationId);
  }

  /**
   * Select com filtro de tenant
   */
  select(tableName: string, organizationId: string, columns: string = '*') {
    return this.createTenantQuery(tableName, organizationId).select(columns);
  }

  /**
   * Insert com organization_id automático
   */
  insert(tableName: string, data: any, organizationId: string) {
    const dataWithOrg = Array.isArray(data)
      ? data.map(item => ({ ...item, organization_id: organizationId }))
      : { ...data, organization_id: organizationId };

    return this.supabaseService
      .getClient()
      .from(tableName)
      .insert(dataWithOrg);
  }

  /**
   * Update com filtro de tenant
   */
  update(tableName: string, data: any, organizationId: string) {
    return this.createTenantQuery(tableName, organizationId).update(data);
  }

  /**
   * Delete com filtro de tenant
   */
  delete(tableName: string, organizationId: string) {
    return this.createTenantQuery(tableName, organizationId).delete();
  }
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * Extrai organizationId da request autenticada
 */
export const getOrganizationFromRequest = (req: Request): string => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user?.organizationId) {
    throw createError('Organization ID não encontrado na request', 400);
  }

  return authReq.user.organizationId;
};

/**
 * Verifica se usuário tem acesso à organização específica
 */
export const hasOrganizationAccess = (req: Request, targetOrgId: string): boolean => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    return false;
  }

  // Super admin tem acesso a todas organizações
  if (authReq.user.role === 'super_admin') {
    return true;
  }

  // Usuário normal só tem acesso à sua própria organização
  return authReq.user.organizationId === targetOrgId;
};