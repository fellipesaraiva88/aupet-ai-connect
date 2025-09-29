-- Migration: Create system_settings table for global configuration
-- Run this migration in Supabase Dashboard > SQL Editor

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster key lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Add comments to table
COMMENT ON TABLE system_settings IS 'Global system settings and configuration values';
COMMENT ON COLUMN system_settings.key IS 'Unique setting key (e.g., maintenance_mode, max_orgs_per_plan)';
COMMENT ON COLUMN system_settings.value IS 'JSON value of the setting';
COMMENT ON COLUMN system_settings.updated_by IS 'Last admin user who modified this setting';

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('max_users_per_org_free', '3', 'Maximum users allowed per free organization'),
  ('max_users_per_org_pro', '10', 'Maximum users allowed per pro organization'),
  ('max_users_per_org_enterprise', '-1', 'Maximum users allowed per enterprise organization (-1 = unlimited)'),
  ('allow_new_signups', 'true', 'Allow new user signups'),
  ('system_announcement', '{"enabled": false, "message": ""}', 'Global system announcement banner')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Only super_admins can read settings
CREATE POLICY "Super admins can view system settings"
  ON system_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Create policy: Only super_admins can modify settings
CREATE POLICY "Super admins can modify system settings"
  ON system_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );