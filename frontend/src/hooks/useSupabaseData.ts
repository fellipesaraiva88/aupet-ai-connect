import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

// Type definitions
type Appointment = Database['public']['Tables']['appointments']['Row'];
type Pet = Database['public']['Tables']['pets']['Row'];
type WhatsAppContact = Database['public']['Tables']['whatsapp_contacts']['Row'];
type DashboardStats = Database['public']['Views']['dashboard_stats_view']['Row'];

// Dashboard Stats Hook
export function useDashboardStats(organizationId?: string) {
  return useQuery({
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
        };
      }
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Appointments Hooks
export function useAppointments(organizationId?: string) {
  return useQuery({
    queryKey: ['appointments', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          whatsapp_contacts!appointments_client_id_fkey (
            name,
            phone,
            email
          ),
          pets (
            name,
            species,
            breed
          )
        `)
        .eq('organization_id', organizationId || 'default')
        .order('appointment_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: Database['public']['Tables']['appointments']['Insert']) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// Pets Hooks
export function usePets(organizationId?: string) {
  return useQuery({
    queryKey: ['pets', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pets')
        .select(`
          *,
          whatsapp_contacts!pets_owner_id_fkey (
            name,
            phone,
            email
          )
        `)
        .eq('organization_id', organizationId || 'default')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pet: Database['public']['Tables']['pets']['Insert']) => {
      const { data, error } = await supabase
        .from('pets')
        .insert(pet)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdatePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: Database['public']['Tables']['pets']['Update']
    }) => {
      const { data, error } = await supabase
        .from('pets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// Customers (WhatsApp Contacts) Hooks
export function useCustomers(organizationId?: string) {
  return useQuery({
    queryKey: ['customers', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select(`
          *,
          pets!pets_owner_id_fkey (
            id,
            name,
            species,
            breed
          ),
          appointments!appointments_client_id_fkey (
            id,
            appointment_date,
            service_type,
            price,
            status
          )
        `)
        .eq('organization_id', organizationId || 'default')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: Database['public']['Tables']['whatsapp_contacts']['Insert']) => {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .insert(customer)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// Conversations Hook
export function useConversations(organizationId?: string) {
  return useQuery({
    queryKey: ['conversations', organizationId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('whatsapp_conversations')
          .select(`
            *,
            whatsapp_contacts (
              name,
              phone,
              pets (
                id,
                name,
                species,
                breed
              )
            ),
            whatsapp_messages (
              content,
              created_at,
              direction,
              message_type
            )
          `)
          .eq('organization_id', organizationId || 'default')
          .order('updated_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Analytics Hook for Revenue Metrics
export function useRevenueMetrics(organizationId?: string) {
  return useQuery({
    queryKey: ['revenue-metrics', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_metrics_view')
        .select('*')
        .eq('organization_id', organizationId || 'default')
        .order('month', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// Organization context using auth
export function useOrganizationId() {
  const { user } = useAuthContext();

  // Return organization_id from user metadata or fallback for development
  return user?.user_metadata?.organization_id || 'default-org';
}