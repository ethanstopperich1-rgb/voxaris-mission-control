-- =============================================================================
-- VOXARIS MISSION CONTROL — Database Schema
-- All tables prefixed mc_ to avoid conflicts with existing tables
-- =============================================================================

-- Client registry
CREATE TABLE IF NOT EXISTS mc_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  logo_url TEXT,
  primary_color TEXT,
  accent_color TEXT,
  website TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'onboarding', 'churned', 'paused')),
  onboarding_step INTEGER DEFAULT 0,
  health_score REAL DEFAULT 0,
  contract_start DATE,
  contract_end DATE,
  monthly_retainer NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cross-platform agent registry
CREATE TABLE IF NOT EXISTS mc_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES mc_clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('vapi', 'tavus')),
  platform_agent_id TEXT NOT NULL,
  agent_type TEXT CHECK (agent_type IN ('inbound', 'outbound', 'video', 'both')),
  phone_number TEXT,
  voice_id TEXT,
  voice_name TEXT,
  llm_id TEXT,
  prompt_version TEXT DEFAULT 'v1',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'development', 'retired')),
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mc_agents_client ON mc_agents(client_id);
CREATE INDEX IF NOT EXISTS idx_mc_agents_platform ON mc_agents(platform);
CREATE INDEX IF NOT EXISTS idx_mc_agents_status ON mc_agents(status);

-- Unified call log across all platforms
CREATE TABLE IF NOT EXISTS mc_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES mc_clients(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES mc_agents(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('vapi', 'tavus')),
  platform_call_id TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound', 'video')),
  caller_number TEXT,
  callee_number TEXT,
  status TEXT DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'missed', 'failed', 'voicemail')),
  outcome TEXT,
  duration_seconds INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,4) DEFAULT 0,
  transcript TEXT,
  recording_url TEXT,
  summary TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mc_calls_client ON mc_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_mc_calls_agent ON mc_calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_mc_calls_platform ON mc_calls(platform);
CREATE INDEX IF NOT EXISTS idx_mc_calls_status ON mc_calls(status);
CREATE INDEX IF NOT EXISTS idx_mc_calls_created ON mc_calls(created_at DESC);

-- CRM contacts
CREATE TABLE IF NOT EXISTS mc_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES mc_clients(id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  title TEXT,
  company TEXT,
  industry TEXT,
  linkedin_url TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  source TEXT,
  tags TEXT[] DEFAULT '{}',
  apollo_id TEXT,
  ghl_contact_id TEXT,
  enriched_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mc_contacts_client ON mc_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_mc_contacts_email ON mc_contacts(email);
CREATE INDEX IF NOT EXISTS idx_mc_contacts_phone ON mc_contacts(phone);

-- Sales pipeline
CREATE TABLE IF NOT EXISTS mc_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES mc_contacts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES mc_clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  stage TEXT DEFAULT 'prospect' CHECK (stage IN ('prospect', 'contacted', 'demo', 'proposal', 'closed_won', 'closed_lost')),
  value NUMERIC(12,2),
  monthly_value NUMERIC(10,2),
  probability INTEGER DEFAULT 0,
  expected_close DATE,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mc_deals_stage ON mc_deals(stage);
CREATE INDEX IF NOT EXISTS idx_mc_deals_contact ON mc_deals(contact_id);

-- Invoice tracking
CREATE TABLE IF NOT EXISTS mc_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES mc_clients(id) ON DELETE SET NULL,
  invoice_number TEXT,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_date DATE,
  period_start DATE,
  period_end DATE,
  line_items JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mc_invoices_client ON mc_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_mc_invoices_status ON mc_invoices(status);

-- Platform cost tracking
CREATE TABLE IF NOT EXISTS mc_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES mc_clients(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  amount NUMERIC(10,4) NOT NULL,
  period_month DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mc_costs_client ON mc_costs(client_id);
CREATE INDEX IF NOT EXISTS idx_mc_costs_month ON mc_costs(period_month);

-- Content calendar
CREATE TABLE IF NOT EXISTS mc_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('twitter', 'linkedin', 'blog', 'email', 'video')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  body TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  platform_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vercel deployment tracking
CREATE TABLE IF NOT EXISTS mc_deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  vercel_project_id TEXT,
  domain TEXT,
  client_id UUID REFERENCES mc_clients(id) ON DELETE SET NULL,
  last_deployment_url TEXT,
  last_deployment_status TEXT,
  last_deployed_at TIMESTAMPTZ,
  git_repo TEXT,
  env_vars JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Team members
CREATE TABLE IF NOT EXISTS mc_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unified activity log
CREATE TABLE IF NOT EXISTS mc_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT,
  entity_type TEXT,
  entity_id UUID,
  source TEXT DEFAULT 'system',
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mc_activity_created ON mc_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_activity_entity ON mc_activity(entity_type, entity_id);

-- Enable RLS on all tables
ALTER TABLE mc_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_activity ENABLE ROW LEVEL SECURITY;

-- Open policies for authenticated users (Phase 1 — tighten later)
CREATE POLICY "auth_all_mc_clients" ON mc_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_mc_agents" ON mc_agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_mc_calls" ON mc_calls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_mc_contacts" ON mc_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_mc_deals" ON mc_deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_mc_invoices" ON mc_invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_mc_costs" ON mc_costs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_mc_content" ON mc_content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_mc_deployments" ON mc_deployments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_mc_users" ON mc_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_mc_activity" ON mc_activity FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE mc_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE mc_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE mc_deals;
