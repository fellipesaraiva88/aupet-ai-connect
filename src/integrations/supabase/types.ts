export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_configurations: {
        Row: {
          auto_reply_enabled: boolean | null
          business_hours_only: boolean | null
          context_prompt: string | null
          created_at: string | null
          escalation_keywords: string[] | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          metadata: Json | null
          name: string
          organization_id: string | null
          personality: Database["public"]["Enums"]["ai_personality"] | null
          response_delay_seconds: number | null
          system_prompt: string | null
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          auto_reply_enabled?: boolean | null
          business_hours_only?: boolean | null
          context_prompt?: string | null
          created_at?: string | null
          escalation_keywords?: string[] | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          personality?: Database["public"]["Enums"]["ai_personality"] | null
          response_delay_seconds?: number | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_reply_enabled?: boolean | null
          business_hours_only?: boolean | null
          context_prompt?: string | null
          created_at?: string | null
          escalation_keywords?: string[] | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          personality?: Database["public"]["Enums"]["ai_personality"] | null
          response_delay_seconds?: number | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          config_id: string | null
          contact_id: string | null
          context: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_interaction: string | null
          metadata: Json | null
          organization_id: string | null
          total_messages: number | null
          total_tokens_used: number | null
          updated_at: string | null
        }
        Insert: {
          config_id?: string | null
          contact_id?: string | null
          context?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_interaction?: string | null
          metadata?: Json | null
          organization_id?: string | null
          total_messages?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
        }
        Update: {
          config_id?: string | null
          contact_id?: string | null
          context?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_interaction?: string | null
          metadata?: Json | null
          organization_id?: string | null
          total_messages?: number | null
          total_tokens_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "ai_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_insights_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_escalation_rules: {
        Row: {
          action_type: string | null
          condition_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[]
          metadata: Json | null
          name: string
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          action_type?: string | null
          condition_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords: string[]
          metadata?: Json | null
          name: string
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string | null
          condition_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          metadata?: Json | null
          name?: string
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_interaction_logs: {
        Row: {
          ai_response: string | null
          confidence_score: number | null
          conversation_id: string | null
          created_at: string | null
          escalated_to_human: boolean | null
          id: string
          interaction_type:
            | Database["public"]["Enums"]["interaction_type"]
            | null
          message_id: string | null
          metadata: Json | null
          model_used: string | null
          organization_id: string | null
          processing_time_ms: number | null
          satisfaction_rating: number | null
          tokens_used: number | null
          user_message: string | null
        }
        Insert: {
          ai_response?: string | null
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          escalated_to_human?: boolean | null
          id?: string
          interaction_type?:
            | Database["public"]["Enums"]["interaction_type"]
            | null
          message_id?: string | null
          metadata?: Json | null
          model_used?: string | null
          organization_id?: string | null
          processing_time_ms?: number | null
          satisfaction_rating?: number | null
          tokens_used?: number | null
          user_message?: string | null
        }
        Update: {
          ai_response?: string | null
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          escalated_to_human?: boolean | null
          id?: string
          interaction_type?:
            | Database["public"]["Enums"]["interaction_type"]
            | null
          message_id?: string | null
          metadata?: Json | null
          model_used?: string | null
          organization_id?: string | null
          processing_time_ms?: number | null
          satisfaction_rating?: number | null
          tokens_used?: number | null
          user_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interaction_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interaction_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interaction_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interaction_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interaction_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interaction_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interaction_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          priority: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_response_templates: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          personality: string | null
          template_text: string
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          personality?: string | null
          template_text: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          personality?: string | null
          template_text?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: []
      }
      ai_sentiment_analysis: {
        Row: {
          analysis_provider: string | null
          confidence_score: number | null
          conversation_id: string | null
          created_at: string | null
          emotions: Json | null
          id: string
          keywords_detected: string[] | null
          message_id: string | null
          sentiment: string
        }
        Insert: {
          analysis_provider?: string | null
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          emotions?: Json | null
          id?: string
          keywords_detected?: string[] | null
          message_id?: string | null
          sentiment: string
        }
        Update: {
          analysis_provider?: string | null
          confidence_score?: number | null
          conversation_id?: string | null
          created_at?: string | null
          emotions?: Json | null
          id?: string
          keywords_detected?: string[] | null
          message_id?: string | null
          sentiment?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sentiment_analysis_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          actual_cost: number | null
          appointment_code: string | null
          appointment_date: string
          appointment_type: string | null
          arrived_at: string | null
          assigned_user_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          customer_id: string | null
          duration_minutes: number | null
          estimated_cost: number | null
          follow_up_date: string | null
          follow_up_needed: boolean | null
          id: string
          is_recurring: boolean | null
          metadata: Json | null
          next_appointment_recommendation: string | null
          no_show: boolean | null
          notes: string | null
          organization_id: string | null
          parent_appointment_id: string | null
          payment_status: string | null
          pet_id: string | null
          post_appointment_notes: string | null
          pre_appointment_notes: string | null
          price: number | null
          priority: string | null
          recurrence_pattern: Json | null
          reminder_sent: boolean | null
          service_notes: string | null
          service_type: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          tags: string[] | null
          treatment_plan: string | null
          updated_at: string | null
          updated_by: string | null
          veterinarian_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          appointment_code?: string | null
          appointment_date: string
          appointment_type?: string | null
          arrived_at?: string | null
          assigned_user_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          customer_id?: string | null
          duration_minutes?: number | null
          estimated_cost?: number | null
          follow_up_date?: string | null
          follow_up_needed?: boolean | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          next_appointment_recommendation?: string | null
          no_show?: boolean | null
          notes?: string | null
          organization_id?: string | null
          parent_appointment_id?: string | null
          payment_status?: string | null
          pet_id?: string | null
          post_appointment_notes?: string | null
          pre_appointment_notes?: string | null
          price?: number | null
          priority?: string | null
          recurrence_pattern?: Json | null
          reminder_sent?: boolean | null
          service_notes?: string | null
          service_type: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          tags?: string[] | null
          treatment_plan?: string | null
          updated_at?: string | null
          updated_by?: string | null
          veterinarian_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          appointment_code?: string | null
          appointment_date?: string
          appointment_type?: string | null
          arrived_at?: string | null
          assigned_user_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          customer_id?: string | null
          duration_minutes?: number | null
          estimated_cost?: number | null
          follow_up_date?: string | null
          follow_up_needed?: boolean | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          next_appointment_recommendation?: string | null
          no_show?: boolean | null
          notes?: string | null
          organization_id?: string | null
          parent_appointment_id?: string | null
          payment_status?: string | null
          pet_id?: string | null
          post_appointment_notes?: string | null
          pre_appointment_notes?: string | null
          price?: number | null
          priority?: string | null
          recurrence_pattern?: Json | null
          reminder_sent?: boolean | null
          service_notes?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          tags?: string[] | null
          treatment_plan?: string | null
          updated_at?: string | null
          updated_by?: string | null
          veterinarian_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "customer_insights_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_parent_appointment_id_fkey"
            columns: ["parent_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          changed_fields: string[] | null
          data_classification: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          operation: string
          organization_id: string | null
          record_id: string
          retention_period: unknown | null
          risk_score: number | null
          session_id: string | null
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          changed_fields?: string[] | null
          data_classification?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          organization_id?: string | null
          record_id: string
          retention_period?: unknown | null
          risk_score?: number | null
          session_id?: string | null
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          changed_fields?: string[] | null
          data_classification?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          organization_id?: string | null
          record_id?: string
          retention_period?: unknown | null
          risk_score?: number | null
          session_id?: string | null
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          business_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          business_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          business_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail: {
        Row: {
          action: string
          category: string | null
          changed_fields: string[] | null
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          organization_id: string | null
          record_id: string | null
          request_id: string | null
          session_id: string | null
          severity: string | null
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          category?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          record_id?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: string | null
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          category?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          record_id?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: string | null
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_trail_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_trail_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_trail_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_trail_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          allow_online_booking: boolean | null
          appointment_interval_minutes: number | null
          break_end_time: string | null
          break_start_time: string | null
          close_time: string | null
          created_at: string | null
          day_of_week: number
          effective_from: string | null
          effective_until: string | null
          id: string
          is_open: boolean | null
          max_appointments_per_hour: number | null
          notes: string | null
          open_time: string | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          allow_online_booking?: boolean | null
          appointment_interval_minutes?: number | null
          break_end_time?: string | null
          break_start_time?: string | null
          close_time?: string | null
          created_at?: string | null
          day_of_week: number
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_open?: boolean | null
          max_appointments_per_hour?: number | null
          notes?: string | null
          open_time?: string | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          allow_online_booking?: boolean | null
          appointment_interval_minutes?: number | null
          break_end_time?: string | null
          break_start_time?: string | null
          close_time?: string | null
          created_at?: string | null
          day_of_week?: number
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_open?: boolean | null
          max_appointments_per_hour?: number | null
          notes?: string | null
          open_time?: string | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "business_hours_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "business_hours_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "business_hours_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "business_hours_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          age_restriction: string | null
          allow_backorder: boolean | null
          barcode: string | null
          brand: string | null
          category: string | null
          color: string | null
          contraindications: string | null
          cost_price: number | null
          created_at: string | null
          created_by: string | null
          current_stock: number | null
          description: string | null
          dimensions: Json | null
          discount_price: number | null
          documents: string[] | null
          duration_minutes: number | null
          expiration_date: string | null
          id: string
          image_url: string | null
          images: string[] | null
          ingredients: string | null
          is_active: boolean | null
          is_digital: boolean | null
          item_code: string | null
          last_inventory_date: string | null
          manufacturer: string | null
          manufacturing_date: string | null
          markup_percentage: number | null
          maximum_stock: number | null
          minimum_stock: number | null
          name: string
          organization_id: string | null
          price: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          requires_appointment: boolean | null
          requires_prescription: boolean | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          size: string | null
          sku: string | null
          storage_conditions: string | null
          subcategory: string | null
          supplier: string | null
          tags: string[] | null
          track_inventory: boolean | null
          updated_at: string | null
          updated_by: string | null
          usage_instructions: string | null
          videos: string[] | null
          weight_kg: number | null
          wholesale_price: number | null
        }
        Insert: {
          age_restriction?: string | null
          allow_backorder?: boolean | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          color?: string | null
          contraindications?: string | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          current_stock?: number | null
          description?: string | null
          dimensions?: Json | null
          discount_price?: number | null
          documents?: string[] | null
          duration_minutes?: number | null
          expiration_date?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          ingredients?: string | null
          is_active?: boolean | null
          is_digital?: boolean | null
          item_code?: string | null
          last_inventory_date?: string | null
          manufacturer?: string | null
          manufacturing_date?: string | null
          markup_percentage?: number | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          name: string
          organization_id?: string | null
          price?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          requires_appointment?: boolean | null
          requires_prescription?: boolean | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          size?: string | null
          sku?: string | null
          storage_conditions?: string | null
          subcategory?: string | null
          supplier?: string | null
          tags?: string[] | null
          track_inventory?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          usage_instructions?: string | null
          videos?: string[] | null
          weight_kg?: number | null
          wholesale_price?: number | null
        }
        Update: {
          age_restriction?: string | null
          allow_backorder?: boolean | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          color?: string | null
          contraindications?: string | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          current_stock?: number | null
          description?: string | null
          dimensions?: Json | null
          discount_price?: number | null
          documents?: string[] | null
          duration_minutes?: number | null
          expiration_date?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          ingredients?: string | null
          is_active?: boolean | null
          is_digital?: boolean | null
          item_code?: string | null
          last_inventory_date?: string | null
          manufacturer?: string | null
          manufacturing_date?: string | null
          markup_percentage?: number | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          name?: string
          organization_id?: string | null
          price?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          requires_appointment?: boolean | null
          requires_prescription?: boolean | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          size?: string | null
          sku?: string | null
          storage_conditions?: string | null
          subcategory?: string | null
          supplier?: string | null
          tags?: string[] | null
          track_inventory?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          usage_instructions?: string | null
          videos?: string[] | null
          weight_kg?: number | null
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "catalog_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "catalog_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "catalog_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "catalog_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          business_id: string
          consent_type: string
          granted: boolean
          granted_at: string | null
          id: string
          metadata: Json | null
          phone_number: string
          revoked_at: string | null
          source: string | null
        }
        Insert: {
          business_id: string
          consent_type: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          metadata?: Json | null
          phone_number: string
          revoked_at?: string | null
          source?: string | null
        }
        Update: {
          business_id?: string
          consent_type?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          metadata?: Json | null
          phone_number?: string
          revoked_at?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_profiles: {
        Row: {
          business_id: string
          created_at: string | null
          custom_fields: Json | null
          id: string
          is_blocked: boolean | null
          last_seen: string | null
          name: string | null
          phone_number: string
          profile_pic_url: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          custom_fields?: Json | null
          id?: string
          is_blocked?: boolean | null
          last_seen?: string | null
          name?: string | null
          phone_number: string
          profile_pic_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          custom_fields?: Json | null
          id?: string
          is_blocked?: boolean | null
          last_seen?: string | null
          name?: string | null
          phone_number?: string
          profile_pic_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_context: {
        Row: {
          chat_id: string
          context_data: Json
          expires_at: string | null
          id: string
          instance_id: string
          last_interaction: string | null
        }
        Insert: {
          chat_id: string
          context_data: Json
          expires_at?: string | null
          id?: string
          instance_id: string
          last_interaction?: string | null
        }
        Update: {
          chat_id?: string
          context_data?: Json
          expires_at?: string | null
          id?: string
          instance_id?: string
          last_interaction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_context_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          customer_id: string | null
          escalation_level: number | null
          id: string
          last_message_at: string | null
          notes: string | null
          organization_id: string | null
          priority: string | null
          resolution_time_minutes: number | null
          response_time_minutes: number | null
          sentiment_score: number | null
          status: string | null
          subject: string | null
          tags: string[] | null
          updated_at: string | null
          whatsapp_chat_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          customer_id?: string | null
          escalation_level?: number | null
          id?: string
          last_message_at?: string | null
          notes?: string | null
          organization_id?: string | null
          priority?: string | null
          resolution_time_minutes?: number | null
          response_time_minutes?: number | null
          sentiment_score?: number | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
          whatsapp_chat_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          customer_id?: string | null
          escalation_level?: number | null
          id?: string
          last_message_at?: string | null
          notes?: string | null
          organization_id?: string | null
          priority?: string | null
          resolution_time_minutes?: number | null
          response_time_minutes?: number | null
          sentiment_score?: number | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          updated_at?: string | null
          whatsapp_chat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_themes: {
        Row: {
          config: Json
          created_at: string | null
          downloads: number | null
          id: string
          is_public: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          downloads?: number | null
          id: string
          is_public?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          downloads?: number | null
          id?: string
          is_public?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customer_insights: {
        Row: {
          appointment_frequency_days: number | null
          average_pet_age_months: number | null
          average_response_time_minutes: number | null
          calculation_version: string | null
          cancellation_rate: number | null
          complaint_count: number | null
          contact_id: string
          created_at: string | null
          engagement_score: number | null
          id: string
          last_calculated_at: string | null
          last_negative_interaction: string | null
          last_positive_interaction: string | null
          lifetime_value: number | null
          metadata: Json | null
          next_likely_service: string | null
          no_show_rate: number | null
          organization_id: string | null
          pet_count: number | null
          predicted_churn_probability: number | null
          preferred_contact_hours: number[] | null
          primary_pet_species: string | null
          sentiment_trend: string | null
          total_messages: number | null
          updated_at: string | null
        }
        Insert: {
          appointment_frequency_days?: number | null
          average_pet_age_months?: number | null
          average_response_time_minutes?: number | null
          calculation_version?: string | null
          cancellation_rate?: number | null
          complaint_count?: number | null
          contact_id: string
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          last_calculated_at?: string | null
          last_negative_interaction?: string | null
          last_positive_interaction?: string | null
          lifetime_value?: number | null
          metadata?: Json | null
          next_likely_service?: string | null
          no_show_rate?: number | null
          organization_id?: string | null
          pet_count?: number | null
          predicted_churn_probability?: number | null
          preferred_contact_hours?: number[] | null
          primary_pet_species?: string | null
          sentiment_trend?: string | null
          total_messages?: number | null
          updated_at?: string | null
        }
        Update: {
          appointment_frequency_days?: number | null
          average_pet_age_months?: number | null
          average_response_time_minutes?: number | null
          calculation_version?: string | null
          cancellation_rate?: number | null
          complaint_count?: number | null
          contact_id?: string
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          last_calculated_at?: string | null
          last_negative_interaction?: string | null
          last_positive_interaction?: string | null
          lifetime_value?: number | null
          metadata?: Json | null
          next_likely_service?: string | null
          no_show_rate?: number | null
          organization_id?: string | null
          pet_count?: number | null
          predicted_churn_probability?: number | null
          preferred_contact_hours?: number[] | null
          primary_pet_species?: string | null
          sentiment_trend?: string | null
          total_messages?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_insights_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "customer_insights_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_insights_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "customer_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "customer_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "customer_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "customer_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          birth_date: string | null
          city: string | null
          communication_preferences: Json | null
          complement: string | null
          consent_analytics: boolean | null
          consent_marketing: boolean | null
          consent_timestamp: string | null
          cpf: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          custom_fields: Json | null
          customer_code: string | null
          customer_since: string | null
          data_retention_until: string | null
          email: string | null
          emergency_contact: Json | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          external_id: string | null
          gdpr_status: string | null
          gender: string | null
          id: string
          instagram: string | null
          internal_notes: string | null
          is_active: boolean | null
          loyalty_points: number | null
          marketing_consent: boolean | null
          name: string
          neighborhood: string | null
          newsletter_consent: boolean | null
          notes: string | null
          number: string | null
          occupation: string | null
          organization_id: string | null
          payment_terms: number | null
          phone: string
          preferred_contact_method: string | null
          referral_source: string | null
          rg: string | null
          state: string | null
          street: string | null
          tags: string[] | null
          total_spent: number | null
          updated_at: string | null
          updated_by: string | null
          vip_status: boolean | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          communication_preferences?: Json | null
          complement?: string | null
          consent_analytics?: boolean | null
          consent_marketing?: boolean | null
          consent_timestamp?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          custom_fields?: Json | null
          customer_code?: string | null
          customer_since?: string | null
          data_retention_until?: string | null
          email?: string | null
          emergency_contact?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          external_id?: string | null
          gdpr_status?: string | null
          gender?: string | null
          id?: string
          instagram?: string | null
          internal_notes?: string | null
          is_active?: boolean | null
          loyalty_points?: number | null
          marketing_consent?: boolean | null
          name: string
          neighborhood?: string | null
          newsletter_consent?: boolean | null
          notes?: string | null
          number?: string | null
          occupation?: string | null
          organization_id?: string | null
          payment_terms?: number | null
          phone: string
          preferred_contact_method?: string | null
          referral_source?: string | null
          rg?: string | null
          state?: string | null
          street?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vip_status?: boolean | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          communication_preferences?: Json | null
          complement?: string | null
          consent_analytics?: boolean | null
          consent_marketing?: boolean | null
          consent_timestamp?: string | null
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          custom_fields?: Json | null
          customer_code?: string | null
          customer_since?: string | null
          data_retention_until?: string | null
          email?: string | null
          emergency_contact?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          external_id?: string | null
          gdpr_status?: string | null
          gender?: string | null
          id?: string
          instagram?: string | null
          internal_notes?: string | null
          is_active?: boolean | null
          loyalty_points?: number | null
          marketing_consent?: boolean | null
          name?: string
          neighborhood?: string | null
          newsletter_consent?: boolean | null
          notes?: string | null
          number?: string | null
          occupation?: string | null
          organization_id?: string | null
          payment_terms?: number | null
          phone?: string
          preferred_contact_method?: string | null
          referral_source?: string | null
          rg?: string | null
          state?: string | null
          street?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vip_status?: boolean | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_privacy_requests: {
        Row: {
          completion_deadline: string | null
          created_at: string | null
          data_subject_email: string
          data_subject_phone: string | null
          id: string
          legal_basis: string | null
          notes: string | null
          organization_id: string | null
          processed_at: string | null
          processed_by: string | null
          request_details: Json | null
          request_type: string
          status: string
          user_id: string | null
        }
        Insert: {
          completion_deadline?: string | null
          created_at?: string | null
          data_subject_email: string
          data_subject_phone?: string | null
          id?: string
          legal_basis?: string | null
          notes?: string | null
          organization_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_details?: Json | null
          request_type: string
          status?: string
          user_id?: string | null
        }
        Update: {
          completion_deadline?: string | null
          created_at?: string | null
          data_subject_email?: string
          data_subject_phone?: string | null
          id?: string
          legal_basis?: string | null
          notes?: string | null
          organization_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_details?: Json | null
          request_type?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_privacy_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "data_privacy_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "data_privacy_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "data_privacy_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "data_privacy_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_quality_checks: {
        Row: {
          actual_result: string | null
          check_query: string
          check_type: string
          column_name: string | null
          created_at: string | null
          error_count: number | null
          expected_result: string | null
          id: string
          last_run_at: string | null
          metadata: Json | null
          next_run_at: string | null
          organization_id: string | null
          quality_score: number | null
          severity: string | null
          status: string | null
          table_name: string
          total_records: number | null
          updated_at: string | null
        }
        Insert: {
          actual_result?: string | null
          check_query: string
          check_type: string
          column_name?: string | null
          created_at?: string | null
          error_count?: number | null
          expected_result?: string | null
          id?: string
          last_run_at?: string | null
          metadata?: Json | null
          next_run_at?: string | null
          organization_id?: string | null
          quality_score?: number | null
          severity?: string | null
          status?: string | null
          table_name: string
          total_records?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_result?: string | null
          check_query?: string
          check_type?: string
          column_name?: string | null
          created_at?: string | null
          error_count?: number | null
          expected_result?: string | null
          id?: string
          last_run_at?: string | null
          metadata?: Json | null
          next_run_at?: string | null
          organization_id?: string | null
          quality_score?: number | null
          severity?: string | null
          status?: string | null
          table_name?: string
          total_records?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_quality_checks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "data_quality_checks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "data_quality_checks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "data_quality_checks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "data_quality_checks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      etl_execution_logs: {
        Row: {
          attempt: number | null
          created_at: string | null
          duration_ms: number | null
          end_time: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          metadata: Json | null
          organization_id: string | null
          pipeline_name: string
          result: Json | null
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          attempt?: number | null
          created_at?: string | null
          duration_ms?: number | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          organization_id?: string | null
          pipeline_name: string
          result?: Json | null
          start_time: string
          status: string
          updated_at?: string | null
        }
        Update: {
          attempt?: number | null
          created_at?: string | null
          duration_ms?: number | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          organization_id?: string | null
          pipeline_name?: string
          result?: Json | null
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etl_execution_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "etl_execution_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "etl_execution_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "etl_execution_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "etl_execution_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_tasks: {
        Row: {
          appointment_id: string | null
          assigned_to: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          organization_id: string | null
          priority: string | null
          status: string | null
          task_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          status?: string | null
          task_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          status?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_insights_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "follow_up_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "follow_up_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "follow_up_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "follow_up_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          attachments: string[] | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          date_performed: string
          diagnosis: string | null
          id: string
          medications: Json | null
          next_due_date: string | null
          notes: string | null
          organization_id: string | null
          pet_id: string | null
          record_type: string | null
          treatment: string | null
          updated_at: string | null
          veterinarian: string | null
        }
        Insert: {
          attachments?: string[] | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          date_performed: string
          diagnosis?: string | null
          id?: string
          medications?: Json | null
          next_due_date?: string | null
          notes?: string | null
          organization_id?: string | null
          pet_id?: string | null
          record_type?: string | null
          treatment?: string | null
          updated_at?: string | null
          veterinarian?: string | null
        }
        Update: {
          attachments?: string[] | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          date_performed?: string
          diagnosis?: string | null
          id?: string
          medications?: Json | null
          next_due_date?: string | null
          notes?: string | null
          organization_id?: string | null
          pet_id?: string | null
          record_type?: string | null
          treatment?: string | null
          updated_at?: string | null
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "health_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "health_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "health_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "health_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          id: string
          level: string
          message: string
          metadata: Json | null
          organization_id: string | null
          service: string | null
          timestamp: string | null
        }
        Insert: {
          id?: string
          level: string
          message: string
          metadata?: Json | null
          organization_id?: string | null
          service?: string | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          organization_id?: string | null
          service?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          joined_at: string | null
          metadata: Json | null
          organization_id: string
          permissions: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          metadata?: Json | null
          organization_id: string
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          metadata?: Json | null
          organization_id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_analytics: {
        Row: {
          created_at: string | null
          engagement_score: number | null
          has_emoji: boolean | null
          has_question: boolean | null
          id: string
          intent: string | null
          keywords: string[] | null
          message_id: string
          metadata: Json | null
          organization_id: string | null
          processing_time_ms: number | null
          sentiment: string
          sentiment_confidence: number
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          created_at?: string | null
          engagement_score?: number | null
          has_emoji?: boolean | null
          has_question?: boolean | null
          id?: string
          intent?: string | null
          keywords?: string[] | null
          message_id: string
          metadata?: Json | null
          organization_id?: string | null
          processing_time_ms?: number | null
          sentiment: string
          sentiment_confidence: number
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          created_at?: string | null
          engagement_score?: number | null
          has_emoji?: boolean | null
          has_question?: boolean | null
          id?: string
          intent?: string | null
          keywords?: string[] | null
          message_id?: string
          metadata?: Json | null
          organization_id?: string | null
          processing_time_ms?: number | null
          sentiment?: string
          sentiment_confidence?: number
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_analytics_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "message_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "message_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "message_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "message_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_history: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string | null
          direction: string
          id: string
          instance_id: string
          media_type: string | null
          media_url: string | null
          message_id: string | null
          metadata: Json | null
          quoted_message_id: string | null
          status: string
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string | null
          direction: string
          id?: string
          instance_id: string
          media_type?: string | null
          media_url?: string | null
          message_id?: string | null
          metadata?: Json | null
          quoted_message_id?: string | null
          status?: string
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string | null
          direction?: string
          id?: string
          instance_id?: string
          media_type?: string | null
          media_url?: string | null
          message_id?: string | null
          metadata?: Json | null
          quoted_message_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_history_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      message_processing_queue: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          message_id: string
          metadata: Json | null
          organization_id: string | null
          priority: string | null
          retry_count: number | null
          scheduled_for: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          message_id: string
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          message_id?: string
          metadata?: Json | null
          organization_id?: string | null
          priority?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_processing_queue_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_processing_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "message_processing_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "message_processing_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "message_processing_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "message_processing_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_queue: {
        Row: {
          contact_id: string | null
          content: string
          created_at: string | null
          error_message: string | null
          id: string
          instance_id: string | null
          max_retries: number | null
          media_url: string | null
          message_type: string | null
          metadata: Json | null
          organization_id: string | null
          priority: number | null
          retry_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contact_id?: string | null
          content: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          max_retries?: number | null
          media_url?: string | null
          message_type?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: number | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_id?: string | null
          content?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          max_retries?: number | null
          media_url?: string | null
          message_type?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: number | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_insights_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "message_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "message_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "message_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "message_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          business_id: string
          conditions: Json | null
          content: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          template_type: string
          trigger_keywords: string[] | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          conditions?: Json | null
          content: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          template_type: string
          trigger_keywords?: string[] | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          conditions?: Json | null
          content?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          template_type?: string
          trigger_keywords?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          ai_confidence: number | null
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          is_automated: boolean | null
          language: string | null
          media_type: string | null
          media_url: string | null
          message_type: string | null
          organization_id: string | null
          processed_by_ai: boolean | null
          sender_id: string | null
          sender_type: string
          sentiment_score: number | null
          whatsapp_message_id: string
        }
        Insert: {
          ai_confidence?: number | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_automated?: boolean | null
          language?: string | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          organization_id?: string | null
          processed_by_ai?: boolean | null
          sender_id?: string | null
          sender_type: string
          sentiment_score?: number | null
          whatsapp_message_id: string
        }
        Update: {
          ai_confidence?: number | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_automated?: boolean | null
          language?: string | null
          media_type?: string | null
          media_url?: string | null
          message_type?: string | null
          organization_id?: string | null
          processed_by_ai?: boolean | null
          sender_id?: string | null
          sender_type?: string
          sentiment_score?: number | null
          whatsapp_message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          id: string
          name: string
          organization_id: string | null
          tags: Json | null
          timestamp: string | null
          unit: string | null
          value: number
        }
        Insert: {
          id?: string
          name: string
          organization_id?: string | null
          tags?: Json | null
          timestamp?: string | null
          unit?: string | null
          value: number
        }
        Update: {
          id?: string
          name?: string
          organization_id?: string | null
          tags?: Json | null
          timestamp?: string | null
          unit?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          delivery_method: string | null
          id: string
          is_enabled: boolean | null
          notification_type: string | null
          organization_id: string | null
          schedule_config: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_method?: string | null
          id?: string
          is_enabled?: boolean | null
          notification_type?: string | null
          organization_id?: string | null
          schedule_config?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_method?: string | null
          id?: string
          is_enabled?: boolean | null
          notification_type?: string | null
          organization_id?: string | null
          schedule_config?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          abandoned_at: string | null
          achievements_unlocked: Json | null
          completed_at: string | null
          completed_steps: Json | null
          completion_rate: number | null
          current_step: number | null
          device_info: Json | null
          form_data: Json | null
          id: string
          last_activity_at: string | null
          metadata: Json | null
          organization_id: string | null
          pet_shop_id: string | null
          points_earned: number | null
          skipped_steps: Json | null
          source: string | null
          started_at: string | null
          status: string | null
          step_times: Json | null
          total_steps: number | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          abandoned_at?: string | null
          achievements_unlocked?: Json | null
          completed_at?: string | null
          completed_steps?: Json | null
          completion_rate?: number | null
          current_step?: number | null
          device_info?: Json | null
          form_data?: Json | null
          id?: string
          last_activity_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          pet_shop_id?: string | null
          points_earned?: number | null
          skipped_steps?: Json | null
          source?: string | null
          started_at?: string | null
          status?: string | null
          step_times?: Json | null
          total_steps?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          abandoned_at?: string | null
          achievements_unlocked?: Json | null
          completed_at?: string | null
          completed_steps?: Json | null
          completion_rate?: number | null
          current_step?: number | null
          device_info?: Json | null
          form_data?: Json | null
          id?: string
          last_activity_at?: string | null
          metadata?: Json | null
          organization_id?: string | null
          pet_shop_id?: string | null
          points_earned?: number | null
          skipped_steps?: Json | null
          source?: string | null
          started_at?: string | null
          status?: string | null
          step_times?: Json | null
          total_steps?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "onboarding_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "onboarding_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "onboarding_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "onboarding_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_progress_pet_shop_id_fkey"
            columns: ["pet_shop_id"]
            isOneToOne: false
            referencedRelation: "pet_shops"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          catalog_item_id: string | null
          completed_date: string | null
          id: string
          notes: string | null
          order_id: string | null
          pet_id: string | null
          quantity: number | null
          scheduled_date: string | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          catalog_item_id?: string | null
          completed_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          pet_id?: string | null
          quantity?: number | null
          scheduled_date?: string | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          catalog_item_id?: string | null
          completed_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          pet_id?: string | null
          quantity?: number | null
          scheduled_date?: string | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          id: string
          notes: string | null
          order_number: string
          organization_id: string | null
          payment_method: string | null
          payment_status: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number: string
          organization_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          organization_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string | null
          id: string
          is_encrypted: boolean | null
          organization_id: string | null
          setting_category: string | null
          setting_key: string | null
          setting_value: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_encrypted?: boolean | null
          organization_id?: string | null
          setting_category?: string | null
          setting_key?: string | null
          setting_value?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_encrypted?: boolean | null
          organization_id?: string | null
          setting_category?: string | null
          setting_key?: string | null
          setting_value?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          invitation_expires_at: string | null
          invitation_token: string | null
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          permissions: Json | null
          role: string | null
          settings: Json | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          permissions?: Json | null
          role?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          permissions?: Json | null
          role?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          business_type: string | null
          city: string | null
          cnpj: string | null
          complement: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          display_name: string | null
          email: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          language: string | null
          limits: Json | null
          max_users: number | null
          max_whatsapp_instances: number | null
          name: string
          neighborhood: string | null
          number: string | null
          phone: string | null
          settings: Json | null
          slug: string
          state: string | null
          status: string | null
          street: string | null
          subscription_tier: string | null
          timezone: string | null
          trial_end_date: string | null
          updated_at: string | null
          updated_by: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          business_type?: string | null
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          display_name?: string | null
          email?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          limits?: Json | null
          max_users?: number | null
          max_whatsapp_instances?: number | null
          name: string
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          settings?: Json | null
          slug: string
          state?: string | null
          status?: string | null
          street?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          business_type?: string | null
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          display_name?: string | null
          email?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          limits?: Json | null
          max_users?: number | null
          max_whatsapp_instances?: number | null
          name?: string
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          settings?: Json | null
          slug?: string
          state?: string | null
          status?: string | null
          street?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      performance_alert_history: {
        Row: {
          alert_id: string | null
          alert_message: string
          created_at: string | null
          id: string
          is_resolved: boolean | null
          metric_value: number
          organization_id: string | null
          resolved_at: string | null
          severity: string
          threshold_value: number
        }
        Insert: {
          alert_id?: string | null
          alert_message: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          metric_value: number
          organization_id?: string | null
          resolved_at?: string | null
          severity: string
          threshold_value: number
        }
        Update: {
          alert_id?: string | null
          alert_message?: string
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          metric_value?: number
          organization_id?: string | null
          resolved_at?: string | null
          severity?: string
          threshold_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "performance_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_alert_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "performance_alert_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "performance_alert_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "performance_alert_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "performance_alert_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_alerts: {
        Row: {
          alert_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          metric_name: string
          metric_type: string
          notification_channels: Json | null
          organization_id: string | null
          severity: string | null
          threshold_operator: string | null
          threshold_value: number
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          alert_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metric_name: string
          metric_type: string
          notification_channels?: Json | null
          organization_id?: string | null
          severity?: string | null
          threshold_operator?: string | null
          threshold_value: number
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          alert_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metric_name?: string
          metric_type?: string
          notification_channels?: Json | null
          organization_id?: string | null
          severity?: string | null
          threshold_operator?: string | null
          threshold_value?: number
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "performance_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "performance_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "performance_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "performance_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          component_name: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_unit: string | null
          metric_value: number
          organization_id: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_unit?: string | null
          metric_value: number
          organization_id?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
          organization_id?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_shops: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_country: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip_code: string | null
          advance_booking_days: number | null
          appointment_duration_default: number | null
          appointment_interval: number | null
          bank_account: Json | null
          break_times: Json | null
          business_hours: Json
          business_type: string | null
          cancellation_hours: number | null
          cancellation_policy: string | null
          cnpj: string | null
          cover_image_url: string | null
          created_at: string | null
          custom_css: string | null
          dashboard_layout: string | null
          description: string | null
          email: string
          facebook: string | null
          font_family: string | null
          holidays: Json | null
          id: string
          instagram: string | null
          is_active: boolean | null
          is_verified: boolean | null
          late_policy: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          max_daily_appointments: number | null
          name: string
          organization_id: string | null
          payment_methods: Json | null
          payment_policy: string | null
          phone_primary: string
          phone_secondary: string | null
          privacy_policy: string | null
          slug: string
          tax_id: string | null
          terms_conditions: string | null
          theme_colors: Json | null
          updated_at: string | null
          verified_at: string | null
          website: string | null
          whatsapp: string
          widget_preferences: Json | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_country?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          advance_booking_days?: number | null
          appointment_duration_default?: number | null
          appointment_interval?: number | null
          bank_account?: Json | null
          break_times?: Json | null
          business_hours?: Json
          business_type?: string | null
          cancellation_hours?: number | null
          cancellation_policy?: string | null
          cnpj?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_css?: string | null
          dashboard_layout?: string | null
          description?: string | null
          email: string
          facebook?: string | null
          font_family?: string | null
          holidays?: Json | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          late_policy?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_daily_appointments?: number | null
          name: string
          organization_id?: string | null
          payment_methods?: Json | null
          payment_policy?: string | null
          phone_primary: string
          phone_secondary?: string | null
          privacy_policy?: string | null
          slug: string
          tax_id?: string | null
          terms_conditions?: string | null
          theme_colors?: Json | null
          updated_at?: string | null
          verified_at?: string | null
          website?: string | null
          whatsapp: string
          widget_preferences?: Json | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_country?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          advance_booking_days?: number | null
          appointment_duration_default?: number | null
          appointment_interval?: number | null
          bank_account?: Json | null
          break_times?: Json | null
          business_hours?: Json
          business_type?: string | null
          cancellation_hours?: number | null
          cancellation_policy?: string | null
          cnpj?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_css?: string | null
          dashboard_layout?: string | null
          description?: string | null
          email?: string
          facebook?: string | null
          font_family?: string | null
          holidays?: Json | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          late_policy?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          max_daily_appointments?: number | null
          name?: string
          organization_id?: string | null
          payment_methods?: Json | null
          payment_policy?: string | null
          phone_primary?: string
          phone_secondary?: string | null
          privacy_policy?: string | null
          slug?: string
          tax_id?: string | null
          terms_conditions?: string | null
          theme_colors?: Json | null
          updated_at?: string | null
          verified_at?: string | null
          website?: string | null
          whatsapp?: string
          widget_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_shops_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "pet_shops_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "pet_shops_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "pet_shops_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "pet_shops_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          allergies: string[] | null
          behavior_notes: string | null
          birth_date: string | null
          body_score: number | null
          breed: string | null
          coat_type: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          current_medications: string | null
          custom_fields: Json | null
          customer_id: string | null
          dietary_restrictions: string | null
          emergency_conditions: string | null
          emergency_contact: string | null
          gender: string | null
          height_cm: number | null
          id: string
          insurance_policy: string | null
          insurance_provider: string | null
          is_active: boolean | null
          is_aggressive: boolean | null
          is_neutered: boolean | null
          medical_notes: string | null
          medications: string[] | null
          metadata: Json | null
          microchip_number: string | null
          name: string
          neutered_date: string | null
          organization_id: string | null
          owner_id: string | null
          pet_code: string | null
          photo_url: string | null
          photos: string[] | null
          registration_number: string | null
          size: Database["public"]["Enums"]["pet_size"] | null
          species: Database["public"]["Enums"]["pet_species"]
          tags: string[] | null
          updated_at: string | null
          updated_by: string | null
          veterinarian_name: string | null
          veterinarian_phone: string | null
          weight: number | null
          weight_kg: number | null
        }
        Insert: {
          allergies?: string[] | null
          behavior_notes?: string | null
          birth_date?: string | null
          body_score?: number | null
          breed?: string | null
          coat_type?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          current_medications?: string | null
          custom_fields?: Json | null
          customer_id?: string | null
          dietary_restrictions?: string | null
          emergency_conditions?: string | null
          emergency_contact?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          insurance_policy?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          is_aggressive?: boolean | null
          is_neutered?: boolean | null
          medical_notes?: string | null
          medications?: string[] | null
          metadata?: Json | null
          microchip_number?: string | null
          name: string
          neutered_date?: string | null
          organization_id?: string | null
          owner_id?: string | null
          pet_code?: string | null
          photo_url?: string | null
          photos?: string[] | null
          registration_number?: string | null
          size?: Database["public"]["Enums"]["pet_size"] | null
          species?: Database["public"]["Enums"]["pet_species"]
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          veterinarian_name?: string | null
          veterinarian_phone?: string | null
          weight?: number | null
          weight_kg?: number | null
        }
        Update: {
          allergies?: string[] | null
          behavior_notes?: string | null
          birth_date?: string | null
          body_score?: number | null
          breed?: string | null
          coat_type?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          current_medications?: string | null
          custom_fields?: Json | null
          customer_id?: string | null
          dietary_restrictions?: string | null
          emergency_conditions?: string | null
          emergency_contact?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          insurance_policy?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          is_aggressive?: boolean | null
          is_neutered?: boolean | null
          medical_notes?: string | null
          medications?: string[] | null
          metadata?: Json | null
          microchip_number?: string | null
          name?: string
          neutered_date?: string | null
          organization_id?: string | null
          owner_id?: string | null
          pet_code?: string | null
          photo_url?: string | null
          photos?: string[] | null
          registration_number?: string | null
          size?: Database["public"]["Enums"]["pet_size"] | null
          species?: Database["public"]["Enums"]["pet_species"]
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          veterinarian_name?: string | null
          veterinarian_phone?: string | null
          weight?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "pets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "pets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "pets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "pets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "customer_insights_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      petshop_settings: {
        Row: {
          address: string | null
          ai_enabled: boolean | null
          ai_personality: Database["public"]["Enums"]["ai_personality"] | null
          business_hours: Json | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
          welcome_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          ai_enabled?: boolean | null
          ai_personality?: Database["public"]["Enums"]["ai_personality"] | null
          business_hours?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
          welcome_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          ai_enabled?: boolean | null
          ai_personality?: Database["public"]["Enums"]["ai_personality"] | null
          business_hours?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
          welcome_message?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          name: string
          organization_id: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          name: string
          organization_id: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          name?: string
          organization_id?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "product_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "product_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "product_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "product_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clinic_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          login_count: number | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          organization_id: string | null
          permissions: Json | null
          phone: string | null
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          organization_id?: string | null
          permissions?: Json | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          organization_id?: string | null
          permissions?: Json | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_analytics: {
        Row: {
          average_appointment_value: number | null
          calculated_at: string | null
          cancellation_count: number | null
          consultation_revenue: number | null
          created_at: string | null
          customer_growth_rate: number | null
          id: string
          lost_customers: number | null
          medication_revenue: number | null
          metadata: Json | null
          new_customers: number | null
          no_show_count: number | null
          organization_id: string | null
          period_end: string
          period_start: string
          period_type: string
          returning_customers: number | null
          revenue_growth_rate: number | null
          surgery_revenue: number | null
          total_appointments: number | null
          total_revenue: number | null
          treatment_revenue: number | null
          updated_at: string | null
          utilization_rate: number | null
        }
        Insert: {
          average_appointment_value?: number | null
          calculated_at?: string | null
          cancellation_count?: number | null
          consultation_revenue?: number | null
          created_at?: string | null
          customer_growth_rate?: number | null
          id?: string
          lost_customers?: number | null
          medication_revenue?: number | null
          metadata?: Json | null
          new_customers?: number | null
          no_show_count?: number | null
          organization_id?: string | null
          period_end: string
          period_start: string
          period_type: string
          returning_customers?: number | null
          revenue_growth_rate?: number | null
          surgery_revenue?: number | null
          total_appointments?: number | null
          total_revenue?: number | null
          treatment_revenue?: number | null
          updated_at?: string | null
          utilization_rate?: number | null
        }
        Update: {
          average_appointment_value?: number | null
          calculated_at?: string | null
          cancellation_count?: number | null
          consultation_revenue?: number | null
          created_at?: string | null
          customer_growth_rate?: number | null
          id?: string
          lost_customers?: number | null
          medication_revenue?: number | null
          metadata?: Json | null
          new_customers?: number | null
          no_show_count?: number | null
          organization_id?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          returning_customers?: number | null
          revenue_growth_rate?: number | null
          surgery_revenue?: number | null
          total_appointments?: number | null
          total_revenue?: number | null
          treatment_revenue?: number | null
          updated_at?: string | null
          utilization_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "revenue_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "revenue_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "revenue_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "revenue_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          catalog_item_id: string | null
          created_at: string | null
          custom_fields: Json | null
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          is_service: boolean | null
          item_code: string | null
          item_description: string | null
          item_name: string
          line_total: number
          notes: string | null
          original_price: number | null
          quantity: number
          requires_delivery: boolean | null
          sales_order_id: string
          unit_price: number
        }
        Insert: {
          catalog_item_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          is_service?: boolean | null
          item_code?: string | null
          item_description?: string | null
          item_name: string
          line_total: number
          notes?: string | null
          original_price?: number | null
          quantity?: number
          requires_delivery?: boolean | null
          sales_order_id: string
          unit_price: number
        }
        Update: {
          catalog_item_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          is_service?: boolean | null
          item_code?: string | null
          item_description?: string | null
          item_name?: string
          line_total?: number
          notes?: string | null
          original_price?: number | null
          quantity?: number
          requires_delivery?: boolean | null
          sales_order_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          appointment_id: string | null
          cancellation_reason: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          custom_fields: Json | null
          customer_id: string | null
          customer_notes: string | null
          delivery_address: Json | null
          delivery_date: string | null
          delivery_method: string | null
          discount_amount: number | null
          discount_percentage: number | null
          due_date: string | null
          external_reference: string | null
          id: string
          internal_notes: string | null
          order_date: string | null
          order_number: string
          organization_id: string
          payment_method: string | null
          payment_status: string | null
          payment_terms: number | null
          shipping_amount: number | null
          status: string | null
          subtotal: number | null
          tags: string[] | null
          tax_amount: number | null
          total_amount: number | null
          tracking_code: string | null
          updated_at: string | null
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          custom_fields?: Json | null
          customer_id?: string | null
          customer_notes?: string | null
          delivery_address?: Json | null
          delivery_date?: string | null
          delivery_method?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          external_reference?: string | null
          id?: string
          internal_notes?: string | null
          order_date?: string | null
          order_number: string
          organization_id: string
          payment_method?: string | null
          payment_status?: string | null
          payment_terms?: number | null
          shipping_amount?: number | null
          status?: string | null
          subtotal?: number | null
          tags?: string[] | null
          tax_amount?: number | null
          total_amount?: number | null
          tracking_code?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          custom_fields?: Json | null
          customer_id?: string | null
          customer_notes?: string | null
          delivery_address?: Json | null
          delivery_date?: string | null
          delivery_method?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          external_reference?: string | null
          id?: string
          internal_notes?: string | null
          order_date?: string | null
          order_number?: string
          organization_id?: string
          payment_method?: string | null
          payment_status?: string | null
          payment_terms?: number | null
          shipping_amount?: number | null
          status?: string | null
          subtotal?: number | null
          tags?: string[] | null
          tax_amount?: number | null
          total_amount?: number | null
          tracking_code?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_configurations: {
        Row: {
          allowed_ip_ranges: string[] | null
          audit_level: string | null
          blocked_ip_ranges: string[] | null
          created_at: string | null
          data_retention_days: number | null
          encryption_at_rest: boolean | null
          id: string
          lockout_duration_minutes: number | null
          max_failed_login_attempts: number | null
          organization_id: string | null
          password_policy: Json | null
          require_mfa: boolean | null
          session_timeout_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          allowed_ip_ranges?: string[] | null
          audit_level?: string | null
          blocked_ip_ranges?: string[] | null
          created_at?: string | null
          data_retention_days?: number | null
          encryption_at_rest?: boolean | null
          id?: string
          lockout_duration_minutes?: number | null
          max_failed_login_attempts?: number | null
          organization_id?: string | null
          password_policy?: Json | null
          require_mfa?: boolean | null
          session_timeout_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          allowed_ip_ranges?: string[] | null
          audit_level?: string | null
          blocked_ip_ranges?: string[] | null
          created_at?: string | null
          data_retention_days?: number | null
          encryption_at_rest?: boolean | null
          id?: string
          lockout_duration_minutes?: number | null
          max_failed_login_attempts?: number | null
          organization_id?: string | null
          password_policy?: Json | null
          require_mfa?: boolean | null
          session_timeout_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "security_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "security_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "security_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "security_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          notes: string | null
          organization_id: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          notes?: string | null
          organization_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          notes?: string | null
          organization_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "security_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "security_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "security_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "security_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          age_restrictions: Json | null
          available_days: number[] | null
          available_hours: Json | null
          base_price: number | null
          buffer_time_minutes: number | null
          category: string | null
          code: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          default_duration_minutes: number | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_pets_per_appointment: number | null
          name: string
          organization_id: string
          preparation_time_minutes: number | null
          price_by_size: Json | null
          price_per_pet: number | null
          requires_fasting: boolean | null
          requires_preparation: boolean | null
          requires_vaccination_record: boolean | null
          special_requirements: string | null
          tags: string[] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          age_restrictions?: Json | null
          available_days?: number[] | null
          available_hours?: Json | null
          base_price?: number | null
          buffer_time_minutes?: number | null
          category?: string | null
          code?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          default_duration_minutes?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_pets_per_appointment?: number | null
          name: string
          organization_id: string
          preparation_time_minutes?: number | null
          price_by_size?: Json | null
          price_per_pet?: number | null
          requires_fasting?: boolean | null
          requires_preparation?: boolean | null
          requires_vaccination_record?: boolean | null
          special_requirements?: string | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          age_restrictions?: Json | null
          available_days?: number[] | null
          available_hours?: Json | null
          base_price?: number | null
          buffer_time_minutes?: number | null
          category?: string | null
          code?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          default_duration_minutes?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_pets_per_appointment?: number | null
          name?: string
          organization_id?: string
          preparation_time_minutes?: number | null
          price_by_size?: Json | null
          price_per_pet?: number | null
          requires_fasting?: boolean | null
          requires_preparation?: boolean | null
          requires_vaccination_record?: boolean | null
          special_requirements?: string | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "service_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "service_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "service_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "service_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          organization_id: string | null
          preparation_instructions: string | null
          price: number
          requires_appointment: boolean | null
          requires_fasting: boolean | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          organization_id?: string | null
          preparation_instructions?: string | null
          price: number
          requires_appointment?: boolean | null
          requires_fasting?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          preparation_instructions?: string | null
          price?: number
          requires_appointment?: boolean | null
          requires_fasting?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      slo_tracking: {
        Row: {
          budget_remaining: number | null
          burn_rate: number | null
          id: string
          last_evaluated: string | null
          name: string
          organization_id: string | null
          sli_name: string
          status: string | null
          target: number
          time_window: string
          timestamp: string | null
        }
        Insert: {
          budget_remaining?: number | null
          burn_rate?: number | null
          id?: string
          last_evaluated?: string | null
          name: string
          organization_id?: string | null
          sli_name: string
          status?: string | null
          target: number
          time_window: string
          timestamp?: string | null
        }
        Update: {
          budget_remaining?: number | null
          burn_rate?: number | null
          id?: string
          last_evaluated?: string | null
          name?: string
          organization_id?: string | null
          sli_name?: string
          status?: string | null
          target?: number
          time_window?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slo_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "slo_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "slo_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "slo_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "slo_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      special_dates: {
        Row: {
          allow_appointments: boolean | null
          color: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          id: string
          is_closed: boolean | null
          max_appointments: number | null
          name: string
          organization_id: string
          recurring_yearly: boolean | null
          special_close_time: string | null
          special_open_time: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          allow_appointments?: boolean | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          is_closed?: boolean | null
          max_appointments?: number | null
          name: string
          organization_id: string
          recurring_yearly?: boolean | null
          special_close_time?: string | null
          special_open_time?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_appointments?: boolean | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          is_closed?: boolean | null
          max_appointments?: number | null
          name?: string
          organization_id?: string
          recurring_yearly?: boolean | null
          special_close_time?: string | null
          special_open_time?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_dates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "special_dates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "special_dates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "special_dates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "special_dates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          city: string | null
          cnpj: string | null
          complement: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          custom_fields: Json | null
          delivery_performance: number | null
          discount_percentage: number | null
          display_name: string | null
          email: string | null
          id: string
          ie: string | null
          is_active: boolean | null
          name: string
          neighborhood: string | null
          notes: string | null
          number: string | null
          organization_id: string
          payment_terms: number | null
          phone: string | null
          priority_level: string | null
          rating: number | null
          state: string | null
          street: string | null
          supplier_code: string | null
          tags: string[] | null
          updated_at: string | null
          updated_by: string | null
          website: string | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          custom_fields?: Json | null
          delivery_performance?: number | null
          discount_percentage?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          ie?: string | null
          is_active?: boolean | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          organization_id: string
          payment_terms?: number | null
          phone?: string | null
          priority_level?: string | null
          rating?: number | null
          state?: string | null
          street?: string | null
          supplier_code?: string | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          custom_fields?: Json | null
          delivery_performance?: number | null
          discount_percentage?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          ie?: string | null
          is_active?: boolean | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          organization_id?: string
          payment_terms?: number | null
          phone?: string | null
          priority_level?: string | null
          rating?: number | null
          state?: string | null
          street?: string | null
          supplier_code?: string | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_metrics: {
        Row: {
          active_realtime_connections: number | null
          api_error_rate: number | null
          api_requests_per_minute: number | null
          cpu_usage_percentage: number | null
          created_at: string | null
          database_connections_active: number | null
          database_connections_max: number | null
          database_query_avg_duration: number | null
          database_slow_queries_count: number | null
          id: string
          memory_usage_mb: number | null
          metric_timestamp: string | null
          storage_used_gb: number | null
        }
        Insert: {
          active_realtime_connections?: number | null
          api_error_rate?: number | null
          api_requests_per_minute?: number | null
          cpu_usage_percentage?: number | null
          created_at?: string | null
          database_connections_active?: number | null
          database_connections_max?: number | null
          database_query_avg_duration?: number | null
          database_slow_queries_count?: number | null
          id?: string
          memory_usage_mb?: number | null
          metric_timestamp?: string | null
          storage_used_gb?: number | null
        }
        Update: {
          active_realtime_connections?: number | null
          api_error_rate?: number | null
          api_requests_per_minute?: number | null
          cpu_usage_percentage?: number | null
          created_at?: string | null
          database_connections_active?: number | null
          database_connections_max?: number | null
          database_query_avg_duration?: number | null
          database_slow_queries_count?: number | null
          id?: string
          memory_usage_mb?: number | null
          metric_timestamp?: string | null
          storage_used_gb?: number | null
        }
        Relationships: []
      }
      telemetry_events: {
        Row: {
          event_data: Json | null
          event_name: string
          id: string
          organization_id: string | null
          session_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          event_data?: Json | null
          event_name: string
          id?: string
          organization_id?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          event_data?: Json | null
          event_name?: string
          id?: string
          organization_id?: string | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "telemetry_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "telemetry_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "telemetry_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "telemetry_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number | null
          review: string | null
          theme_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating?: number | null
          review?: string | null
          theme_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number | null
          review?: string | null
          theme_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "theme_ratings_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "custom_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_customizations: {
        Row: {
          created_at: string | null
          customization_key: string
          customization_type: string
          customization_value: Json
          id: string
          is_enabled: boolean | null
          position: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customization_key: string
          customization_type: string
          customization_value: Json
          id?: string
          is_enabled?: boolean | null
          position?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customization_key?: string
          customization_type?: string
          customization_value?: Json
          id?: string
          is_enabled?: boolean | null
          position?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          accessibility: Json | null
          created_at: string | null
          dashboard_layout: Json | null
          id: string
          language: string | null
          notifications: Json | null
          theme_config: Json | null
          theme_id: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accessibility?: Json | null
          created_at?: string | null
          dashboard_layout?: Json | null
          id?: string
          language?: string | null
          notifications?: Json | null
          theme_config?: Json | null
          theme_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accessibility?: Json | null
          created_at?: string | null
          dashboard_layout?: Json | null
          id?: string
          language?: string | null
          notifications?: Json | null
          theme_config?: Json | null
          theme_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string | null
          department: string | null
          display_name: string | null
          email_verified_at: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          phone: string | null
          phone_verified_at: string | null
          preferred_language: string | null
          preferred_timezone: string | null
          specialties: string[] | null
          theme: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          email_verified_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          preferred_language?: string | null
          preferred_timezone?: string | null
          specialties?: string[] | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          email_verified_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          phone?: string | null
          phone_verified_at?: string | null
          preferred_language?: string | null
          preferred_timezone?: string | null
          specialties?: string[] | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity_at: string | null
          logout_reason: string | null
          organization_id: string | null
          refresh_token: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity_at?: string | null
          logout_reason?: string | null
          organization_id?: string | null
          refresh_token?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity_at?: string | null
          logout_reason?: string | null
          organization_id?: string | null
          refresh_token?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          organization_id: string | null
          permissions: Json | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login?: string | null
          organization_id?: string | null
          permissions?: Json | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          organization_id?: string | null
          permissions?: Json | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          instance_id: string | null
          metadata: Json | null
          organization_id: string | null
          payload: Json
          processed: boolean | null
          processed_at: string | null
          rate_limit_exceeded: boolean | null
          retry_count: number | null
          signature_verification: boolean | null
          source: string | null
          source_ip: unknown | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          instance_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          rate_limit_exceeded?: boolean | null
          retry_count?: number | null
          signature_verification?: boolean | null
          source?: string | null
          source_ip?: unknown | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          instance_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          rate_limit_exceeded?: boolean | null
          retry_count?: number | null
          signature_verification?: boolean | null
          source?: string | null
          source_ip?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "webhook_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "webhook_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "webhook_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "webhook_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          job_id: string | null
          message_content: string | null
          payload: Json | null
          phone_number: string | null
          processed_at: string | null
          source: string
          webhook_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          job_id?: string | null
          message_content?: string | null
          payload?: Json | null
          phone_number?: string | null
          processed_at?: string | null
          source: string
          webhook_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          job_id?: string | null
          message_content?: string | null
          payload?: Json | null
          phone_number?: string | null
          processed_at?: string | null
          source?: string
          webhook_id?: string
        }
        Relationships: []
      }
      whatsapp_auto_replies: {
        Row: {
          conditions: Json | null
          created_at: string | null
          id: string
          instance_id: string | null
          is_active: boolean | null
          priority: number | null
          reply_data: Json | null
          reply_message: string
          reply_type: string | null
          trigger_type: string
          trigger_value: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          priority?: number | null
          reply_data?: Json | null
          reply_message: string
          reply_type?: string | null
          trigger_type: string
          trigger_value?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          priority?: number | null
          reply_data?: Json | null
          reply_message?: string
          reply_type?: string | null
          trigger_type?: string
          trigger_value?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_auto_replies_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_broadcasts: {
        Row: {
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          failed_count: number | null
          filter_criteria: Json | null
          id: string
          instance_id: string | null
          media_url: string | null
          message_content: string
          message_type: string | null
          name: string
          organization_id: string | null
          scheduled_at: string | null
          sent_count: number | null
          status: string | null
          target_contacts: Json | null
          total_contacts: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          filter_criteria?: Json | null
          id?: string
          instance_id?: string | null
          media_url?: string | null
          message_content: string
          message_type?: string | null
          name: string
          organization_id?: string | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_contacts?: Json | null
          total_contacts?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          failed_count?: number | null
          filter_criteria?: Json | null
          id?: string
          instance_id?: string | null
          media_url?: string | null
          message_content?: string
          message_type?: string | null
          name?: string
          organization_id?: string | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_contacts?: Json | null
          total_contacts?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_broadcasts_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_broadcasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_broadcasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_broadcasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_broadcasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_broadcasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          about: string | null
          address: string | null
          birth_date: string | null
          created_at: string | null
          customer_id: string | null
          customer_since: string | null
          email: string | null
          emergency_contact: string | null
          group_metadata: Json | null
          id: string
          is_business: boolean | null
          is_group: boolean | null
          last_seen: string | null
          metadata: Json | null
          name: string | null
          notes: string | null
          organization_id: string | null
          phone: string
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"] | null
          preferred_contact_time: string | null
          profile_picture_url: string | null
          push_name: string | null
          status: string | null
          tags: string[] | null
          total_spent: number | null
          updated_at: string | null
          visit_count: number | null
        }
        Insert: {
          about?: string | null
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_since?: string | null
          email?: string | null
          emergency_contact?: string | null
          group_metadata?: Json | null
          id?: string
          is_business?: boolean | null
          is_group?: boolean | null
          last_seen?: string | null
          metadata?: Json | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          phone: string
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          preferred_contact_time?: string | null
          profile_picture_url?: string | null
          push_name?: string | null
          status?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string | null
          visit_count?: number | null
        }
        Update: {
          about?: string | null
          address?: string | null
          birth_date?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_since?: string | null
          email?: string | null
          emergency_contact?: string | null
          group_metadata?: Json | null
          id?: string
          is_business?: boolean | null
          is_group?: boolean | null
          last_seen?: string | null
          metadata?: Json | null
          name?: string | null
          notes?: string | null
          organization_id?: string | null
          phone?: string
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          preferred_contact_time?: string | null
          profile_picture_url?: string | null
          push_name?: string | null
          status?: string | null
          tags?: string[] | null
          total_spent?: number | null
          updated_at?: string | null
          visit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          assigned_to: string | null
          chat_id: string
          contact_id: string | null
          created_at: string | null
          id: string
          instance_id: string | null
          is_archived: boolean | null
          is_group: boolean | null
          is_muted: boolean | null
          is_pinned: boolean | null
          labels: string[] | null
          last_message_content: string | null
          last_message_id: string | null
          last_message_time: string | null
          metadata: Json | null
          organization_id: string | null
          status: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          chat_id: string
          contact_id?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_archived?: boolean | null
          is_group?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          labels?: string[] | null
          last_message_content?: string | null
          last_message_id?: string | null
          last_message_time?: string | null
          metadata?: Json | null
          organization_id?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          chat_id?: string
          contact_id?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_archived?: boolean | null
          is_group?: boolean | null
          is_muted?: boolean | null
          is_pinned?: boolean | null
          labels?: string[] | null
          last_message_content?: string | null
          last_message_id?: string | null
          last_message_time?: string | null
          metadata?: Json | null
          organization_id?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_insights_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instance_settings: {
        Row: {
          ai_enabled: boolean | null
          auto_reply: boolean | null
          away_message: string | null
          business_hours: Json | null
          created_at: string | null
          id: string
          instance_id: string | null
          max_daily_messages: number | null
          updated_at: string | null
          webhook_events: Json | null
          welcome_message: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          auto_reply?: boolean | null
          away_message?: string | null
          business_hours?: Json | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          max_daily_messages?: number | null
          updated_at?: string | null
          webhook_events?: Json | null
          welcome_message?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          auto_reply?: boolean | null
          away_message?: string | null
          business_hours?: Json | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          max_daily_messages?: number | null
          updated_at?: string | null
          webhook_events?: Json | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instance_settings_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          api_key: string | null
          connection_status: string | null
          created_at: string | null
          id: string
          instance_id: string | null
          instance_name: string
          is_connected: boolean | null
          is_primary: boolean | null
          last_heartbeat: string | null
          metadata: Json | null
          organization_id: string | null
          phone_number: string | null
          qr_code: string | null
          status: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          api_key?: string | null
          connection_status?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          instance_name: string
          is_connected?: boolean | null
          is_primary?: boolean | null
          last_heartbeat?: string | null
          metadata?: Json | null
          organization_id?: string | null
          phone_number?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_key?: string | null
          connection_status?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string | null
          instance_name?: string
          is_connected?: boolean | null
          is_primary?: boolean | null
          last_heartbeat?: string | null
          metadata?: Json | null
          organization_id?: string | null
          phone_number?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          external_id: string | null
          id: string
          instance_id: string | null
          last_error: string | null
          max_attempts: number | null
          media_caption: string | null
          media_url: string | null
          message_content: string | null
          message_type: string | null
          metadata: Json | null
          organization_id: string | null
          priority: number | null
          scheduled_at: string | null
          status: string | null
          template_data: Json | null
          to_number: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          instance_id?: string | null
          last_error?: string | null
          max_attempts?: number | null
          media_caption?: string | null
          media_url?: string | null
          message_content?: string | null
          message_type?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: number | null
          scheduled_at?: string | null
          status?: string | null
          template_data?: Json | null
          to_number: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          instance_id?: string | null
          last_error?: string | null
          max_attempts?: number | null
          media_caption?: string | null
          media_url?: string | null
          message_content?: string | null
          message_type?: string | null
          metadata?: Json | null
          organization_id?: string | null
          priority?: number | null
          scheduled_at?: string | null
          status?: string | null
          template_data?: Json | null
          to_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_queue_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_message_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_message_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_message_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_message_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_stats: {
        Row: {
          ai_responses: number | null
          avg_response_time_seconds: number | null
          conversations_resolved: number | null
          conversations_started: number | null
          created_at: string | null
          date: string
          human_responses: number | null
          id: string
          instance_id: string | null
          messages_failed: number | null
          messages_received: number | null
          messages_sent: number | null
          organization_id: string | null
        }
        Insert: {
          ai_responses?: number | null
          avg_response_time_seconds?: number | null
          conversations_resolved?: number | null
          conversations_started?: number | null
          created_at?: string | null
          date: string
          human_responses?: number | null
          id?: string
          instance_id?: string | null
          messages_failed?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          organization_id?: string | null
        }
        Update: {
          ai_responses?: number | null
          avg_response_time_seconds?: number | null
          conversations_resolved?: number | null
          conversations_started?: number | null
          created_at?: string | null
          date?: string
          human_responses?: number | null
          id?: string
          instance_id?: string | null
          messages_failed?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_stats_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_message_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_message_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_message_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_message_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          caption: string | null
          content: string | null
          conversation_id: string | null
          created_at: string | null
          direction: string | null
          forwarded: boolean | null
          from_number: string
          id: string
          instance_id: string | null
          is_from_me: boolean | null
          is_read: boolean | null
          media_type: string | null
          media_url: string | null
          message_id: string
          message_type: string | null
          metadata: Json | null
          notes: string | null
          organization_id: string | null
          quoted_message_id: string | null
          status: string | null
          timestamp: string
          to_number: string
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          direction?: string | null
          forwarded?: boolean | null
          from_number: string
          id?: string
          instance_id?: string | null
          is_from_me?: boolean | null
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          message_id: string
          message_type?: string | null
          metadata?: Json | null
          notes?: string | null
          organization_id?: string | null
          quoted_message_id?: string | null
          status?: string | null
          timestamp: string
          to_number: string
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          direction?: string | null
          forwarded?: boolean | null
          from_number?: string
          id?: string
          instance_id?: string | null
          is_from_me?: boolean | null
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          message_id?: string
          message_type?: string | null
          metadata?: Json | null
          notes?: string | null
          organization_id?: string | null
          quoted_message_id?: string | null
          status?: string | null
          timestamp?: string
          to_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      customer_insights_view: {
        Row: {
          appointment_count: number | null
          customer_since: string | null
          email: string | null
          id: string | null
          last_appointment_date: string | null
          name: string | null
          organization_id: string | null
          pet_count: number | null
          phone: string | null
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"] | null
          total_spent: number | null
          visit_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_metrics: {
        Row: {
          messages_today: number | null
          organization_id: string | null
          organization_name: string | null
          total_appointments: number | null
          total_customers: number | null
          total_messages: number | null
          total_pets: number | null
          upcoming_appointments: number | null
        }
        Relationships: []
      }
      dashboard_stats_secure_view: {
        Row: {
          active_clients: number | null
          active_conversations: number | null
          active_pets: number | null
          ai_responses_today: number | null
          annual_revenue: number | null
          completion_rate_percent: number | null
          confirmed_appointments: number | null
          conversations_today: number | null
          daily_appointments: number | null
          daily_cancelled: number | null
          daily_completed: number | null
          daily_revenue: number | null
          inactive_clients: number | null
          inbound_messages_today: number | null
          last_updated: string | null
          messages_today: number | null
          metric_date: string | null
          monthly_revenue: number | null
          new_clients_today: number | null
          new_pets_today: number | null
          organization_id: string | null
          outbound_messages_today: number | null
          recent_activity_clients: number | null
          response_rate_percent: number | null
          scheduled_appointments: number | null
          total_cats: number | null
          total_conversations: number | null
          total_dogs: number | null
          total_messages: number | null
          total_pets: number | null
          unread_conversations: number | null
        }
        Relationships: []
      }
      dashboard_stats_view: {
        Row: {
          active_clients: number | null
          active_conversations: number | null
          active_pets: number | null
          ai_responses_today: number | null
          annual_revenue: number | null
          completion_rate_percent: number | null
          confirmed_appointments: number | null
          conversations_today: number | null
          daily_appointments: number | null
          daily_cancelled: number | null
          daily_completed: number | null
          daily_revenue: number | null
          inactive_clients: number | null
          inbound_messages_today: number | null
          last_updated: string | null
          messages_today: number | null
          metric_date: string | null
          monthly_revenue: number | null
          new_clients_today: number | null
          new_pets_today: number | null
          organization_id: string | null
          outbound_messages_today: number | null
          recent_activity_clients: number | null
          response_rate_percent: number | null
          scheduled_appointments: number | null
          total_cats: number | null
          total_conversations: number | null
          total_dogs: number | null
          total_messages: number | null
          total_pets: number | null
          unread_conversations: number | null
        }
        Relationships: []
      }
      etl_dashboard_view: {
        Row: {
          avg_churn_risk: number | null
          avg_engagement_score: number | null
          avg_quality_score: number | null
          avg_utilization: number | null
          calculated_at: string | null
          customers_with_insights: number | null
          executions_last_24h: number | null
          failed_quality_checks: number | null
          last_successful_run: string | null
          message_processing_percentage: number | null
          organization_id: string | null
          organization_name: string | null
          pending_messages: number | null
          processed_messages: number | null
          revenue_periods_calculated: number | null
          successful_executions_last_24h: number | null
          total_customers: number | null
          total_messages: number | null
          total_quality_checks: number | null
          ytd_revenue: number | null
        }
        Relationships: []
      }
      revenue_metrics_view: {
        Row: {
          appointment_count: number | null
          average_appointment_value: number | null
          month: string | null
          organization_id: string | null
          total_revenue: number | null
          unique_clients: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_secure_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "etl_dashboard_view"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      analyze_index_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          idx_scan: number
          idx_tup_fetch: number
          idx_tup_read: number
          indexname: string
          schemaname: string
          tablename: string
          usage_ratio: number
        }[]
      }
      can_access_organization_data: {
        Args: { org_id: string }
        Returns: boolean
      }
      can_access_organization_data_optimized: {
        Args: { org_id: string }
        Returns: boolean
      }
      can_access_record: {
        Args: { user_id: string }
        Returns: boolean
      }
      check_performance_thresholds: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_etl_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      cleanup_old_audit_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      create_default_organization_for_user: {
        Args: { org_name?: string; org_slug?: string; user_id: string }
        Returns: string
      }
      create_user_with_organization: {
        Args: {
          org_name: string
          org_subscription_tier?: string
          user_email: string
          user_full_name: string
          user_id: string
        }
        Returns: Json
      }
      execute_sql: {
        Args: { params?: string[]; query: string }
        Returns: Json
      }
      get_active_performance_issues: {
        Args: { p_organization_id?: string }
        Returns: {
          alert_name: string
          component_name: string
          created_at: string
          current_value: number
          duration_minutes: number
          metric_name: string
          metric_type: string
          severity: string
          threshold_value: number
        }[]
      }
      get_appointments_report: {
        Args: { end_date?: string; org_id: string; start_date?: string }
        Returns: Json
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never> | { org_id: string }
        Returns: Json
      }
      get_dashboard_summary_optimized: {
        Args: { org_id: string }
        Returns: Json
      }
      get_etl_health_status: {
        Args: { org_id: string }
        Returns: Json
      }
      get_etl_performance_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_duration_ms: number
          avg_records_processed: number
          last_execution: string
          max_duration_ms: number
          min_duration_ms: number
          pipeline_name: string
          success_rate: number
          total_executions: number
        }[]
      }
      get_message_analytics: {
        Args: { days?: number; org_id: string }
        Returns: Json
      }
      get_or_create_contact: {
        Args: { p_name?: string; p_phone: string; p_push_name?: string }
        Returns: string
      }
      get_or_create_conversation: {
        Args: { p_chat_id: string; p_contact_id: string; p_instance_id: string }
        Returns: string
      }
      get_performance_summary: {
        Args: { p_hours_back?: number; p_organization_id: string }
        Returns: {
          avg_value: number
          max_value: number
          metric_name: string
          metric_type: string
          min_value: number
          p95_value: number
          sample_count: number
          trend_direction: string
        }[]
      }
      get_pipeline_statistics: {
        Args: { days_back?: number; org_id?: string }
        Returns: Json
      }
      get_slow_etl_pipelines: {
        Args: { threshold_ms?: number }
        Returns: {
          duration_ms: number
          error_message: string
          execution_id: string
          pipeline_name: string
          records_processed: number
          start_time: string
        }[]
      }
      get_table_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          idx_scan: number
          row_count: number
          seq_scan: number
          table_name: string
          table_size: string
        }[]
      }
      get_theme_stats: {
        Args: { theme_id_param: string }
        Returns: {
          downloads: number
          rating_avg: number
          rating_count: number
        }[]
      }
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      increment_theme_downloads: {
        Args: { theme_id_param: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_organization_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_organization_member: {
        Args: { org_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_event_data?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_organization_id: string
          p_severity: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      process_message_queue: {
        Args: { batch_size?: number }
        Returns: Json
      }
      record_performance_metric: {
        Args: {
          p_component_name?: string
          p_metadata?: Json
          p_metric_name: string
          p_metric_type: string
          p_metric_unit?: string
          p_metric_value: number
          p_organization_id: string
          p_session_id?: string
          p_user_agent?: string
        }
        Returns: string
      }
      refresh_dashboard_stats_view_optimized: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_dashboard_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      run_data_quality_check_optimized: {
        Args: { table_name_param: string }
        Returns: Json
      }
      set_organization_id_from_user: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_system_health_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      user_belongs_to_organization: {
        Args: { org_id: string }
        Returns: boolean
      }
      user_can_access_organization_data: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_has_role: {
        Args: { required_roles: string[] }
        Returns: boolean
      }
      validate_rls_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_organization_column: boolean
          policy_count: number
          rls_enabled: boolean
          status: string
          table_name: string
        }[]
      }
    }
    Enums: {
      ai_personality:
        | "professional"
        | "friendly"
        | "empathetic"
        | "technical"
        | "casual"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      interaction_type:
        | "whatsapp"
        | "call"
        | "email"
        | "visit"
        | "sale"
        | "service"
        | "complaint"
      notification_type:
        | "appointment_reminder"
        | "vaccine_due"
        | "birthday"
        | "promotion"
        | "follow_up"
      pet_size: "toy" | "small" | "medium" | "large" | "giant"
      pet_species:
        | "dog"
        | "cat"
        | "bird"
        | "fish"
        | "rabbit"
        | "hamster"
        | "turtle"
        | "other"
      pipeline_stage:
        | "lead"
        | "contact"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      user_role: "admin" | "medico" | "recepcao"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_personality: [
        "professional",
        "friendly",
        "empathetic",
        "technical",
        "casual",
      ],
      appointment_status: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      interaction_type: [
        "whatsapp",
        "call",
        "email",
        "visit",
        "sale",
        "service",
        "complaint",
      ],
      notification_type: [
        "appointment_reminder",
        "vaccine_due",
        "birthday",
        "promotion",
        "follow_up",
      ],
      pet_size: ["toy", "small", "medium", "large", "giant"],
      pet_species: [
        "dog",
        "cat",
        "bird",
        "fish",
        "rabbit",
        "hamster",
        "turtle",
        "other",
      ],
      pipeline_stage: [
        "lead",
        "contact",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      user_role: ["admin", "medico", "recepcao"],
    },
  },
} as const
