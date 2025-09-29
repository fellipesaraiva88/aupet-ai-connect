-- Migration: Create admin views for statistics and reporting
-- Run this migration in Supabase Dashboard > SQL Editor

-- Drop view if exists (for re-running migration)
DROP VIEW IF EXISTS admin_organization_stats;

-- Create view for organization statistics
CREATE VIEW admin_organization_stats AS
SELECT
  o.id,
  o.name,
  o.slug,
  o.subscription_tier,
  o.is_active,
  o.created_at,
  COUNT(DISTINCT p.user_id) as user_count,
  COUNT(DISTINCT wi.id) as whatsapp_instances_count,
  COUNT(DISTINCT wc.id) as conversations_count,
  COUNT(DISTINCT wm.id) as messages_count,
  COUNT(DISTINCT c.id) as customers_count,
  COUNT(DISTINCT pet.id) as pets_count,
  COUNT(DISTINCT apt.id) as appointments_count,
  MAX(wc.last_message_at) as last_activity_at,
  -- Calculate activity score (more activity = higher score)
  (
    COALESCE(COUNT(DISTINCT wc.id), 0) * 10 +
    COALESCE(COUNT(DISTINCT wm.id), 0) * 2 +
    COALESCE(COUNT(DISTINCT apt.id), 0) * 5
  ) as activity_score
FROM organizations o
LEFT JOIN profiles p ON p.organization_id = o.id AND p.is_active = true
LEFT JOIN whatsapp_instances wi ON wi.organization_id = o.id
LEFT JOIN whatsapp_conversations wc ON wc.organization_id = o.id
LEFT JOIN whatsapp_messages wm ON wm.organization_id = o.id
LEFT JOIN customers c ON c.organization_id = o.id
LEFT JOIN pets pet ON pet.organization_id = o.id
LEFT JOIN appointments apt ON apt.organization_id = o.id
GROUP BY o.id, o.name, o.slug, o.subscription_tier, o.is_active, o.created_at;

-- Add comment to view
COMMENT ON VIEW admin_organization_stats IS 'Aggregated statistics for each organization used in admin dashboard';

-- Create view for user statistics across all organizations
DROP VIEW IF EXISTS admin_user_stats;

CREATE VIEW admin_user_stats AS
SELECT
  p.user_id,
  p.email,
  p.full_name,
  p.role,
  p.organization_id,
  o.name as organization_name,
  o.subscription_tier,
  p.is_active,
  p.created_at,
  p.last_login_at,
  -- Count user activities
  COUNT(DISTINCT wc.id) as conversations_handled,
  COUNT(DISTINCT apt.id) as appointments_created,
  -- Last activity timestamp
  GREATEST(
    p.last_login_at,
    MAX(wc.last_message_at),
    MAX(apt.created_at)
  ) as last_activity_at
FROM profiles p
LEFT JOIN organizations o ON o.id = p.organization_id
LEFT JOIN whatsapp_conversations wc ON wc.organization_id = p.organization_id
LEFT JOIN appointments apt ON apt.organization_id = p.organization_id AND apt.created_by = p.user_id
GROUP BY p.user_id, p.email, p.full_name, p.role, p.organization_id, o.name, o.subscription_tier, p.is_active, p.created_at, p.last_login_at;

-- Add comment to view
COMMENT ON VIEW admin_user_stats IS 'User statistics across all organizations for admin dashboard';

-- Create view for system-wide metrics
DROP VIEW IF EXISTS admin_system_metrics;

CREATE VIEW admin_system_metrics AS
SELECT
  (SELECT COUNT(*) FROM organizations WHERE is_active = true) as active_organizations,
  (SELECT COUNT(*) FROM organizations WHERE is_active = false) as inactive_organizations,
  (SELECT COUNT(*) FROM profiles WHERE is_active = true) as total_active_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'super_admin') as super_admin_count,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admin_count,
  (SELECT COUNT(*) FROM profiles WHERE role = 'user') as user_count,
  (SELECT COUNT(*) FROM whatsapp_instances) as total_whatsapp_instances,
  (SELECT COUNT(*) FROM whatsapp_conversations) as total_conversations,
  (SELECT COUNT(*) FROM whatsapp_messages) as total_messages,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM pets) as total_pets,
  (SELECT COUNT(*) FROM appointments) as total_appointments,
  -- Recent activity (last 7 days)
  (SELECT COUNT(*) FROM organizations WHERE created_at > NOW() - INTERVAL '7 days') as new_orgs_last_7_days,
  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days') as new_users_last_7_days,
  (SELECT COUNT(*) FROM whatsapp_messages WHERE created_at > NOW() - INTERVAL '7 days') as messages_last_7_days,
  -- Subscription tier breakdown
  (SELECT COUNT(*) FROM organizations WHERE subscription_tier = 'free' AND is_active = true) as orgs_free_tier,
  (SELECT COUNT(*) FROM organizations WHERE subscription_tier = 'pro' AND is_active = true) as orgs_pro_tier,
  (SELECT COUNT(*) FROM organizations WHERE subscription_tier = 'enterprise' AND is_active = true) as orgs_enterprise_tier;

-- Add comment to view
COMMENT ON VIEW admin_system_metrics IS 'System-wide metrics and statistics for admin dashboard overview';