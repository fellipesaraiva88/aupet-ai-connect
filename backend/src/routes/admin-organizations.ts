import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { requireSuperAdmin, adminAuditLogger } from '../middleware/admin-auth';
import AdminService from '../services/admin';
import { logger } from '../utils/logger';
import { ApiResponse, PaginatedResponse } from '../types';

const router = Router();

// Apply super admin protection and audit logging to all routes
router.use(requireSuperAdmin);
router.use(adminAuditLogger);

// Validation schemas
const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  subscription_tier: z.enum(['free', 'pro', 'enterprise']).default('free'),
  is_active: z.boolean().default(true).optional()
});

const updateOrganizationSchema = z.object({
  name: z.string().min(2).optional(),
  subscription_tier: z.enum(['free', 'pro', 'enterprise']).optional(),
  is_active: z.boolean().optional()
});

const listOrganizationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  tier: z.enum(['free', 'pro', 'enterprise']).optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.string().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * GET /api/admin/organizations
 * List all organizations with filters and pagination
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const params = listOrganizationsSchema.parse(req.query);

    const adminService = new AdminService();
    const result = await adminService.listOrganizations(params);

    const response: PaginatedResponse<any> = {
      success: true,
      data: result.data,
      message: 'Organizations retrieved successfully',
      timestamp: new Date().toISOString(),
      pagination: result.pagination
    };

    res.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw createError('Parâmetros de busca inválidos', 400);
    }
    logger.error('Error listing organizations:', error);
    throw createError('Erro ao listar organizações', 500);
  }
}));

/**
 * GET /api/admin/organizations/:id
 * Get specific organization details
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createError('ID da organização é obrigatório', 400);
    }

    const adminService = new AdminService();
    const organization = await adminService.getOrganization(id);

    if (!organization) {
      throw createError('Organização não encontrada', 404);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: organization,
      message: 'Organization details retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting organization:', error);
    if (error.status === 404) {
      throw error;
    }
    throw createError('Erro ao obter organização', 500);
  }
}));

/**
 * POST /api/admin/organizations
 * Create new organization
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const parsed = createOrganizationSchema.parse(req.body);

    // Ensure required fields for createOrganization
    const orgData = {
      name: parsed.name!,
      subscription_tier: parsed.subscription_tier!,
      is_active: parsed.is_active
    };

    const adminService = new AdminService();
    const organization = await adminService.createOrganization(orgData);

    logger.info('Organization created by admin', {
      organizationId: organization.id,
      organizationName: organization.name
    });

    const response: ApiResponse<any> = {
      success: true,
      data: organization,
      message: 'Organização criada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw createError('Dados de organização inválidos', 400);
    }

    // Check for unique constraint violation (duplicate slug)
    if (error.code === '23505') {
      throw createError('Já existe uma organização com este nome', 409);
    }

    logger.error('Error creating organization:', error);
    throw createError('Erro ao criar organização', 500);
  }
}));

/**
 * PUT /api/admin/organizations/:id
 * Update organization
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = updateOrganizationSchema.parse(req.body);

    if (!id) {
      throw createError('ID da organização é obrigatório', 400);
    }

    if (Object.keys(updates).length === 0) {
      throw createError('Nenhuma atualização fornecida', 400);
    }

    const adminService = new AdminService();
    const organization = await adminService.updateOrganization(id, updates);

    logger.info('Organization updated by admin', {
      organizationId: id,
      updates
    });

    const response: ApiResponse<any> = {
      success: true,
      data: organization,
      message: 'Organização atualizada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw createError('Dados de atualização inválidos', 400);
    }

    logger.error('Error updating organization:', error);
    throw createError('Erro ao atualizar organização', 500);
  }
}));

/**
 * POST /api/admin/organizations/:id/activate
 * Activate organization
 */
router.post('/:id/activate', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createError('ID da organização é obrigatório', 400);
    }

    const adminService = new AdminService();
    const organization = await adminService.toggleOrganizationStatus(id, true);

    logger.info('Organization activated by admin', { organizationId: id });

    const response: ApiResponse<any> = {
      success: true,
      data: organization,
      message: 'Organização ativada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error activating organization:', error);
    throw createError('Erro ao ativar organização', 500);
  }
}));

/**
 * POST /api/admin/organizations/:id/deactivate
 * Deactivate organization
 */
router.post('/:id/deactivate', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createError('ID da organização é obrigatório', 400);
    }

    const adminService = new AdminService();
    const organization = await adminService.toggleOrganizationStatus(id, false);

    logger.info('Organization deactivated by admin', { organizationId: id });

    const response: ApiResponse<any> = {
      success: true,
      data: organization,
      message: 'Organização desativada com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error deactivating organization:', error);
    throw createError('Erro ao desativar organização', 500);
  }
}));

/**
 * GET /api/admin/organizations/:id/stats
 * Get organization statistics
 */
router.get('/:id/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createError('ID da organização é obrigatório', 400);
    }

    const adminService = new AdminService();
    const organization = await adminService.getOrganization(id);

    if (!organization) {
      throw createError('Organização não encontrada', 404);
    }

    // Extract stats from organization data
    const stats = {
      organization_id: organization.id,
      organization_name: organization.name,
      subscription_tier: organization.subscription_tier,
      is_active: organization.is_active,
      user_count: organization.user_count,
      whatsapp_instances: organization.whatsapp_instances_count,
      conversations: organization.conversations_count,
      messages: organization.messages_count,
      customers: organization.customers_count,
      pets: organization.pets_count,
      appointments: organization.appointments_count,
      activity_score: organization.activity_score,
      last_activity: organization.last_activity_at,
      created_at: organization.created_at
    };

    const response: ApiResponse<any> = {
      success: true,
      data: stats,
      message: 'Organization statistics retrieved successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting organization stats:', error);
    if (error.status === 404) {
      throw error;
    }
    throw createError('Erro ao obter estatísticas da organização', 500);
  }
}));

export default router;