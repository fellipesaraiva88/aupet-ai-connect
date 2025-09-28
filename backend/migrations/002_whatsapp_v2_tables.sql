-- Migrations for WhatsApp v2 implementation
-- Run this on Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create whatsapp_instances table
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL UNIQUE,
  provider_type TEXT NOT NULL DEFAULT 'evolution',
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connecting', 'connected', 'disconnected', 'reconnecting', 'failed')),
  phone_number TEXT,
  session_data JSONB,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_business_instance UNIQUE (business_id, instance_name)
);

-- Create message_history table
CREATE TABLE IF NOT EXISTS message_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'received')),
  message_id TEXT,
  quoted_message_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for performance
  INDEX idx_message_history_instance_chat (instance_id, chat_id),
  INDEX idx_message_history_created (created_at DESC),
  INDEX idx_message_history_direction (direction),
  INDEX idx_message_history_status (status)
);

-- Create consent_records table for LGPD/GDPR compliance
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('marketing', 'support', 'transactional', 'all')),
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  source TEXT, -- WhatsApp, website, etc.
  metadata JSONB,

  CONSTRAINT unique_phone_business_type UNIQUE (phone_number, business_id, consent_type)
);

-- Create audit_logs table for compliance tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT, -- 'message', 'instance', 'consent', etc.
  resource_id TEXT,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for compliance queries
  INDEX idx_audit_logs_business (business_id),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_created (created_at DESC),
  INDEX idx_audit_logs_resource (resource_type, resource_id)
);

-- Create queue_jobs table for message queue persistence
CREATE TABLE IF NOT EXISTS queue_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_name TEXT NOT NULL,
  job_id TEXT NOT NULL UNIQUE,
  job_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed', 'delayed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  delay_until TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for queue performance
  INDEX idx_queue_jobs_queue_status (queue_name, status),
  INDEX idx_queue_jobs_delay (delay_until) WHERE status = 'delayed',
  INDEX idx_queue_jobs_created (created_at)
);

-- Create message_templates table for automated responses
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_keywords TEXT[], -- Array of keywords that trigger this template
  template_type TEXT NOT NULL CHECK (template_type IN ('text', 'media', 'interactive', 'list')),
  content JSONB NOT NULL, -- Template content (text, buttons, list items, etc.)
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1, -- Higher number = higher priority
  conditions JSONB, -- Additional conditions for triggering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_business_template_name UNIQUE (business_id, name)
);

-- Create conversation_context table for AI context management
CREATE TABLE IF NOT EXISTS conversation_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL,
  context_data JSONB NOT NULL,
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),

  CONSTRAINT unique_instance_chat UNIQUE (instance_id, chat_id),
  INDEX idx_conversation_context_expires (expires_at)
);

-- Create contact_profiles table for customer information
CREATE TABLE IF NOT EXISTS contact_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  name TEXT,
  profile_pic_url TEXT,
  last_seen TIMESTAMPTZ,
  is_blocked BOOLEAN DEFAULT false,
  tags TEXT[],
  custom_fields JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_business_phone UNIQUE (business_id, phone_number),
  INDEX idx_contact_profiles_phone (phone_number),
  INDEX idx_contact_profiles_tags USING GIN (tags)
);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_profiles_updated_at
  BEFORE UPDATE ON contact_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies - these need to be adjusted based on your auth system
-- Example policies (adjust according to your user/business model):

-- Policy for whatsapp_instances
CREATE POLICY "Users can access instances from their business" ON whatsapp_instances
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM user_businesses
      WHERE user_id = auth.uid()
    )
  );

-- Policy for message_history
CREATE POLICY "Users can access messages from their instances" ON message_history
  FOR ALL USING (
    instance_id IN (
      SELECT wi.id FROM whatsapp_instances wi
      JOIN user_businesses ub ON wi.business_id = ub.business_id
      WHERE ub.user_id = auth.uid()
    )
  );

-- Policy for consent_records
CREATE POLICY "Users can access consent records from their business" ON consent_records
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM user_businesses
      WHERE user_id = auth.uid()
    )
  );

-- Policy for message_templates
CREATE POLICY "Users can access templates from their business" ON message_templates
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM user_businesses
      WHERE user_id = auth.uid()
    )
  );

-- Policy for contact_profiles
CREATE POLICY "Users can access contacts from their business" ON contact_profiles
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM user_businesses
      WHERE user_id = auth.uid()
    )
  );

-- Cleanup function for old records (call periodically)
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS void AS $$
BEGIN
  -- Clean up old audit logs (keep last 90 days)
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Clean up old message history (keep last 365 days)
  DELETE FROM message_history
  WHERE created_at < NOW() - INTERVAL '365 days';

  -- Clean up expired conversation context
  DELETE FROM conversation_context
  WHERE expires_at < NOW();

  -- Clean up old queue jobs (keep last 7 days)
  DELETE FROM queue_jobs
  WHERE created_at < NOW() - INTERVAL '7 days'
  AND status IN ('completed', 'failed');

END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_instances_business_status
  ON whatsapp_instances (business_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_history_chat_created
  ON message_history (chat_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consent_records_phone_business
  ON consent_records (phone_number, business_id) WHERE granted = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_templates_keywords
  USING GIN (trigger_keywords) ON message_templates WHERE is_active = true;

-- Add comments for documentation
COMMENT ON TABLE whatsapp_instances IS 'WhatsApp connection instances for each business';
COMMENT ON TABLE message_history IS 'Complete history of WhatsApp messages sent and received';
COMMENT ON TABLE consent_records IS 'LGPD/GDPR consent records for marketing communications';
COMMENT ON TABLE audit_logs IS 'Audit trail for compliance and security';
COMMENT ON TABLE message_templates IS 'Automated message templates for AI responses';
COMMENT ON TABLE conversation_context IS 'AI conversation context for better responses';
COMMENT ON TABLE contact_profiles IS 'Customer contact information and preferences';