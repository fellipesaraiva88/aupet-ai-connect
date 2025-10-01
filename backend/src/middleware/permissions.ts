import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';
import { SupabaseService } from '../services/supabase';

// Permission types
export type Permission =
  | 'dashboard.read' | 'dashboard.write'
  | 'whatsapp.read' | 'whatsapp.manage'
  | 'customers.create' | 'customers.read' | 'customers.update' | 'customers.delete'
  | 'pets.create' | 'pets.read' | 'pets.update' | 'pets.delete'
  | 'appointments.create' | 'appointments.read' | 'appointments.update' | 'appointments.delete'
  | 'conversations.read' | 'conversations.write'
  | 'settings.read' | 'settings.write'
  | 'users.create' | 'users.read' | 'users.update' | 'users.delete'
  | 'organizations.create' | 'organizations.read' | 'organizations.update' | 'organizations.delete'
  | 'roles.create' | 'roles.read' | 'roles.update' | 'roles.delete'
  | 'audit.read'
  | '*'; // Wildcard for super_admin

// Role definitions with permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: ['*'],
  admin: [
    'dashboard.read', 'dashboard.write',
    'whatsapp.read', 'whatsapp.manage',
    'customers.create', 'customers.read', 'customers.update', 'customers.delete',
    'pets.create', 'pets.read', 'pets.update', 'pets.delete',
    'appointments.create', 'appointments.read', 'appointments.update', 'appointments.delete',
    'conversations.read', 'conversations.write',
    'settings.read', 'settings.write',
    'users.create', 'users.read', 'users.update',
    'audit.read'
  ],
  manager: [
    'dashboard.read',
    'whatsapp.read',
    'customers.create', 'customers.read', 'customers.update',
    'pets.create', 'pets.read', 'pets.update',
    'appointments.create', 'appointments.read', 'appointments.update',
    'conversations.read', 'conversations.write',
    'settings.read'
  ],
  user: [
    'dashboard.read',
    'conversations.read',
    'customers.read',
    'pets.read',
    'appointments.read'
  ]
};

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];

  // Check for wildcard permission
  if (permissions.includes('*')) {
    return true;
  }

  // Check for exact match
  if (permissions.includes(permission)) {
    return true;
  }

  // Check for namespace wildcard (e.g., 'customers.*' matches 'customers.read')
  const namespace = permission.split('.')[0];
  const wildcardPermission = `${namespace}.*` as Permission;
  if (permissions.includes(wildcardPermission)) {
    return true;
  }

  return false;
}

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw createError('Usuário não autenticado', 401);
      }

      const userRole = req.user.role || 'user';

      // Check if role has permission
      if (!roleHasPermission(userRole, permission)) {
        logger.warn(`Permission denied: ${req.user.email} (${userRole}) tried to access ${permission}`);
        throw createError(`Permissão insuficiente: ${permission}`, 403);
      }

      logger.info(`Permission granted: ${req.user.email} (${userRole}) -> ${permission}`);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has any of the required permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw createError('Usuário não autenticado', 401);
      }

      const userRole = req.user.role || 'user';

      // Check if role has any of the permissions
      const hasAnyPermission = permissions.some(permission =>
        roleHasPermission(userRole, permission)
      );

      if (!hasAnyPermission) {
        logger.warn(`Permission denied: ${req.user.email} (${userRole}) needs one of: ${permissions.join(', ')}`);
        throw createError('Permissão insuficiente', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has all required permissions
 */
export const requireAllPermissions = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw createError('Usuário não autenticado', 401);
      }

      const userRole = req.user.role || 'user';

      // Check if role has all permissions
      const hasAllPermissions = permissions.every(permission =>
        roleHasPermission(userRole, permission)
      );

      if (!hasAllPermissions) {
        logger.warn(`Permission denied: ${req.user.email} (${userRole}) needs all: ${permissions.join(', ')}`);
        throw createError('Permissão insuficiente', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is super admin
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw createError('Usuário não autenticado', 401);
    }

    if (req.user.role !== 'super_admin') {
      logger.warn(`Super admin required: ${req.user.email} (${req.user.role}) tried to access admin route`);
      throw createError('Apenas Super Administradores podem acessar este recurso', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is admin or super admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw createError('Usuário não autenticado', 401);
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    if (!isAdmin) {
      logger.warn(`Admin required: ${req.user.email} (${req.user.role}) tried to access admin route`);
      throw createError('Apenas Administradores podem acessar este recurso', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user can manage another user (e.g., for user CRUD operations)
 */
export const canManageUser = async (
  requestingUser: { id: string; role: string; organizationId: string },
  targetUser: { id: string; role: string; organizationId: string }
): Promise<boolean> => {
  // Super admin can manage anyone
  if (requestingUser.role === 'super_admin') {
    return true;
  }

  // Can't manage users from different organizations
  if (requestingUser.organizationId !== targetUser.organizationId) {
    return false;
  }

  // Admin can manage users within their organization (except super_admins)
  if (requestingUser.role === 'admin' && targetUser.role !== 'super_admin') {
    return true;
  }

  // Users can only manage themselves
  if (requestingUser.id === targetUser.id) {
    return true;
  }

  return false;
};

/**
 * Get user permissions from database
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const supabase = new SupabaseService();
    const { data, error } = await supabase.supabase
      .from('profiles')
      .select(`
        role_id,
        roles!inner (
          name,
          permissions
        )
      `)
      .eq('id', userId)
      .single();

    if (error || !data) {
      logger.error('Error fetching user permissions:', error);
      return ROLE_PERMISSIONS.user; // Default to user permissions
    }

    const roleName = (data as any).roles?.name || 'user';
    const permissions = (data as any).roles?.permissions || [];

    // Return permissions from database if available, otherwise use default
    return Array.isArray(permissions) ? permissions : ROLE_PERMISSIONS[roleName] || ROLE_PERMISSIONS.user;
  } catch (error) {
    logger.error('Error in getUserPermissions:', error);
    return ROLE_PERMISSIONS.user;
  }
}
