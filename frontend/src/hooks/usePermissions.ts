import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Permission {
  resource: string;
  action: 'read' | 'create' | 'update' | 'delete' | '*';
}

export function usePermissions() {
  const { user } = useAuth();

  // Fetch user's role and permissions
  const {
    data: userPermissions,
    isLoading,
  } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          role_id,
          role:roles(
            id,
            name,
            permissions
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!userPermissions?.role?.permissions) return false;

    const permissions = userPermissions.role.permissions as string[];

    // Check for wildcard (super admin)
    if (permissions.includes('*')) return true;

    // Check for exact permission
    if (permissions.includes(permission)) return true;

    // Check for namespace wildcard (e.g., "dashboard.*")
    const [namespace] = permission.split('.');
    if (permissions.includes(`${namespace}.*`)) return true;

    return false;
  };

  // Check if user has all specified permissions
  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => hasPermission(permission));
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => hasPermission(permission));
  };

  // Check if user has a specific role
  const hasRole = (roleName: string): boolean => {
    return userPermissions?.role?.name === roleName;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(roleName => hasRole(roleName));
  };

  // Check if user is super admin
  const isSuperAdmin = (): boolean => {
    return hasRole('super_admin') || hasPermission('*');
  };

  // Check if user is admin (admin or super_admin)
  const isAdmin = (): boolean => {
    return hasAnyRole(['admin', 'super_admin']);
  };

  // Get all user permissions
  const getAllPermissions = (): string[] => {
    return (userPermissions?.role?.permissions as string[]) || [];
  };

  // Get user role
  const getRole = () => {
    return userPermissions?.role;
  };

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    isAdmin,
    getAllPermissions,
    getRole,
    isLoading,
    permissions: getAllPermissions(),
    role: getRole(),
  };
}

// HOC for protecting components based on permissions
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: string
) {
  return function ProtectedComponent(props: P) {
    const { hasPermission } = usePermissions();

    if (!hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-600">
              Você não tem permissão para acessar este recurso.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// HOC for protecting components based on role
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: string
) {
  return function ProtectedComponent(props: P) {
    const { hasRole } = usePermissions();

    if (!hasRole(requiredRole)) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-600">
              Você não tem a role necessária para acessar este recurso.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
