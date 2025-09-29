-- Migration: Create token_usage table for tracking AI token consumption
-- Run this migration in Supabase Dashboard > SQL Editor

-- Create token_usage table
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE SET NULL,
  model VARCHAR(100) NOT NULL DEFAULT 'gpt-4',
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd DECIMAL(10, 6) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_token_usage_organization ON token_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_user ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_conversation ON token_usage(conversation_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_usage_model ON token_usage(model);

-- Add comments to table
COMMENT ON TABLE token_usage IS 'Tracks AI token consumption per organization, user, and conversation';
COMMENT ON COLUMN token_usage.prompt_tokens IS 'Number of tokens in the prompt';
COMMENT ON COLUMN token_usage.completion_tokens IS 'Number of tokens in the completion';
COMMENT ON COLUMN token_usage.total_tokens IS 'Total tokens used (prompt + completion)';
COMMENT ON COLUMN token_usage.estimated_cost_usd IS 'Estimated cost in USD based on model pricing';
COMMENT ON COLUMN token_usage.metadata IS 'Additional context (feature used, endpoint called, etc)';

-- Enable Row Level Security
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Create policy: Organizations can only see their own usage
CREATE POLICY "Organizations can view their own token usage"
  ON token_usage
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- Create policy: Super admins can see all usage
CREATE POLICY "Super admins can view all token usage"
  ON token_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Create policy: System can insert token usage (no RLS on insert for service role)
CREATE POLICY "System can insert token usage"
  ON token_usage
  FOR INSERT
  WITH CHECK (true);

-- Create view for aggregated token usage by organization
DROP VIEW IF EXISTS admin_token_usage_by_org;

CREATE VIEW admin_token_usage_by_org AS
SELECT
  t.organization_id,
  o.name as organization_name,
  o.subscription_tier,
  COUNT(*) as total_requests,
  SUM(t.prompt_tokens) as total_prompt_tokens,
  SUM(t.completion_tokens) as total_completion_tokens,
  SUM(t.total_tokens) as total_tokens,
  SUM(t.estimated_cost_usd) as total_estimated_cost_usd,
  AVG(t.total_tokens) as avg_tokens_per_request,
  MAX(t.created_at) as last_usage_at,
  -- Last 7 days stats
  SUM(CASE WHEN t.created_at > NOW() - INTERVAL '7 days' THEN t.total_tokens ELSE 0 END) as tokens_last_7_days,
  SUM(CASE WHEN t.created_at > NOW() - INTERVAL '7 days' THEN t.estimated_cost_usd ELSE 0 END) as cost_last_7_days,
  -- Last 30 days stats
  SUM(CASE WHEN t.created_at > NOW() - INTERVAL '30 days' THEN t.total_tokens ELSE 0 END) as tokens_last_30_days,
  SUM(CASE WHEN t.created_at > NOW() - INTERVAL '30 days' THEN t.estimated_cost_usd ELSE 0 END) as cost_last_30_days
FROM token_usage t
LEFT JOIN organizations o ON o.id = t.organization_id
GROUP BY t.organization_id, o.name, o.subscription_tier;

-- Add comment to view
COMMENT ON VIEW admin_token_usage_by_org IS 'Aggregated token usage statistics per organization';

-- Create view for token usage by user
DROP VIEW IF EXISTS admin_token_usage_by_user;

CREATE VIEW admin_token_usage_by_user AS
SELECT
  t.user_id,
  p.email,
  p.full_name,
  t.organization_id,
  o.name as organization_name,
  COUNT(*) as total_requests,
  SUM(t.total_tokens) as total_tokens,
  SUM(t.estimated_cost_usd) as total_estimated_cost_usd,
  AVG(t.total_tokens) as avg_tokens_per_request,
  MAX(t.created_at) as last_usage_at,
  -- Last 7 days
  SUM(CASE WHEN t.created_at > NOW() - INTERVAL '7 days' THEN t.total_tokens ELSE 0 END) as tokens_last_7_days,
  SUM(CASE WHEN t.created_at > NOW() - INTERVAL '7 days' THEN t.estimated_cost_usd ELSE 0 END) as cost_last_7_days
FROM token_usage t
LEFT JOIN profiles p ON p.user_id = t.user_id
LEFT JOIN organizations o ON o.id = t.organization_id
WHERE t.user_id IS NOT NULL
GROUP BY t.user_id, p.email, p.full_name, t.organization_id, o.name;

-- Add comment to view
COMMENT ON VIEW admin_token_usage_by_user IS 'Aggregated token usage statistics per user';

-- Create view for system-wide token usage metrics
DROP VIEW IF EXISTS admin_token_usage_metrics;

CREATE VIEW admin_token_usage_metrics AS
SELECT
  COUNT(*) as total_requests,
  SUM(total_tokens) as total_tokens,
  SUM(estimated_cost_usd) as total_estimated_cost_usd,
  AVG(total_tokens) as avg_tokens_per_request,
  -- By model
  jsonb_object_agg(
    model,
    jsonb_build_object(
      'requests', COUNT(*),
      'tokens', SUM(total_tokens),
      'cost', SUM(estimated_cost_usd)
    )
  ) as usage_by_model,
  -- Last 24 hours
  SUM(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN total_tokens ELSE 0 END) as tokens_last_24h,
  SUM(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN estimated_cost_usd ELSE 0 END) as cost_last_24h,
  -- Last 7 days
  SUM(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN total_tokens ELSE 0 END) as tokens_last_7_days,
  SUM(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN estimated_cost_usd ELSE 0 END) as cost_last_7_days,
  -- Last 30 days
  SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN total_tokens ELSE 0 END) as tokens_last_30_days,
  SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN estimated_cost_usd ELSE 0 END) as cost_last_30_days
FROM token_usage;

-- Add comment to view
COMMENT ON VIEW admin_token_usage_metrics IS 'System-wide token usage metrics for admin dashboard';