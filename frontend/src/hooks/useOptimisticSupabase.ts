import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOptimisticUpdates } from "@/stores/dataStore";
import { useNotifications } from "@/stores/uiStore";
import type { Database } from "@/integrations/supabase/types";

// Type definitions
type Appointment = Database['public']['Tables']['appointments']['Row'];
type Pet = Database['public']['Tables']['pets']['Row'];
type WhatsAppContact = Database['public']['Tables']['whatsapp_contacts']['Row'];
type DashboardStats = Database['public']['Views']['dashboard_stats_view']['Row'];

interface OptimisticQueryOptions<T> {
  queryKey: (string | number)[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  retry?: number;
  select?: (data: T) => any;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface OptimisticMutationOptions<T, V> {
  mutationFn: (variables: V) => Promise<T>;
  onMutate?: (variables: V) => Promise<any> | any;
  onSuccess?: (data: T, variables: V, context?: any) => void;
  onError?: (error: Error, variables: V, context?: any) => void;
  onSettled?: (data: T | undefined, error: Error | null, variables: V, context?: any) => void;
}

// Enhanced query hook with optimistic updates integration
export function useOptimisticQuery<T>(options: OptimisticQueryOptions<T>) {
  const { addUpdate, removeUpdate, getUpdate } = useOptimisticUpdates();
  const notifications = useNotifications();

  const queryKeyString = JSON.stringify(options.queryKey);
  const optimisticData = getUpdate(queryKeyString);

  const query = useQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    enabled: options.enabled,
    staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes
    retry: options.retry ?? 3,
    select: options.select,
    onSuccess: (data) => {
      // Clear optimistic update when real data arrives
      removeUpdate(queryKeyString);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      // Clear optimistic update on error
      removeUpdate(queryKeyString);
      notifications.error('Data fetch failed', error.message);
      options.onError?.(error);
    }
  });

  // Return optimistic data if available, otherwise query data
  return {
    ...query,
    data: optimisticData ?? query.data,
    isOptimistic: !!optimisticData,
  };
}

// Enhanced mutation hook with automatic optimistic updates
export function useOptimisticMutation<T, V>(
  options: OptimisticMutationOptions<T, V>
) {
  const queryClient = useQueryClient();
  const { addUpdate, removeUpdate } = useOptimisticUpdates();
  const notifications = useNotifications();

  return useMutation({
    mutationFn: options.mutationFn,
    onMutate: async (variables) => {
      const context = await options.onMutate?.(variables);

      return { ...context, timestamp: Date.now() };
    },
    onSuccess: (data, variables, context) => {
      // Remove optimistic updates related to this mutation
      if (context?.optimisticKey) {
        removeUpdate(context.optimisticKey);
      }

      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }

      // Remove optimistic updates
      if (context?.optimisticKey) {
        removeUpdate(context.optimisticKey);
      }

      notifications.error('Operation failed', error.message);
      options.onError?.(error, variables, context);
    },
    onSettled: options.onSettled,
  });
}

// Dashboard Stats with optimistic updates
export function useOptimisticDashboardStats(organizationId?: string) {
  return useOptimisticQuery({
    queryKey: ['dashboard-stats', organizationId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('dashboard_stats_view')
          .select('*')
          .eq('organization_id', organizationId || 'default')
          .single();

        if (error) throw error;
        return data as DashboardStats;
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Return fallback data instead of throwing
        return {
          conversations_today: 0,
          daily_appointments: 0,
          response_rate_percent: 0,
          daily_revenue: 0,
          avg_response_time: 0,
          active_conversations: 0,
          pending_messages: 0,
          ai_accuracy: 0
        } as DashboardStats;
      }
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Optimistic Pet Creation
export function useOptimisticCreatePet() {
  const queryClient = useQueryClient();

  return useOptimisticMutation({
    mutationFn: async (pet: Database['public']['Tables']['pets']['Insert']) => {
      const { data, error } = await supabase
        .from('pets')
        .insert(pet)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newPet) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['pets'] });

      // Snapshot previous value
      const previousPets = queryClient.getQueryData(['pets']);

      // Optimistically update
      const optimisticPet = {
        ...newPet,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      };

      queryClient.setQueryData(['pets'], (old: Pet[] | undefined) => [
        optimisticPet,
        ...(old || [])
      ] as Pet[]);

      return { previousPets, optimisticPet };
    },
    onError: (err, newPet, context) => {
      if (context?.previousPets) {
        queryClient.setQueryData(['pets'], context.previousPets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// Optimistic Customer Update
export function useOptimisticUpdateCustomer() {
  const queryClient = useQueryClient();

  return useOptimisticMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: Database['public']['Tables']['whatsapp_contacts']['Update']
    }) => {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['customers'] });

      const previousCustomers = queryClient.getQueryData(['customers']);

      queryClient.setQueryData(['customers'], (old: WhatsAppContact[] | undefined) => {
        if (!old) return old;

        return old.map(customer =>
          customer.id === id
            ? { ...customer, ...updates, updated_at: new Date().toISOString() }
            : customer
        );
      });

      return { previousCustomers };
    },
    onError: (err, variables, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(['customers'], context.previousCustomers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Optimistic Appointment Update
export function useOptimisticUpdateAppointment() {
  const queryClient = useQueryClient();

  return useOptimisticMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: Database['public']['Tables']['appointments']['Update']
    }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['appointments'] });

      const previousAppointments = queryClient.getQueryData(['appointments']);

      queryClient.setQueryData(['appointments'], (old: Appointment[] | undefined) => {
        if (!old) return old;

        return old.map(appointment =>
          appointment.id === id
            ? { ...appointment, ...updates, updated_at: new Date().toISOString() }
            : appointment
        );
      });

      return { previousAppointments };
    },
    onError: (err, variables, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData(['appointments'], context.previousAppointments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// Bulk operations with optimistic updates
export function useOptimisticBulkOperation<T>() {
  const queryClient = useQueryClient();
  const { addUpdate, removeUpdate } = useOptimisticUpdates();

  return useMutation({
    mutationFn: async (operations: Array<() => Promise<T>>) => {
      const results = await Promise.allSettled(operations.map(op => op()));

      const fulfilled = results
        .filter((result): result is PromiseFulfilledResult<T> => result.status === 'fulfilled')
        .map(result => result.value);

      const rejected = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);

      if (rejected.length > 0) {
        throw new Error(`${rejected.length} operations failed: ${rejected[0].message}`);
      }

      return fulfilled;
    },
    onMutate: async (operations) => {
      const optimisticKey = `bulk-${Date.now()}`;
      addUpdate(optimisticKey, { status: 'pending', count: operations.length });

      return { optimisticKey };
    },
    onSuccess: (data, variables, context) => {
      if (context?.optimisticKey) {
        removeUpdate(context.optimisticKey);
      }

      // Invalidate all related queries
      queryClient.invalidateQueries();
    },
    onError: (error, variables, context) => {
      if (context?.optimisticKey) {
        removeUpdate(context.optimisticKey);
      }
    },
  });
}