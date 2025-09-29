import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { requireSuperAdmin, adminAuditLogger, preventSelfElevation } from '../middleware/admin-auth';
import AdminService from '../services/admin';
import { logger } from '../utils/logger';
import { ApiResponse, PaginatedResponse } from '../types';

const router = Router();

// Apply super admin protection and audit logging to all routes
router.use(requireSuperAdmin);
router.use(adminAuditLogger);

// Validation schemas
const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  role: z.enum(['user', 'admin', 'super_admin']).optional(),
  isActive: z.coerce.boolean().optional()
});

const updateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin', 'super_admin'])
});

const moveUserSchema = z.object({
  organization_id: z.string().uuid('ID de organização inválido')
});

/**
 * GET /api/admin/users
 * List all users across all organizations
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const params = listUsersSchema.parse(req.query);

    const adminService = new AdminService();
    const result = await adminService.listUsers(params);

    const response: PaginatedResponse<any> = {
      success: true,
      data: result.data,
      message: 'Users retrieved successfully',
      timestamp: new Date().toISOString(),
      pagination: result.pagination
    };

    res.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw createError('Parâmetros de busca inválidos', 400);
    }
    logger.error('Error listing users:', error);
    throw createError('Erro ao listar usuários', 500);
  }
}));

/**
 * GET /api/admin/users/:id
 * Get specific user details
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createError('ID do usuário é obrigatório', 400);
    }

    const adminService = new AdminService();
    const user = await adminService.getUser(id);

    if (!user) {
      throw createError('Usuário não encontrado', 404);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: user,
      message: 'User details retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting user:', error);
    if (error.status === 404) {
      throw error;
    }
    throw createError('Erro ao obter usuário', 500);
  }
}));

/**
 * POST /api/admin/users/:id/change-role
 * Change user role
 */
router.post('/:id/change-role', preventSelfElevation, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = updateUserRoleSchema.parse(req.body);

    if (!id) {
      throw createError('ID do usuário é obrigatório', 400);
    }

    const adminService = new AdminService();
    const user = await adminService.updateUserRole(id, role);

    logger.info('User role changed by admin', {
      userId: id,
      newRole: role
    });

    const response: ApiResponse<any> = {
      success: true,
      data: user,
      message: `Role do usuário alterado para ${role} com sucesso`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw createError('Role inválido', 400);
    }

    if (error.status === 403) {
      throw error; // Self-elevation prevention
    }

    logger.error('Error changing user role:', error);
    throw createError('Erro ao alterar role do usuário', 500);
  }
}));

/**
 * POST /api/admin/users/:id/change-organization
 * Move user to different organization
 */
router.post('/:id/change-organization', preventSelfElevation, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organization_id } = moveUserSchema.parse(req.body);

    if (!id) {
      throw createError('ID do usuário é obrigatório', 400);
    }

    const adminService = new AdminService();
    const user = await adminService.moveUserToOrganization(id, organization_id);

    logger.info('User moved to new organization by admin', {
      userId: id,
      newOrganizationId: organization_id
    });

    const response: ApiResponse<any> = {
      success: true,
      data: user,
      message: 'Usuário movido para nova organização com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw createError('ID de organização inválido', 400);
    }

    if (error.status === 403) {
      throw error; // Self-organization change prevention
    }

    // Check for foreign key constraint (organization doesn't exist)
    if (error.code === '23503') {
      throw createError('Organização de destino não encontrada', 404);
    }

    logger.error('Error moving user to organization:', error);
    throw createError('Erro ao mover usuário para organização', 500);
  }
}));

/**
 * POST /api/admin/users/:id/activate
 * Activate user
 */
router.post('/:id/activate', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createError('ID do usuário é obrigatório', 400);
    }

    const adminService = new AdminService();
    const user = await adminService.toggleUserStatus(id, true);

    logger.info('User activated by admin', { userId: id });

    const response: ApiResponse<any> = {
      success: true,
      data: user,
      message: 'Usuário ativado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error activating user:', error);
    throw createError('Erro ao ativar usuário', 500);
  }
}));

/**
 * POST /api/admin/users/:id/deactivate
 * Deactivate user
 */
router.post('/:id/deactivate', preventSelfElevation, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createError('ID do usuário é obrigatório', 400);
    }

    const adminService = new AdminService();
    const user = await adminService.toggleUserStatus(id, false);

    logger.info('User deactivated by admin', { userId: id });

    const response: ApiResponse<any> = {
      success: true,
      data: user,
      message: 'Usuário desativado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    if (error.status === 403) {
      throw error; // Self-deactivation prevention
    }

    logger.error('Error deactivating user:', error);
    throw createError('Erro ao desativar usuário', 500);
  }
}));

/**
 * GET /api/admin/users/by-organization/:organizationId
 * Get all users in a specific organization
 */
router.get('/by-organization/:organizationId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!organizationId) {
      throw createError('ID da organização é obrigatório', 400);
    }

    const adminService = new AdminService();
    const result = await adminService.listUsers({
      organizationId,
      page,
      limit
    });

    const response: PaginatedResponse<any> = {
      success: true,
      data: result.data,
      message: 'Organization users retrieved successfully',
      timestamp: new Date().toISOString(),
      pagination: result.pagination
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting organization users:', error);
    throw createError('Erro ao obter usuários da organização', 500);
  }
}));

/**
 * GET /api/admin/users/stats/overview
 * Get user statistics overview
 */
router.get('/stats/overview', asyncHandler(async (req: Request, res: Response) => {
  try {
    const adminService = new AdminService();

    // Get all users without pagination to calculate stats
    const allUsers = await adminService.listUsers({ limit: 10000 });

    const stats = {
      total_users: allUsers.data.length,
      active_users: allUsers.data.filter(u => u.is_active).length,
      inactive_users: allUsers.data.filter(u => !u.is_active).length,
      users_by_role: {
        super_admin: allUsers.data.filter(u => u.role === 'super_admin').length,
        admin: allUsers.data.filter(u => u.role === 'admin').length,
        user: allUsers.data.filter(u => u.role === 'user').length
      },
      users_by_tier: {
        free: allUsers.data.filter(u => u.subscription_tier === 'free').length,
        pro: allUsers.data.filter(u => u.subscription_tier === 'pro').length,
        enterprise: allUsers.data.filter(u => u.subscription_tier === 'enterprise').length
      }
    };

    const response: ApiResponse<any> = {
      success: true,
      data: stats,
      message: 'User statistics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting user stats:', error);
    throw createError('Erro ao obter estatísticas de usuários', 500);
  }
}));

export default router;