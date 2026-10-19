-- =============================================================================
-- VOXARIS MISSION CONTROL — Phase 1 Production Schema
-- Migration 005: Multi-tenant organizations, profiles, workspaces, leads,
--                workflows, audit logs, and proper RLS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Organizations — top-level tenant boundary
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_mc_organizations_updated_at
  BEFORE UPDATE ON mc_organizations
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

-- ---------------------------------------------------------------------------
-- 2. Profiles — extends auth.users with org membership + role
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('owner', 'admin', 'operator', 'sales', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_profiles_org ON mc_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_profiles_email ON mc_profiles(email);

CREATE TRIGGER trg_mc_profiles_updated_at
  BEFORE UPDATE ON mc_profiles
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

-- ---------------------------------------------------------------------------
-- 3. Add organization_id to mc_clients
-- ---------------------------------------------------------------------------
ALTER TABLE mc_clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES mc_organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_mc_clients_org ON mc_clients(organization_id);

-- ---------------------------------------------------------------------------
-- 4. Workspaces — scoped under a client within an org
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES mc_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  environment TEXT DEFAULT 'production' CHECK (environment IN ('production', 'staging', 'development')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_mc_workspaces_org ON mc_workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_workspaces_client ON mc_workspaces(client_id);

CREATE TRIGGER trg_mc_workspaces_updated_at
  BEFORE UPDATE ON mc_workspaces
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

-- ---------------------------------------------------------------------------
-- 5. Add organization_id + workspace_id to mc_agents
-- ---------------------------------------------------------------------------
ALTER TABLE mc_agents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES mc_organizations(id) ON DELETE CASCADE;
ALTER TABLE mc_agents ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES mc_workspaces(id) ON DELETE SET NULL;
ALTER TABLE mc_agents DROP CONSTRAINT IF EXISTS mc_agents_platform_check;
ALTER TABLE mc_agents ADD CONSTRAINT mc_agents_platform_check CHECK (platform IN ('vapi', 'tavus', 'retell', 'custom'));

CREATE INDEX IF NOT EXISTS idx_mc_agents_org ON mc_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_agents_workspace ON mc_agents(workspace_id);

-- ---------------------------------------------------------------------------
-- 6. Leads — separate from contacts, workspace-scoped
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES mc_workspaces(id) ON DELETE SET NULL,
  client_id UUID REFERENCES mc_clients(id) ON DELETE SET NULL,

  -- Identity
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,

  -- Dedup keys
  external_id TEXT,
  ghl_contact_id TEXT,
  apollo_id TEXT,

  -- Status tracking
  status TEXT DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'nurturing', 'converted', 'lost', 'disqualified')),
  source TEXT,
  score INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES mc_profiles(id) ON DELETE SET NULL,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  last_contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_leads_org ON mc_leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_leads_workspace ON mc_leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_mc_leads_client ON mc_leads(client_id);
CREATE INDEX IF NOT EXISTS idx_mc_leads_status ON mc_leads(status);
CREATE INDEX IF NOT EXISTS idx_mc_leads_email ON mc_leads(email);
CREATE INDEX IF NOT EXISTS idx_mc_leads_phone ON mc_leads(phone);
CREATE INDEX IF NOT EXISTS idx_mc_leads_external ON mc_leads(external_id);
CREATE INDEX IF NOT EXISTS idx_mc_leads_ghl ON mc_leads(ghl_contact_id);
CREATE INDEX IF NOT EXISTS idx_mc_leads_created ON mc_leads(created_at DESC);

-- Partial unique indexes for dedup (only where values are not null)
CREATE UNIQUE INDEX IF NOT EXISTS uq_mc_leads_org_email
  ON mc_leads(organization_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_mc_leads_org_phone
  ON mc_leads(organization_id, phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_mc_leads_org_external
  ON mc_leads(organization_id, external_id) WHERE external_id IS NOT NULL;

CREATE TRIGGER trg_mc_leads_updated_at
  BEFORE UPDATE ON mc_leads
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

-- ---------------------------------------------------------------------------
-- 7. Conversations — attached to leads
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES mc_leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES mc_agents(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('phone', 'sms', 'email', 'video', 'chat', 'webhook')),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  platform_call_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'missed')),
  duration_seconds INTEGER DEFAULT 0,
  summary TEXT,
  transcript TEXT,
  recording_url TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  outcome TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_conversations_org ON mc_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_conversations_lead ON mc_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_mc_conversations_agent ON mc_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_mc_conversations_created ON mc_conversations(created_at DESC);

