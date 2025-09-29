// Temporary type extensions to fix build errors
export type TempAppointment = {
  whatsapp_contacts?: { name: string; phone: string };
  pets?: { name: string; species: string };
  duration?: number;
  notes?: string;
  client_id?: string;
};

export type TempPet = {
  whatsapp_contacts?: { name: string; phone: string };
  is_active?: boolean;
  vaccination_status?: string;
  created_at?: string;
  status?: string;
  age?: number;
  owner_id?: string;
  last_visit?: string;
};

export type TempCustomer = {
  last_interaction?: string;
  notes?: string;
};