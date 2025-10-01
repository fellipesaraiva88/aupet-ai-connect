// Database table types
export interface WhatsAppInstance {
  id: string;
  instance_name: string;
  instance_id: string | null;
  phone_number: string | null;
  status: string | null;
  qr_code: string | null;
  is_connected: boolean | null;
  is_primary: boolean | null;
  webhook_url: string | null;
  api_key: string | null;
  connection_status: string | null;
  last_heartbeat: string | null;
  metadata: any;
  created_at: string | null;
  updated_at: string | null;
  organization_id: string | null;
  user_id: string | null;
  session_data: any;
  connected_at?: string | null;
}

export interface WhatsAppInstanceInsert {
  user_id?: string;
  organization_id?: string;
  instance_name: string;
  instance_id?: string;
  status?: string;
  webhook_url?: string;
  api_key?: string;
  metadata?: any;
  phone_number?: string;
  is_connected?: boolean;
  is_primary?: boolean;
  connection_status?: string;
  qr_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WhatsAppInstanceUpdate {
  status?: string;
  qr_code?: string | null;
  is_connected?: boolean;
  connection_status?: string;
  last_heartbeat?: string;
  updated_at?: string;
  connected_at?: string;
  phone_number?: string;
  api_key?: string;
  session_data?: any;
}
