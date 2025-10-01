import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../../services/supabase';
import { logger } from '../../utils/logger';

const router = Router();

// Validation schemas
const permissionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  resource: z.string().min(1),
  actions: z.array(z.string()),
});

const rolePermissionSchema = z.object({
  role: z.enum(['admin', 'manager', 'user']),
  permission_ids: z.array(z.string().uuid()),
});

// GET /api/admin/permissions - List all permissions
router.get('/', async (req: Request, res: Response) => {
  try {
    const { resource } = req.query;

    let query = supabase
      .from('permissions')
      .select('*')
      .order('resource', { ascending: true });

    if (resource) {
      query = query.eq('resource', resource);
    }

    const { data: permissions, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: permissions || []
    });
  } catch (error: any) {
    logger.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions'
    });
  }
});

// GET /api/admin/permissions/roles/:role - Get permissions for a role
router.get('/roles/:role', async (req: Request, res: Response) => {
  try {
    const { role } = req.params;

    const { data: rolePermissions, error } = await supabase
      .from('role_permissions')
      .select(`
        *,
        permissions (*)
      `)
      .eq('role', role);

    if (error) throw error;

    res.json({
      success: true,
      data: rolePermissions || []
    });
  } catch (error: any) {
    logger.error('Error fetching role permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch role permissions'
    });
  }
});

// POST /api/admin/permissions - Create new permission
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = permissionSchema.parse(req.body);

    const { data: permission, error } = await supabase
      .from('permissions')
      .insert(validatedData)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: (req as any).user?.id,
      action: 'permission.create',
      resource_type: 'permission',
      resource_id: permission.id,
      details: validatedData,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      data: permission,
      message: 'Permission created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating permission:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create permission'
    });
  }
});

// PUT /api/admin/permissions/:id - Update permission
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = permissionSchema.partial().parse(req.body);

    const { data: permission, error } = await supabase
      .from('permissions')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: (req as any).user?.id,
      action: 'permission.update',
      resource_type: 'permission',
      resource_id: id,
      details: { changes: validatedData },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      success: true,
      data: permission,
      message: 'Permission updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating permission:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update permission'
    });
  }
});

// DELETE /api/admin/permissions/:id - Delete permission
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: (req as any).user?.id,
      action: 'permission.delete',
      resource_type: 'permission',
      resource_id: id,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Permission deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete permission'
    });
  }
});

// POST /api/admin/permissions/roles - Assign permissions to role
router.post('/roles', async (req: Request, res: Response) => {
  try {
    const { role, permission_ids } = rolePermissionSchema.parse(req.body);

    // Remove existing permissions for role
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role', role);

    // Insert new permissions
    const insertData = permission_ids.map(permission_id => ({
      role,
      permission_id
    }));

    const { error } = await supabase
      .from('role_permissions')
      .insert(insertData);

    if (error) throw error;

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: (req as any).user?.id,
      action: 'role_permissions.update',
      resource_type: 'role',
      details: { role, permission_ids },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Role permissions updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating role permissions:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update role permissions'
    });
  }
});

// GET /api/admin/permissions/check - Check if user has permission
router.get('/check', async (req: Request, res: Response) => {
  try {
    const { user_id, resource, action } = req.query;

    if (!user_id || !resource || !action) {
      return res.status(400).json({
        success: false,
        error: 'user_id, resource, and action are required'
      });
    }

    // Get user's role
    const { data: user } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user's role has the permission
    const { data: rolePermissions } = await supabase
      .from('role_permissions')
      .select(`
        permissions!inner (
          resource,
          actions
        )
      `)
      .eq('role', user.role)
      .eq('permissions.resource', resource);

    const hasPermission = rolePermissions?.some(rp =>
      (rp as any).permissions.actions.includes(action)
    );

    res.json({
      success: true,
      data: {
        has_permission: hasPermission || false,
        user_role: user.role
      }
    });
  } catch (error: any) {
    logger.error('Error checking permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check permission'
    });
  }
});

export default router;