-- ---------------------------------------------------------------------------
-- 8. Tasks — actionable items tied to leads
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES mc_leads(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES mc_workspaces(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES mc_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'follow_up'
    CHECK (type IN ('follow_up', 'callback', 'review', 'approval', 'sync', 'custom')),
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_tasks_org ON mc_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_tasks_lead ON mc_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_mc_tasks_assigned ON mc_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_mc_tasks_status ON mc_tasks(status);
CREATE INDEX IF NOT EXISTS idx_mc_tasks_due ON mc_tasks(due_at);

CREATE TRIGGER trg_mc_tasks_updated_at
  BEFORE UPDATE ON mc_tasks
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

-- ---------------------------------------------------------------------------
-- 9. Workflows — reusable workflow definitions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES mc_workspaces(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT DEFAULT 'manual'
    CHECK (trigger_type IN ('manual', 'webhook', 'schedule', 'event')),
  steps JSONB DEFAULT '[]',
  config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_by UUID REFERENCES mc_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_workflows_org ON mc_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_workflows_workspace ON mc_workflows(workspace_id);

CREATE TRIGGER trg_mc_workflows_updated_at
  BEFORE UPDATE ON mc_workflows
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

-- ---------------------------------------------------------------------------
-- 10. Workflow Runs — execution history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_workflow_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES mc_workflows(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  trigger_type TEXT,
  triggered_by UUID REFERENCES mc_profiles(id) ON DELETE SET NULL,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  error TEXT,
  steps_completed INTEGER DEFAULT 0,
  steps_total INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_workflow_runs_org ON mc_workflow_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_workflow_runs_workflow ON mc_workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_mc_workflow_runs_status ON mc_workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_mc_workflow_runs_created ON mc_workflow_runs(created_at DESC);

-- ---------------------------------------------------------------------------
-- 11. Audit Logs — every mutation tracked
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES mc_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_audit_logs_org ON mc_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_audit_logs_actor ON mc_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_mc_audit_logs_entity ON mc_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_mc_audit_logs_created ON mc_audit_logs(created_at DESC);

-- ---------------------------------------------------------------------------
-- 12. GHL Credentials — per-workspace, server-side only
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_ghl_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES mc_workspaces(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  api_version TEXT DEFAULT '2021-07-28',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_ghl_credentials_org ON mc_ghl_credentials(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_ghl_credentials_workspace ON mc_ghl_credentials(workspace_id);

CREATE TRIGGER trg_mc_ghl_credentials_updated_at
  BEFORE UPDATE ON mc_ghl_credentials
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

-- ---------------------------------------------------------------------------
-- 13. Add organization_id to existing tables that need it
-- ---------------------------------------------------------------------------
ALTER TABLE mc_calls ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES mc_organizations(id) ON DELETE CASCADE;
ALTER TABLE mc_contacts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES mc_organizations(id) ON DELETE CASCADE;
ALTER TABLE mc_deals ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES mc_organizations(id) ON DELETE CASCADE;
ALTER TABLE mc_invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES mc_organizations(id) ON DELETE CASCADE;
ALTER TABLE mc_costs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES mc_organizations(id) ON DELETE CASCADE;
ALTER TABLE mc_deployments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES mc_organizations(id) ON DELETE CASCADE;
ALTER TABLE mc_activity ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES mc_organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_mc_calls_org ON mc_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_contacts_org ON mc_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_deals_org ON mc_deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_invoices_org ON mc_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_costs_org ON mc_costs(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_deployments_org ON mc_deployments(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_activity_org ON mc_activity(organization_id);

-- ---------------------------------------------------------------------------
-- 14. RLS Helper: get current user's organization_id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mc_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM mc_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- 15. RLS Helper: get current user's role
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mc_user_role()
RETURNS TEXT AS $$
  SELECT role FROM mc_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- 16. RLS Helper: check if user has at least a given role level
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mc_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_level INTEGER;
  required_level INTEGER;
BEGIN
  SELECT role INTO user_role FROM mc_profiles WHERE id = auth.uid();
  IF user_role IS NULL THEN RETURN false; END IF;

  -- Role hierarchy: owner > admin > operator > sales > viewer
  role_level := CASE user_role
    WHEN 'owner' THEN 50
    WHEN 'admin' THEN 40
    WHEN 'operator' THEN 30
    WHEN 'sales' THEN 20
    WHEN 'viewer' THEN 10
    ELSE 0
  END;

  required_level := CASE required_role
    WHEN 'owner' THEN 50
    WHEN 'admin' THEN 40
    WHEN 'operator' THEN 30
    WHEN 'sales' THEN 20
    WHEN 'viewer' THEN 10
    ELSE 100
  END;

  RETURN role_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- 17. Enable RLS on new tables
-- ---------------------------------------------------------------------------
ALTER TABLE mc_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_ghl_credentials ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 18. Drop old policies on existing tables (from migration 003)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "mc_clients_select" ON mc_clients;
DROP POLICY IF EXISTS "mc_clients_insert" ON mc_clients;
DROP POLICY IF EXISTS "mc_clients_update" ON mc_clients;
DROP POLICY IF EXISTS "mc_clients_delete" ON mc_clients;
DROP POLICY IF EXISTS "mc_agents_select" ON mc_agents;
DROP POLICY IF EXISTS "mc_agents_insert" ON mc_agents;
DROP POLICY IF EXISTS "mc_agents_update" ON mc_agents;
DROP POLICY IF EXISTS "mc_agents_delete" ON mc_agents;
DROP POLICY IF EXISTS "mc_calls_select" ON mc_calls;
DROP POLICY IF EXISTS "mc_calls_insert" ON mc_calls;
DROP POLICY IF EXISTS "mc_calls_update" ON mc_calls;
DROP POLICY IF EXISTS "mc_calls_delete" ON mc_calls;
DROP POLICY IF EXISTS "mc_contacts_select" ON mc_contacts;
DROP POLICY IF EXISTS "mc_contacts_insert" ON mc_contacts;
DROP POLICY IF EXISTS "mc_contacts_update" ON mc_contacts;
DROP POLICY IF EXISTS "mc_contacts_delete" ON mc_contacts;
DROP POLICY IF EXISTS "mc_deals_select" ON mc_deals;
DROP POLICY IF EXISTS "mc_deals_insert" ON mc_deals;
DROP POLICY IF EXISTS "mc_deals_update" ON mc_deals;
DROP POLICY IF EXISTS "mc_deals_delete" ON mc_deals;
DROP POLICY IF EXISTS "mc_invoices_select" ON mc_invoices;
DROP POLICY IF EXISTS "mc_invoices_insert" ON mc_invoices;
DROP POLICY IF EXISTS "mc_invoices_update" ON mc_invoices;
DROP POLICY IF EXISTS "mc_invoices_delete" ON mc_invoices;
DROP POLICY IF EXISTS "mc_costs_select" ON mc_costs;
DROP POLICY IF EXISTS "mc_costs_insert" ON mc_costs;
DROP POLICY IF EXISTS "mc_costs_update" ON mc_costs;
DROP POLICY IF EXISTS "mc_costs_delete" ON mc_costs;
DROP POLICY IF EXISTS "mc_content_select" ON mc_content;
DROP POLICY IF EXISTS "mc_content_insert" ON mc_content;
DROP POLICY IF EXISTS "mc_content_update" ON mc_content;
DROP POLICY IF EXISTS "mc_content_delete" ON mc_content;
DROP POLICY IF EXISTS "mc_deployments_select" ON mc_deployments;
DROP POLICY IF EXISTS "mc_deployments_insert" ON mc_deployments;
DROP POLICY IF EXISTS "mc_deployments_update" ON mc_deployments;
DROP POLICY IF EXISTS "mc_deployments_delete" ON mc_deployments;
DROP POLICY IF EXISTS "mc_users_select" ON mc_users;
DROP POLICY IF EXISTS "mc_users_insert" ON mc_users;
DROP POLICY IF EXISTS "mc_users_update" ON mc_users;
DROP POLICY IF EXISTS "mc_users_delete" ON mc_users;
DROP POLICY IF EXISTS "mc_activity_select" ON mc_activity;
DROP POLICY IF EXISTS "mc_activity_insert" ON mc_activity;
DROP POLICY IF EXISTS "mc_activity_update" ON mc_activity;
DROP POLICY IF EXISTS "mc_activity_delete" ON mc_activity;

-- ---------------------------------------------------------------------------
-- 19. New org-scoped RLS policies
-- ---------------------------------------------------------------------------

-- mc_organizations: users can only see their own org
CREATE POLICY "org_select" ON mc_organizations
  FOR SELECT USING (id = mc_user_org_id());
CREATE POLICY "org_update" ON mc_organizations
  FOR UPDATE USING (id = mc_user_org_id() AND mc_has_role('admin'));

-- mc_profiles: users see profiles in their org
CREATE POLICY "profiles_select" ON mc_profiles
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "profiles_update_self" ON mc_profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert_service" ON mc_profiles
  FOR INSERT WITH CHECK (true); -- handled by trigger/service role on signup
CREATE POLICY "profiles_admin_update" ON mc_profiles
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('admin'));

-- mc_clients: org-scoped
CREATE POLICY "clients_select" ON mc_clients
  FOR SELECT USING (organization_id = mc_user_org_id() OR organization_id IS NULL);
CREATE POLICY "clients_insert" ON mc_clients
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('operator'));
CREATE POLICY "clients_update" ON mc_clients
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('operator'));
CREATE POLICY "clients_delete" ON mc_clients
  FOR DELETE USING (organization_id = mc_user_org_id() AND mc_has_role('admin'));

-- mc_workspaces: org-scoped
CREATE POLICY "workspaces_select" ON mc_workspaces
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "workspaces_insert" ON mc_workspaces
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('operator'));
CREATE POLICY "workspaces_update" ON mc_workspaces
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('operator'));
CREATE POLICY "workspaces_delete" ON mc_workspaces
  FOR DELETE USING (organization_id = mc_user_org_id() AND mc_has_role('admin'));

-- mc_agents: org-scoped
CREATE POLICY "agents_select" ON mc_agents
  FOR SELECT USING (organization_id = mc_user_org_id() OR organization_id IS NULL);
CREATE POLICY "agents_insert" ON mc_agents
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('operator'));
CREATE POLICY "agents_update" ON mc_agents
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('operator'));
CREATE POLICY "agents_delete" ON mc_agents
  FOR DELETE USING (organization_id = mc_user_org_id() AND mc_has_role('admin'));

-- mc_leads: org-scoped
CREATE POLICY "leads_select" ON mc_leads
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "leads_insert" ON mc_leads
  FOR INSERT WITH CHECK (
    organization_id = mc_user_org_id() AND mc_has_role('sales')
    OR auth.role() = 'service_role'
  );
CREATE POLICY "leads_update" ON mc_leads
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('sales'));
CREATE POLICY "leads_delete" ON mc_leads
  FOR DELETE USING (organization_id = mc_user_org_id() AND mc_has_role('admin'));

