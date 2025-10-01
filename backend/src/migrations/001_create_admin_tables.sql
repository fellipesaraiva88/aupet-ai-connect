-- Migration: Create Admin Tables and RBAC Structure
-- Description: Add roles, permissions, audit logs and enhance existing tables
-- Date: 2025-01-10

-- =====================================================
-- 1. CREATE ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system roles
INSERT INTO roles (name, description, permissions, is_system_role) VALUES
('super_admin', 'Super Administrator with full system access',
 '["*"]'::jsonb, true),
('admin', 'Organization Administrator',
 '["dashboard.*", "whatsapp.*", "customers.*", "pets.*", "appointments.*", "settings.*", "users.read", "users.create", "users.update"]'::jsonb, true),
('manager', 'Team Manager with limited admin access',
 '["dashboard.read", "whatsapp.read", "customers.*", "pets.*", "appointments.*", "settings.read"]'::jsonb, true),
('user', 'Standard User with basic access',
 '["dashboard.read", "conversations.read", "customers.read", "pets.read", "appointments.read"]'::jsonb, true);

-- =====================================================
-- 2. ALTER PROFILES TABLE
-- =====================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) DEFAULT (SELECT id FROM roles WHERE name = 'user'),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

-- =====================================================
-- 3. ALTER ORGANIZATIONS TABLE (if exists)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    ALTER TABLE organizations
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5,
      ADD COLUMN IF NOT EXISTS max_instances INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{"whatsapp": true, "ai": true, "analytics": false}'::jsonb,
      ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

    -- Create index for status queries
    CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
  END IF;
END $$;

-- =====================================================
-- 4. CREATE AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  severity VARCHAR(20) DEFAULT 'info',
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- =====================================================
-- 5. CREATE USER SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- =====================================================
-- 6. CREATE ORGANIZATION INVITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role_id UUID REFERENCES roles(id),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_invites_token ON organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_organization_invites_email ON organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_organization_invites_status ON organization_invites(status);

-- =====================================================
-- 7. CREATE FUNCTION TO LOG AUDIT TRAIL
-- =====================================================
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log for tables we want to audit
  IF TG_TABLE_NAME IN ('profiles', 'organizations', 'whatsapp_instances', 'customers', 'pets') THEN
    INSERT INTO audit_logs (
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values
    ) VALUES (
      COALESCE(NEW.organization_id, OLD.organization_id),
      current_setting('app.current_user_id', true)::uuid,
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. CREATE TRIGGERS FOR AUDIT LOGGING
-- =====================================================
-- Profiles audit
DROP TRIGGER IF EXISTS audit_profiles_changes ON profiles;
CREATE TRIGGER audit_profiles_changes
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Organizations audit
DROP TRIGGER IF EXISTS audit_organizations_changes ON organizations;
CREATE TRIGGER audit_organizations_changes
AFTER INSERT OR UPDATE OR DELETE ON organizations
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- WhatsApp Instances audit
DROP TRIGGER IF EXISTS audit_whatsapp_instances_changes ON whatsapp_instances;
CREATE TRIGGER audit_whatsapp_instances_changes
AFTER INSERT OR UPDATE OR DELETE ON whatsapp_instances
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- =====================================================
-- 9. CREATE RLS POLICIES
-- =====================================================
-- Enable RLS on new tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- Roles: Only super_admin can manage roles
CREATE POLICY "Super admins can manage roles" ON roles
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- Audit Logs: Users can read their organization's logs
CREATE POLICY "Users can read their organization audit logs" ON audit_logs
  FOR SELECT USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

-- User Sessions: Users can manage their own sessions
CREATE POLICY "Users can manage their own sessions" ON user_sessions
  FOR ALL USING (
    user_id = auth.uid()
  );

-- Organization Invites: Organization members can view invites
CREATE POLICY "Organization members can view invites" ON organization_invites
  FOR SELECT USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

-- =====================================================
-- 10. CREATE HELPER FUNCTIONS
-- =====================================================
-- Function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  user_role_id UUID,
  required_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
  perm TEXT;
BEGIN
  -- Get user permissions
  SELECT permissions INTO user_permissions
  FROM roles
  WHERE id = user_role_id;

  -- Check for wildcard permission
  IF user_permissions ? '*' THEN
    RETURN TRUE;
  END IF;

  -- Check for exact match
  IF user_permissions ? required_permission THEN
    RETURN TRUE;
  END IF;

  -- Check for wildcard in permission namespace
  FOR perm IN SELECT jsonb_array_elements_text(user_permissions)
  LOOP
    IF perm LIKE SUBSTRING(required_permission FROM 1 FOR POSITION('.' IN required_permission)) || '*' THEN
      RETURN TRUE;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. UPDATE TIMESTAMP TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration creates the foundation for:
-- ✓ Role-Based Access Control (RBAC)
-- ✓ Audit Logging
-- ✓ User Session Management
-- ✓ Organization Management
-- ✓ Security Policies (RLS)
