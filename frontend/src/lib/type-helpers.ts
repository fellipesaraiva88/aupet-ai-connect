// Type helpers for database compatibility
import type { Database } from '@/integrations/supabase/types';

// Extended types to match what the code expects
export type ExtendedCustomer = Database['public']['Tables']['whatsapp_contacts']['Row'] & {
  // Add fields that code expects but don't exist in DB
  notes?: string;
  last_interaction?: string;
  organization_id?: string;
};

export type ExtendedPet = Database['public']['Tables']['pets']['Row'] & {
  // Add fields that code expects but don't exist in DB  
  is_active?: boolean;
  vaccination_status?: string;
  created_at?: string;
  whatsapp_contacts?: any;
  owner_id?: string;
  customer_id?: string;
};

export type ExtendedAppointment = Database['public']['Tables']['appointments']['Row'] & {
  // Add fields that code expects but don't exist in DB
  whatsapp_contacts?: any;
  pets?: any;
  duration?: number;
  notes?: string;
  client_id?: string;
  customer_id?: string;
  pre_appointment_notes?: string;
};

// Helper function to add default values for compatibility
export function extendCustomer(customer: Database['public']['Tables']['whatsapp_contacts']['Row']): ExtendedCustomer {
  return {
    ...customer,
    notes: (customer as any).notes || '',
    last_interaction: customer.updated_at || customer.created_at,
    organization_id: customer.organization_id || 'default'
  };
}

export function extendPet(pet: Database['public']['Tables']['pets']['Row']): ExtendedPet {
  return {
    ...pet,
    is_active: (pet as any).is_active ?? true, // assume active if not specified
    vaccination_status: (pet as any).vaccination_status || 'unknown',
    created_at: pet.created_at || new Date().toISOString(),
    owner_id: (pet as any).owner_id || (pet as any).customer_id, // fallback compatibility
    customer_id: (pet as any).customer_id || (pet as any).owner_id
  };
}

export function extendAppointment(appointment: Database['public']['Tables']['appointments']['Row']): ExtendedAppointment {
  return {
    ...appointment,
    duration: appointment.duration_minutes || 60,
    notes: (appointment as any).service_notes || (appointment as any).pre_appointment_notes || '',
    client_id: (appointment as any).customer_id || appointment.client_id,
    customer_id: (appointment as any).customer_id || appointment.client_id,
    pre_appointment_notes: (appointment as any).pre_appointment_notes || ''
  };
}