-- mc_conversations: org-scoped
CREATE POLICY "conversations_select" ON mc_conversations
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "conversations_insert" ON mc_conversations
  FOR INSERT WITH CHECK (
    organization_id = mc_user_org_id() AND mc_has_role('sales')
    OR auth.role() = 'service_role'
  );

-- mc_tasks: org-scoped
CREATE POLICY "tasks_select" ON mc_tasks
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "tasks_insert" ON mc_tasks
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('sales'));
CREATE POLICY "tasks_update" ON mc_tasks
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('sales'));
CREATE POLICY "tasks_delete" ON mc_tasks
  FOR DELETE USING (organization_id = mc_user_org_id() AND mc_has_role('operator'));

-- mc_workflows: org-scoped
CREATE POLICY "workflows_select" ON mc_workflows
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "workflows_insert" ON mc_workflows
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('operator'));
CREATE POLICY "workflows_update" ON mc_workflows
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('operator'));
CREATE POLICY "workflows_delete" ON mc_workflows
  FOR DELETE USING (organization_id = mc_user_org_id() AND mc_has_role('admin'));

-- mc_workflow_runs: org-scoped
CREATE POLICY "workflow_runs_select" ON mc_workflow_runs
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "workflow_runs_insert" ON mc_workflow_runs
  FOR INSERT WITH CHECK (
    organization_id = mc_user_org_id() AND mc_has_role('operator')
    OR auth.role() = 'service_role'
  );
