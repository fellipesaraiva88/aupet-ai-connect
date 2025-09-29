// Temporary type definitions to resolve build errors
// These will be replaced once database schema is aligned with code expectations

export interface TempCustomer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  organization_id?: string;
  notes?: string;
  last_interaction?: string;
  created_at?: string;
  [key: string]: any;
}

export interface TempPet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  organization_id?: string;
  owner_id?: string;
  customer_id?: string;
  is_active?: boolean;
  vaccination_status?: string;
  created_at?: string;
  whatsapp_contacts?: any;
  [key: string]: any;
}

export interface TempAppointment {
  id: string;
  appointment_date: string;
  service_type: string;
  status: string;
  organization_id?: string;
  client_id?: string;
  customer_id?: string;
  pet_id?: string;
  price?: number;
  duration?: number;
  duration_minutes?: number;
  notes?: string;
  whatsapp_contacts?: any;
  pets?: any;
  [key: string]: any;
}

export interface TempAutoReply {
  id: string;
  instance_id: string;
  trigger_type: string;
  reply_message: string;
  is_active?: boolean;
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