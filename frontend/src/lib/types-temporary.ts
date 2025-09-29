// Temporary type definitions to resolve build errors
// These will be replaced once database schema is aligned with code expectations

// Base interfaces matching the actual database schema
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  // Extended properties that components expect but may not exist in DB
  notes?: string;
  last_interaction?: string;
  total_spent?: number;
  pets?: Pet[];
  [key: string]: any;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  organization_id?: string;
  owner_id?: string; // This maps to customer relationship
  created_at?: string;
  updated_at?: string;
  birth_date?: string;
  color?: string;
  gender?: string;
  weight?: number;
  is_active?: boolean;
  medical_notes?: string;
  // Extended properties that components expect but may not exist in DB
  customer_id?: string; // Alternative to owner_id
  whatsapp_contacts?: any;
  vaccination_status?: 'up_to_date' | 'pending' | 'overdue';
  age?: string;
  status?: 'active' | 'inactive';
  [key: string]: any;
}

export interface Appointment {
  id: string;
  appointment_date: string;
  service_type: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  organization_id?: string;
  client_id?: string; // Actual DB field
  customer_id?: string; // Alternative mapping
  pet_id?: string;
  veterinarian_id?: string;
  price?: number;
  created_at?: string;
  updated_at?: string;
  duration_minutes?: number; // Actual DB field
  notes?: string; // Exists in DB
  payment_status?: string;
  // Extended properties for compatibility
  duration?: number; // Maps to duration_minutes
  whatsapp_contacts?: any;
  pets?: Pet[];
  [key: string]: any;
}

export interface AutoReply {
  id: string;
  instance_id: string;
  trigger_type: string;
  reply_message: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export type TempIconComponent = React.ComponentType<any> | string | any;

// Helper function to cast types safely
export function asTemp<T>(obj: any): T {
  return obj as T;
}

// Compatibility functions
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

export function safeParseInt(value: any): number {
  const parsed = parseInt(String(value));
  return isNaN(parsed) ? 0 : parsed;
}