CREATE POLICY "workflow_runs_update" ON mc_workflow_runs
  FOR UPDATE USING (
    organization_id = mc_user_org_id() AND mc_has_role('operator')
    OR auth.role() = 'service_role'
  );

-- mc_audit_logs: org-scoped, read by operators+, write by service
CREATE POLICY "audit_logs_select" ON mc_audit_logs
  FOR SELECT USING (organization_id = mc_user_org_id() AND mc_has_role('operator'));
CREATE POLICY "audit_logs_insert" ON mc_audit_logs
  FOR INSERT WITH CHECK (
    organization_id = mc_user_org_id()
    OR auth.role() = 'service_role'
  );

-- mc_ghl_credentials: org-scoped, admin only
CREATE POLICY "ghl_credentials_select" ON mc_ghl_credentials
  FOR SELECT USING (organization_id = mc_user_org_id() AND mc_has_role('admin'));
CREATE POLICY "ghl_credentials_insert" ON mc_ghl_credentials
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('admin'));
CREATE POLICY "ghl_credentials_update" ON mc_ghl_credentials
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('admin'));
CREATE POLICY "ghl_credentials_delete" ON mc_ghl_credentials
  FOR DELETE USING (organization_id = mc_user_org_id() AND mc_has_role('owner'));

-- Existing tables: org-scoped policies
-- mc_calls
CREATE POLICY "calls_select_v2" ON mc_calls
  FOR SELECT USING (organization_id = mc_user_org_id() OR organization_id IS NULL);
