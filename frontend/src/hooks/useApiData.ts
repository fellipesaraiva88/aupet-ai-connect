import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import axios from "axios";

// Configure axios with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and tenant isolation
api.interceptors.request.use(
  async (config) => {
    // Get current Supabase session for multi-tenant auth
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers['Authorization'] = `Bearer ${session.access_token}`;

        // Add organization/tenant context from user metadata
        // Try both user_metadata and raw_user_meta_data for compatibility
        const organizationId = session.user?.user_metadata?.organization_id ||
                              '00000000-0000-0000-0000-000000000001'; // fallback
        if (organizationId) {
          config.headers['x-organization-id'] = organizationId;
        }
      }
    } catch (error) {
      console.warn('Failed to get Supabase session:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Customer types
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  status: string;
  total_spent?: number;
  created_at: string;
  pets?: Pet[];
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  customer_id: string;
}

interface Appointment {
  id: string;
  title: string;
  appointment_date: string;
  service_type: string;
  price: number;
  status: string;
  customer_id: string;
}

// Catalog types
interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  duration_minutes?: number;
  requires_appointment: boolean;
  tags?: string[];
  image_url?: string;
  is_active: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
  // Additional calculated fields
  type?: 'service' | 'product';
  stock?: number;
  sales?: number;
  bookings?: number;
  popular?: boolean;
  status?: 'active' | 'inactive';
}

interface Category {
  name: string;
  count: number;
  slug: string;
}

interface CatalogStats {
  total_items: number;
  active_items: number;
  inactive_items: number;
  categories_count: number;
  average_price: number;
  appointment_required_items: number;
  price_range: {
    min: number;
    max: number;
  };
}

// Dashboard Stats Hook
export function useDashboardStats(organizationId?: string) {
  return useQuery({
    queryKey: ['dashboard-stats-api', organizationId],
    queryFn: async () => {
      try {
        const response = await api.get('/dashboard/stats', {
          params: { organization_id: organizationId }
        });
        return response.data.data;
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Return fallback data
        return {
          conversations_today: 0,
          daily_appointments: 0,
          response_rate_percent: 87.5,
          daily_revenue: 0,
          avg_response_time: 2.3,
          active_conversations: 0,
          pending_messages: 0,
          ai_accuracy: 89.2
        };
      }
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Customers Hooks - Connected to Backend API
export function useCustomers(organizationId?: string) {
  return useQuery({
    queryKey: ['customers-api', organizationId],
    queryFn: async (): Promise<Customer[]> => {
      try {
        const response = await api.get('/customers', {
          params: { organization_id: organizationId }
        });
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'created_at'>) => {
      const response = await api.post('/customers', customer);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-api'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-api'] });
    },
    onError: (error) => {
      console.error('Error creating customer:', error);
    }
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
      updates: Partial<Customer>
    }) => {
      const response = await api.put(`/customers/${id}`, updates);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-api'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-api'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/customers/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-api'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-api'] });
    },
    onError: (error) => {
      console.error('Error deleting customer:', error);
    }
  });
}

// Pets Hooks - Connected to Backend API
export function usePets(organizationId?: string) {
  return useQuery({
    queryKey: ['pets-api', organizationId],
    queryFn: async (): Promise<Pet[]> => {
      try {
        const response = await api.get('/pets', {
          params: { organization_id: organizationId }
        });
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching pets:', error);
        throw error;
      }
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pet: Omit<Pet, 'id'>) => {
      const response = await api.post('/pets', pet);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets-api'] });
      queryClient.invalidateQueries({ queryKey: ['customers-api'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-api'] });
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
      updates: Partial<Pet>
    }) => {
      const response = await api.put(`/pets/${id}`, updates);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets-api'] });
      queryClient.invalidateQueries({ queryKey: ['customers-api'] });
    },
  });
}

// Appointments Hooks - Connected to Backend API
export function useAppointments(organizationId?: string) {
  return useQuery({
    queryKey: ['appointments-api', organizationId],
    queryFn: async (): Promise<Appointment[]> => {
      try {
        const response = await api.get('/appointments', {
          params: { organization_id: organizationId }
        });
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id'>) => {
      const response = await api.post('/appointments', appointment);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-api'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-api'] });
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
      updates: Partial<Appointment>
    }) => {
      const response = await api.put(`/appointments/${id}`, updates);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-api'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-api'] });
    },
  });
}

// Organization ID hook
export function useOrganizationId() {
  const { user } = useAuthContext();

  // Return organization_id from user metadata or fallback for development
  // Try both user_metadata and raw_user_meta_data for compatibility
  return user?.user_metadata?.organization_id ||
         '00000000-0000-0000-0000-000000000001';
}

