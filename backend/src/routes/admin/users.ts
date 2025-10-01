import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../../middleware/errorHandler';
import { requirePermission, requireAdmin, canManageUser } from '../../middleware/permissions';
import { SupabaseService } from '../../services/supabase';
import { logger } from '../../utils/logger';
import { ApiResponse, PaginatedResponse } from '../../types';

const router = Router();
let supabaseService: SupabaseService;

const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
};

// =====================================================
// GET /admin/users - List all users with filters
// =====================================================
router.get('/', requirePermission('users.read'), asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, search, role, status, organizationId } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let query = getSupabaseService().supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        organization_id,
        role_id,
        is_active,
        last_login,
        created_at,
        updated_at,
        roles (
          id,
          name,
          description
        ),
        organizations (
          id,
          name
        )
      `, { count: 'exact' });

    // Apply filters
    if (req.user?.role !== 'super_admin') {
      // Non-super admins can only see users from their organization
      query = query.eq('organization_id', req.user?.organizationId);
    } else if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('roles.name', role);
    }

    if (status) {
      query = query.eq('is_active', status === 'active');
    }

    // Apply pagination
    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    const response: PaginatedResponse<any> = {
      success: true,
      data: users || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error listing users:', error);
    throw createError('Erro ao listar usuários', 500);
  }
}));

// =====================================================
// GET /admin/users/:id - Get user details
// =====================================================
router.get('/:id', requirePermission('users.read'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data: user, error } = await getSupabaseService().supabase
      .from('profiles')
      .select(`
        *,
        roles (
          id,
          name,
          description,
          permissions
        ),
        organizations (
          id,
          name,
          status,
          subscription_plan
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!user) throw createError('Usuário não encontrado', 404);

    // Check if requesting user can view this user
    if (req.user?.role !== 'super_admin' && user.organization_id !== req.user?.organizationId) {
      throw createError('Acesso negado', 403);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error getting user:', error);
    throw error;
  }
}));

// =====================================================
// POST /admin/users - Create new user
// =====================================================
router.post('/', requirePermission('users.create'), asyncHandler(async (req: Request, res: Response) => {
  const { email, full_name, role_id, organization_id, metadata } = req.body;

  try {
    // Validate required fields
    if (!email || !role_id) {
      throw createError('Email e role são obrigatórios', 400);
    }

    // Non-super admins can only create users in their organization
    const targetOrgId = req.user?.role === 'super_admin' && organization_id
      ? organization_id
      : req.user?.organizationId;

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await getSupabaseService().supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name,
        organization_id: targetOrgId,
        role_id
      }
    });

    if (authError) throw authError;

    // Create profile
    const { data: profile, error: profileError } = await getSupabaseService().supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        organization_id: targetOrgId,
        role_id,
        is_active: true,
        created_by: req.user?.id,
        metadata: metadata || {}
      })
      .select(`
        *,
        roles (name, description),
        organizations (name)
      `)
      .single();

    if (profileError) throw profileError;

    logger.info(`User created: ${email} by ${req.user?.email}`);

    const response: ApiResponse<any> = {
      success: true,
      data: profile,
      message: 'Usuário criado com sucesso! 🎉',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error: any) {
    logger.error('Error creating user:', error);
    throw createError(error.message || 'Erro ao criar usuário', 500);
  }
}));

// =====================================================
// PUT /admin/users/:id - Update user
// =====================================================
router.put('/:id', requirePermission('users.update'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { full_name, role_id, is_active, metadata } = req.body;

  try {
    // Get target user
    const { data: targetUser, error: fetchError } = await getSupabaseService().supabase
      .from('profiles')
      .select('id, role_id, organization_id, roles(name)')
      .eq('id', id)
      .single();

    if (fetchError || !targetUser) {
      throw createError('Usuário não encontrado', 404);
    }

    // Check if requesting user can manage this user
    const canManage = await canManageUser(
      {
        id: req.user!.id,
        role: req.user!.role,
        organizationId: req.user!.organizationId
      },
      {
        id: targetUser.id,
        role: (targetUser as any).roles?.name || 'user',
        organizationId: targetUser.organization_id
      }
    );

    if (!canManage) {
      throw createError('Você não tem permissão para gerenciar este usuário', 403);
    }

    // Update profile
    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role_id !== undefined) updateData.role_id = role_id;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (metadata !== undefined) updateData.metadata = metadata;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedUser, error: updateError } = await getSupabaseService().supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        roles (name, description),
        organizations (name)
      `)
      .single();

    if (updateError) throw updateError;

    logger.info(`User updated: ${id} by ${req.user?.email}`);

    const response: ApiResponse<any> = {
      success: true,
      data: updatedUser,
      message: 'Usuário atualizado com sucesso! ✨',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error updating user:', error);
    throw error;
  }
}));

// =====================================================
// DELETE /admin/users/:id - Delete user (soft delete)
// =====================================================
router.delete('/:id', requirePermission('users.delete'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Get target user
    const { data: targetUser, error: fetchError } = await getSupabaseService().supabase
      .from('profiles')
      .select('id, role_id, organization_id, roles(name)')
      .eq('id', id)
      .single();

    if (fetchError || !targetUser) {
      throw createError('Usuário não encontrado', 404);
    }

    // Check if requesting user can manage this user
    const canManage = await canManageUser(
      {
        id: req.user!.id,
        role: req.user!.role,
        organizationId: req.user!.organizationId
      },
      {
        id: targetUser.id,
        role: (targetUser as any).roles?.name || 'user',
        organizationId: targetUser.organization_id
      }
    );

    if (!canManage) {
      throw createError('Você não tem permissão para excluir este usuário', 403);
    }

    // Soft delete - deactivate user
    const { error: updateError } = await getSupabaseService().supabase
      .from('profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    logger.info(`User deactivated: ${id} by ${req.user?.email}`);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Usuário desativado com sucesso! 🗑️',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error deleting user:', error);
    throw error;
  }
}));

// =====================================================
// POST /admin/users/:id/reset-password - Reset user password
// =====================================================
router.post('/:id/reset-password', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Get user email
    const { data: user, error: fetchError } = await getSupabaseService().supabase
      .from('profiles')
      .select('email, organization_id')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      throw createError('Usuário não encontrado', 404);
    }

    // Check organization access
    if (req.user?.role !== 'super_admin' && user.organization_id !== req.user?.organizationId) {
      throw createError('Acesso negado', 403);
    }

    // Send password reset email
    const { error: resetError } = await getSupabaseService().supabase.auth.admin.generateLink({
      type: 'recovery',
      email: user.email
    });

    if (resetError) throw resetError;

    logger.info(`Password reset sent for user: ${user.email} by ${req.user?.email}`);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Email de recuperação enviado com sucesso! 📧',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error resetting password:', error);
    throw createError('Erro ao enviar email de recuperação', 500);
  }
}));

export default router;
