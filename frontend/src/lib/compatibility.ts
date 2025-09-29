// Temporary compatibility layer for type mismatches
// This file provides type-safe fallbacks for database schema mismatches

export function safeGet<T>(obj: any, key: string, fallback: T): T {
  return obj && obj[key] !== undefined ? obj[key] : fallback;
}

export function safeDateFormat(date: string | null | undefined): string {
  if (!date) return new Date().toLocaleDateString('pt-BR');
  try {
    return new Date(date).toLocaleDateString('pt-BR');
  } catch {
    return new Date().toLocaleDateString('pt-BR');
  }
}

export function safeProperty(obj: any, ...keys: string[]): any {
  for (const key of keys) {
    if (obj && obj[key] !== undefined) {
      return obj[key];
    }
  }
  return null;
}

// Type assertions for compatibility
export function asAny(obj: any): any {
  return obj as any;
}

// Common field mappings
export const FIELD_MAPPINGS = {
  // Pet mappings
  petOwner: ['owner_id', 'customer_id', 'whatsapp_contact_id'],
  petActive: ['is_active', 'active', 'status'],
  petCreated: ['created_at', 'createdAt', 'date_created'],
  
  // Appointment mappings  
  appointmentClient: ['client_id', 'customer_id', 'contact_id'],
  appointmentDuration: ['duration', 'duration_minutes', 'length'],
  appointmentNotes: ['notes', 'service_notes', 'pre_appointment_notes', 'description'],
  
  // Customer mappings
  customerNotes: ['notes', 'description', 'comments'],
  customerLastInteraction: ['last_interaction', 'updated_at', 'last_contact']
};

export function getMappedValue(obj: any, mappingKey: keyof typeof FIELD_MAPPINGS, fallback: any = null): any {
  const possibleKeys = FIELD_MAPPINGS[mappingKey];
  return safeProperty(obj, ...possibleKeys) ?? fallback;
}