import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==========================================
// SYSTEM METRICS
// ==========================================

export function useSystemMetrics() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['admin', 'system-metrics'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/admin/stats/system`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch system metrics');

      const data: ApiResponse<any> = await response.json();
      return data.data;
    },
    enabled: !!user && user.role === 'super_admin',
  });
}

// ==========================================
// ORGANIZATIONS
// ==========================================

export function useOrganizations(params?: {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  isActive?: boolean;
}) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['admin', 'organizations', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.search) queryParams.set('search', params.search);
      if (params?.tier) queryParams.set('tier', params.tier);
      if (params?.isActive !== undefined) queryParams.set('isActive', params.isActive.toString());

      const response = await fetch(
        `${API_URL}/api/admin/organizations?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch organizations');

      const data: PaginatedResponse<any> = await response.json();
      return data;
    },
    enabled: !!user && user.role === 'super_admin',
  });
}

export function useOrganization(organizationId?: string) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['admin', 'organization', organizationId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/api/admin/organizations/${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch organization');

      const data: ApiResponse<any> = await response.json();
      return data.data;
    },
    enabled: !!user && user.role === 'super_admin' && !!organizationId,
  });
}

export function useCreateOrganization() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orgData: {
      name: string;
      subscription_tier: 'free' | 'pro' | 'enterprise';
      is_active?: boolean;
    }) => {
      const response = await fetch(`${API_URL}/api/admin/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.accessToken}`,
        },
        body: JSON.stringify(orgData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create organization');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      toast.success('Organização criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateOrganization() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        name?: string;
        subscription_tier?: 'free' | 'pro' | 'enterprise';
        is_active?: boolean;
      };
    }) => {
      const response = await fetch(
        `${API_URL}/api/admin/organizations/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.accessToken}`,
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update organization');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organization', variables.id] });
      toast.success('Organização atualizada!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useToggleOrganizationStatus() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const endpoint = isActive ? 'activate' : 'deactivate';
      const response = await fetch(
        `${API_URL}/api/admin/organizations/${id}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to toggle organization status');

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organization', variables.id] });
      toast.success(
        variables.isActive
          ? 'Organização ativada!'
          : 'Organização desativada!'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ==========================================
// USERS
// ==========================================

export function useUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  organizationId?: string;
  role?: string;
  isActive?: boolean;
}) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.search) queryParams.set('search', params.search);
      if (params?.organizationId) queryParams.set('organizationId', params.organizationId);
      if (params?.role) queryParams.set('role', params.role);
      if (params?.isActive !== undefined) queryParams.set('isActive', params.isActive.toString());

      const response = await fetch(
        `${API_URL}/api/admin/users?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch users');

      const data: PaginatedResponse<any> = await response.json();
      return data;
    },
    enabled: !!user && user.role === 'super_admin',
  });
}

export function useChangeUserRole() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: 'user' | 'admin' | 'super_admin';
    }) => {
      const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/change-role`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.accessToken}`,
          },
          body: JSON.stringify({ role }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change user role');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Role do usuário alterado!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ==========================================
// TOKEN USAGE (TOKENÔMETRO)
// ==========================================

export function useTokenMetrics() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['admin', 'token-metrics'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/admin/tokens/metrics`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch token metrics');

      const data: ApiResponse<any> = await response.json();
      return data.data;
    },
    enabled: !!user && user.role === 'super_admin',
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useTokenUsageByOrganization(params?: {
  page?: number;
  limit?: number;
}) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['admin', 'token-usage-by-org', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());

      const response = await fetch(
        `${API_URL}/api/admin/tokens/by-organization?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch token usage by organization');

      const data: PaginatedResponse<any> = await response.json();
      return data;
    },
    enabled: !!user && user.role === 'super_admin',
  });
}

export function useTokenTrends(days: number = 30, organizationId?: string) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['admin', 'token-trends', days, organizationId],
    queryFn: async () => {
      const queryParams = new URLSearchParams({ days: days.toString() });
      if (organizationId) queryParams.set('organizationId', organizationId);

      const response = await fetch(
        `${API_URL}/api/admin/tokens/trends?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch token trends');

      const data: ApiResponse<any[]> = await response.json();
      return data.data;
    },
    enabled: !!user && user.role === 'super_admin',
  });
}

export function useTopTokenConsumers(limit: number = 10, type: 'organization' | 'user' = 'organization') {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['admin', 'top-token-consumers', limit, type],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        type,
        period: '30d'
      });

      const response = await fetch(
        `${API_URL}/api/admin/tokens/top-consumers?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch top consumers');

      const data: ApiResponse<any[]> = await response.json();
      return data.data;
    },
    enabled: !!user && user.role === 'super_admin',
  });
}

// ==========================================
// AUDIT LOGS
// ==========================================

export function useAuditLogs(params?: {
  page?: number;
  limit?: number;
  adminUserId?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());
      if (params?.adminUserId) queryParams.set('adminUserId', params.adminUserId);
      if (params?.resourceType) queryParams.set('resourceType', params.resourceType);
      if (params?.startDate) queryParams.set('startDate', params.startDate);
      if (params?.endDate) queryParams.set('endDate', params.endDate);

      const response = await fetch(
        `${API_URL}/api/admin/logs?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch audit logs');

      const data: PaginatedResponse<any> = await response.json();
      return data;
    },
    enabled: !!user && user.role === 'super_admin',
  });
}

export default {
  useSystemMetrics,
  useOrganizations,
  useOrganization,
  useCreateOrganization,
  useUpdateOrganization,
  useToggleOrganizationStatus,
  useUsers,
  useChangeUserRole,
  useTokenMetrics,
  useTokenUsageByOrganization,
  useTokenTrends,
  useTopTokenConsumers,
  useAuditLogs,
};