CREATE POLICY "calls_insert_v2" ON mc_calls
  FOR INSERT WITH CHECK (
    organization_id = mc_user_org_id() AND mc_has_role('operator')
    OR auth.role() = 'service_role'
  );
CREATE POLICY "calls_update_v2" ON mc_calls
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('operator'));

-- mc_contacts
CREATE POLICY "contacts_select_v2" ON mc_contacts
  FOR SELECT USING (organization_id = mc_user_org_id() OR organization_id IS NULL);
CREATE POLICY "contacts_insert_v2" ON mc_contacts
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('sales'));
CREATE POLICY "contacts_update_v2" ON mc_contacts
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('sales'));

-- mc_deals
CREATE POLICY "deals_select_v2" ON mc_deals
  FOR SELECT USING (organization_id = mc_user_org_id() OR organization_id IS NULL);
CREATE POLICY "deals_insert_v2" ON mc_deals
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('sales'));
CREATE POLICY "deals_update_v2" ON mc_deals
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('sales'));

-- mc_invoices
CREATE POLICY "invoices_select_v2" ON mc_invoices
  FOR SELECT USING (organization_id = mc_user_org_id() OR organization_id IS NULL);
CREATE POLICY "invoices_insert_v2" ON mc_invoices
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('admin'));
CREATE POLICY "invoices_update_v2" ON mc_invoices
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('admin'));

-- mc_costs
CREATE POLICY "costs_select_v2" ON mc_costs
  FOR SELECT USING (organization_id = mc_user_org_id() OR organization_id IS NULL);
CREATE POLICY "costs_insert_v2" ON mc_costs
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('admin'));

-- mc_deployments
CREATE POLICY "deployments_select_v2" ON mc_deployments
  FOR SELECT USING (organization_id = mc_user_org_id() OR organization_id IS NULL);
CREATE POLICY "deployments_insert_v2" ON mc_deployments
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('operator'));
CREATE POLICY "deployments_update_v2" ON mc_deployments
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('operator'));

-- mc_activity
CREATE POLICY "activity_select_v2" ON mc_activity
  FOR SELECT USING (organization_id = mc_user_org_id() OR organization_id IS NULL);
CREATE POLICY "activity_insert_v2" ON mc_activity
  FOR INSERT WITH CHECK (
    organization_id = mc_user_org_id()
    OR auth.role() = 'service_role'
  );

-- mc_users (legacy, keep open for now)
CREATE POLICY "users_select_v2" ON mc_users
  FOR SELECT USING (auth.role() = 'authenticated');

-- mc_content (not org-scoped yet — internal content)
CREATE POLICY "content_select_v2" ON mc_content
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "content_insert_v2" ON mc_content
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "content_update_v2" ON mc_content
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 20. Realtime for new tables
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE mc_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE mc_workflow_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE mc_audit_logs;

-- ---------------------------------------------------------------------------
-- 21. Seed the default Voxaris organization
-- ---------------------------------------------------------------------------
INSERT INTO mc_organizations (name, slug) VALUES ('Voxaris', 'voxaris')
ON CONFLICT (slug) DO NOTHING;

-- Backfill existing clients with the voxaris org
UPDATE mc_clients SET organization_id = (SELECT id FROM mc_organizations WHERE slug = 'voxaris')
WHERE organization_id IS NULL;

-- Backfill existing agents
UPDATE mc_agents SET organization_id = (SELECT id FROM mc_organizations WHERE slug = 'voxaris')
WHERE organization_id IS NULL;
