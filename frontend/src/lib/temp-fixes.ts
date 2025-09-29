// Temporary fixes for specific component errors
import { Customer, Pet, Appointment, AutoReply } from './types-temporary';

// Property access with fallbacks
export function safeAccess<T>(obj: any, key: string, fallback?: T): T | undefined {
  if (!obj || typeof obj !== 'object') return fallback;
  return key in obj ? obj[key] : fallback;
}

// Component compatibility helpers
export function withFallbacks<T extends Record<string, any>>(obj: T): T & Record<string, any> {
  return new Proxy(obj, {
    get(target, prop) {
      if (prop in target) {
        return target[prop as keyof T];
      }
      // Return undefined for missing properties instead of throwing
      return undefined;
    }
  });
}

// Type casting helpers
export function asCustomer(obj: any): Customer {
  return withFallbacks(obj as Customer);
}

export function asPet(obj: any): Pet {
  return withFallbacks(obj as Pet);
}

export function asAppointment(obj: any): Appointment {
  return withFallbacks(obj as Appointment);
}

export function asAutoReply(obj: any): AutoReply {
  return withFallbacks(obj as AutoReply);
}

// Array filtering helpers
export function filterValidItems<T>(items: any[]): T[] {
  return items.filter(item => item && typeof item === 'object' && !('error' in item));
}

// Safe mutation helpers
export function createSafeMutation<T>(data: T, additionalProps: Record<string, any> = {}): T & Record<string, any> {
  return { ...data, ...additionalProps } as T & Record<string, any>;
}

// Property mapping helpers
export function mapAppointmentProps(appointment: any): Appointment {
  return {
    ...appointment,
    // Map database fields to expected properties
    customer_id: appointment.client_id || appointment.customer_id,
    duration: appointment.duration_minutes || appointment.duration,
    client_id: appointment.client_id || appointment.customer_id,
  };
}

export function mapPetProps(pet: any): Pet {
  return {
    ...pet,
    // Add missing expected properties with defaults
    whatsapp_contacts: pet.whatsapp_contacts || null,
    is_active: pet.is_active ?? true,
    vaccination_status: pet.vaccination_status || 'pending',
    age: pet.age || calculateAge(pet.birth_date),
    status: pet.is_active ? 'active' : 'inactive',
    customer_id: pet.owner_id || pet.customer_id,
    owner_id: pet.owner_id || pet.customer_id,
  };
}

export function mapCustomerProps(customer: any): Customer {
  return {
    ...customer,
    // Add missing expected properties with defaults
    notes: customer.notes || '',
    last_interaction: customer.last_interaction || customer.updated_at,
    total_spent: customer.total_spent || 0,
    pets: customer.pets || [],
  };
}

function calculateAge(birthDate?: string): string {
  if (!birthDate) return 'Não informado';
  
  const birth = new Date(birthDate);
  const today = new Date();
  const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  
  if (ageInMonths < 12) {
    return `${ageInMonths} meses`;
  }
  
  const years = Math.floor(ageInMonths / 12);
  return `${years} anos`;
}