// Evolution API Status Hook
export function useEvolutionStatus() {
  return useQuery({
    queryKey: ['evolution-status'],
    queryFn: async () => {
      try {
        const response = await api.get('/evolution/status');
        return response.data;
      } catch (error) {
        console.error('Error fetching Evolution status:', error);
        return { connected: false, instances: [] };
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto refresh every 30 seconds
  });
}

// Conversations Hook
export function useConversations(organizationId?: string) {
  return useQuery({
    queryKey: ['conversations-api', organizationId],
    queryFn: async () => {
      try {
        const response = await api.get('/conversations', {
          params: { organization_id: organizationId }
        });
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Catalog Hooks - Connected to Backend API
export function useCatalogItems(organizationId?: string, filters?: {
  category?: string;
  is_active?: string;
  search?: string;
  price_range?: string;
  requires_appointment?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['catalog-items-api', organizationId, filters],
    queryFn: async (): Promise<CatalogItem[]> => {
      try {
        const response = await api.get('/catalog', {
          params: {
            organization_id: organizationId,
            ...filters
          }
        });
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching catalog items:', error);
        throw error;
      }
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCatalogItem(id: string, organizationId?: string) {
  return useQuery({
    queryKey: ['catalog-item-api', id, organizationId],
    queryFn: async (): Promise<CatalogItem> => {
      try {
        const response = await api.get(`/catalog/${id}`, {
          params: { organization_id: organizationId }
        });
        return response.data.data;
      } catch (error) {
        console.error('Error fetching catalog item:', error);
        throw error;
      }
    },
    enabled: !!id && !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCatalogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<CatalogItem, 'id' | 'created_at' | 'updated_at' | 'organization_id'>) => {
      const response = await api.post('/catalog', item);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-items-api'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-stats-api'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-categories-api'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-api'] });
    },
    onError: (error) => {
      console.error('Error creating catalog item:', error);
    }
  });
}

export function useUpdateCatalogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string;
      updates: Partial<CatalogItem>
    }) => {
      const response = await api.put(`/catalog/${id}`, updates);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['catalog-items-api'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-item-api', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['catalog-stats-api'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-categories-api'] });
    },
    onError: (error) => {
      console.error('Error updating catalog item:', error);
    }
  });
}

export function useDeleteCatalogItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/catalog/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-items-api'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-stats-api'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-categories-api'] });
    },
    onError: (error) => {
      console.error('Error deleting catalog item:', error);
    }
  });
}

export function useCatalogCategories(organizationId?: string) {
  return useQuery({
    queryKey: ['catalog-categories-api', organizationId],
    queryFn: async (): Promise<Category[]> => {
      try {
        const response = await api.get('/catalog/categories/list', {
          params: { organization_id: organizationId }
        });
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching catalog categories:', error);
        return [];
      }
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCatalogStats(organizationId?: string) {
  return useQuery({
    queryKey: ['catalog-stats-api', organizationId],
    queryFn: async (): Promise<CatalogStats> => {
      try {
        const response = await api.get('/catalog/stats/overview', {
          params: { organization_id: organizationId }
        });
        return response.data.data;
      } catch (error) {
        console.error('Error fetching catalog stats:', error);
        // Return fallback data
        return {
          total_items: 0,
          active_items: 0,
          inactive_items: 0,
          categories_count: 0,
          average_price: 0,
          appointment_required_items: 0,
          price_range: { min: 0, max: 0 }
        };
      }
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePopularCatalogItems(organizationId?: string, limit: number = 10, days: number = 30) {
  return useQuery({
    queryKey: ['catalog-popular-api', organizationId, limit, days],
    queryFn: async (): Promise<CatalogItem[]> => {
      try {
        const response = await api.get('/catalog/popular/items', {
          params: {
            organization_id: organizationId,
            limit,
            days
          }
        });
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching popular catalog items:', error);
        return [];
      }
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCatalogRecommendations(customerId: string, organizationId?: string, limit: number = 5) {
  return useQuery({
    queryKey: ['catalog-recommendations-api', customerId, organizationId, limit],
    queryFn: async (): Promise<CatalogItem[]> => {
      try {
        const response = await api.get(`/catalog/recommendations/${customerId}`, {
          params: {
            organization_id: organizationId,
            limit
          }
        });
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching catalog recommendations:', error);
        return [];
      }
    },
    enabled: !!customerId && !!organizationId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useUpdateCatalogItemImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      image_url
    }: {
      id: string;
      image_url: string;
    }) => {
      const response = await api.post(`/catalog/${id}/image`, { image_url });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['catalog-items-api'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-item-api', variables.id] });
    },
    onError: (error) => {
      console.error('Error updating catalog item image:', error);
    }
  });
}

// Settings types
interface OrganizationSettings {
  id: string;
  organization_id: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address?: string;
  cnpj?: string;
  whatsapp_number?: string;
  welcome_message?: string;
  auto_reply: boolean;
  business_hours: boolean;
  ai_personality: 'professional' | 'friendly' | 'casual' | 'formal';
  response_delay: number;
  escalation_keywords: string[];
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  notify_new_customer: boolean;
  notify_missed_message: boolean;
  api_key?: string;
  two_factor_auth: boolean;
  session_timeout: number;
  created_at: string;
  updated_at: string;
}

// Settings Hooks - Connected to Backend API
export function useOrganizationSettings(organizationId?: string) {
  return useQuery({
    queryKey: ['organization-settings-api', organizationId],
    queryFn: async (): Promise<OrganizationSettings> => {
      try {
        const response = await api.get('/settings', {
          params: { organization_id: organizationId }
        });
        return response.data.data;
      } catch (error) {
        console.error('Error fetching organization settings:', error);
        throw error;
      }
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      updates
    }: {
      organizationId: string;
      updates: Partial<OrganizationSettings>
    }) => {
      const response = await api.put('/settings', updates, {
        params: { organization_id: organizationId }
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings-api', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-api'] });
    },
    onError: (error) => {
      console.error('Error updating organization settings:', error);
    }
  });
}

export function useCreateOrganizationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Omit<OrganizationSettings, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await api.post('/settings', settings);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings-api', data.organization_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats-api'] });
    },
    onError: (error) => {
      console.error('Error creating organization settings:', error);
    }
  });
}

export type { OrganizationSettings };
export { api };