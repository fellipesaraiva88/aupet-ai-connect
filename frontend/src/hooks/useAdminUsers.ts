import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  organization_id: string;
  role_id: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: Record<string, any>;
  role?: {
    id: string;
    name: string;
    description: string;
    permissions: string[];
  };
  organization?: {
    id: string;
    name: string;
  };
}

export interface CreateUserData {
  email: string;
  full_name: string;
  phone?: string;
  role_id: string;
  organization_id: string;
  is_active?: boolean;
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  role_id?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export function useAdminUsers(organizationId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users (optionally filtered by organization)
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-users', organizationId],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          role:roles(id, name, description, permissions),
          organization:organizations(id, name)
        `)
        .order('created_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AdminUser[];
    },
  });

  // Create new user
  const createUser = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const { data, error } = await supabase
        .from('profiles')
        .insert([userData])
        .select(`
          *,
          role:roles(id, name, description, permissions),
          organization:organizations(id, name)
        `)
        .single();

      if (error) throw error;
      return data as AdminUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Usuário criado',
        description: 'O usuário foi criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update user
  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const { data: updatedUser, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          role:roles(id, name, description, permissions),
          organization:organizations(id, name)
        `)
        .single();

      if (error) throw error;
      return updatedUser as AdminUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Usuário atualizado',
        description: 'O usuário foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete user (soft delete by setting is_active to false)
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Usuário desativado',
        description: 'O usuário foi desativado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao desativar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Assign role to user
  const assignRole = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role_id: roleId })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Role atribuída',
        description: 'A role foi atribuída ao usuário com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atribuir role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Activate user
  const activateUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Usuário ativado',
        description: 'O usuário foi ativado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao ativar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    createUser: createUser.mutateAsync,
    updateUser: updateUser.mutateAsync,
    deleteUser: deleteUser.mutateAsync,
    assignRole: assignRole.mutateAsync,
    activateUser: activateUser.mutateAsync,
    isCreating: createUser.isPending,
    isUpdating: updateUser.isPending,
    isDeleting: deleteUser.isPending,
    isAssigning: assignRole.isPending,
    isActivating: activateUser.isPending,
  };
}
