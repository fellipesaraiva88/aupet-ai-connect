-- Migration: Create admin_audit_logs table for tracking all administrative actions
-- Run this migration in Supabase Dashboard > SQL Editor

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(200) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  status_code INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_type ON admin_audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_organization ON admin_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);

-- Add comments to table
COMMENT ON TABLE admin_audit_logs IS 'Audit log for all administrative actions performed by super admins';
COMMENT ON COLUMN admin_audit_logs.admin_user_id IS 'The super admin who performed the action';
COMMENT ON COLUMN admin_audit_logs.action IS 'The HTTP method and path (e.g., POST /api/admin/organizations)';
COMMENT ON COLUMN admin_audit_logs.resource_type IS 'Type of resource being acted upon (e.g., organizations, users)';
COMMENT ON COLUMN admin_audit_logs.resource_id IS 'ID of the specific resource if applicable';
COMMENT ON COLUMN admin_audit_logs.metadata IS 'Additional context about the action (body, query params, etc)';
COMMENT ON COLUMN admin_audit_logs.status_code IS 'HTTP status code of the response';

-- Enable Row Level Security
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy: Only super_admins can read audit logs
CREATE POLICY "Super admins can view all audit logs"
  ON admin_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Create policy: System can insert audit logs (no RLS on insert for service role)
CREATE POLICY "System can insert audit logs"
  ON admin_audit_logs
  FOR INSERT
  WITH CHECK (true);