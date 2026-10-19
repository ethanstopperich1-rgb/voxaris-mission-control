-- =============================================================================
-- VOXARIS MISSION CONTROL — Phase 1 Enhanced Schema
-- Migration 006: lead_events, workflow_step_runs, agent_versions, approvals,
--                alerts, webhook_payloads, paperclip tables, feature_flags
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Lead Events — timeline for each lead
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_lead_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES mc_workspaces(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES mc_leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'agent', 'system', 'integration')),
  actor_id TEXT,
  title TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_lead_events_lead ON mc_lead_events(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_lead_events_org ON mc_lead_events(organization_id);

-- ---------------------------------------------------------------------------
-- 2. Workflow Step Runs — per-step execution trace
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_workflow_step_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES mc_workspaces(id) ON DELETE SET NULL,
  workflow_run_id UUID NOT NULL REFERENCES mc_workflow_runs(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  step_type TEXT NOT NULL,
  provider TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'skipped', 'awaiting_approval')),
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  error_text TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_step_runs_run ON mc_workflow_step_runs(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_mc_step_runs_org ON mc_workflow_step_runs(organization_id);

-- ---------------------------------------------------------------------------
-- 3. Agent Versions — prompt/config version history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_agent_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES mc_workspaces(id) ON DELETE SET NULL,
  agent_id UUID NOT NULL REFERENCES mc_agents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  prompt TEXT,
  config JSONB DEFAULT '{}',
  change_notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, version)
);

CREATE INDEX IF NOT EXISTS idx_mc_agent_versions_agent ON mc_agent_versions(agent_id);

-- ---------------------------------------------------------------------------
-- 4. Approvals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES mc_workspaces(id) ON DELETE SET NULL,
  related_type TEXT NOT NULL,
  related_id TEXT NOT NULL,
  approval_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'auto_approved')),
  requested_by_type TEXT NOT NULL CHECK (requested_by_type IN ('user', 'agent', 'system')),
  requested_by_id TEXT,
  decided_by TEXT,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_approvals_org ON mc_approvals(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_approvals_status ON mc_approvals(status);
CREATE INDEX IF NOT EXISTS idx_mc_approvals_related ON mc_approvals(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_mc_approvals_workspace ON mc_approvals(workspace_id);

-- ---------------------------------------------------------------------------
-- 5. Alerts — operator-visible issues
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES mc_workspaces(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'acknowledged', 'resolved', 'snoozed')),
  related_type TEXT,
  related_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mc_alerts_org ON mc_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_alerts_status ON mc_alerts(status);
CREATE INDEX IF NOT EXISTS idx_mc_alerts_severity ON mc_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_mc_alerts_created ON mc_alerts(created_at DESC);

-- ---------------------------------------------------------------------------
-- 6. Webhook Payloads — raw storage for debugging/replay
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_webhook_payloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT,
  payload JSONB NOT NULL,
  headers JSONB DEFAULT '{}',
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_webhook_payloads_provider ON mc_webhook_payloads(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mc_webhook_payloads_status ON mc_webhook_payloads(status);

-- ---------------------------------------------------------------------------
-- 7. Paperclip Projects — workspace-level orchestration binding
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_paperclip_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES mc_workspaces(id) ON DELETE CASCADE,
  external_project_id TEXT,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error', 'disconnected')),
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_mc_paperclip_projects_org ON mc_paperclip_projects(organization_id);

CREATE TRIGGER trg_mc_paperclip_projects_updated_at
  BEFORE UPDATE ON mc_paperclip_projects
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

-- ---------------------------------------------------------------------------
-- 8. Paperclip Workers — worker instances per workspace
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_paperclip_workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES mc_workspaces(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES mc_agents(id) ON DELETE SET NULL,
  external_worker_id TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  provider TEXT,
  status TEXT DEFAULT 'active',
  budget_policy JSONB DEFAULT '{}',
  approval_policy JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_paperclip_workers_org ON mc_paperclip_workers(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_paperclip_workers_workspace ON mc_paperclip_workers(workspace_id);

CREATE TRIGGER trg_mc_paperclip_workers_updated_at
  BEFORE UPDATE ON mc_paperclip_workers
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

-- ---------------------------------------------------------------------------
-- 9. Paperclip Tasks — orchestrated task mirror
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_paperclip_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES mc_workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES mc_leads(id) ON DELETE SET NULL,
  workflow_run_id UUID REFERENCES mc_workflow_runs(id) ON DELETE SET NULL,
  paperclip_worker_id UUID REFERENCES mc_paperclip_workers(id) ON DELETE SET NULL,
  external_task_id TEXT,
  title TEXT NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled', 'awaiting_approval', 'degraded')),
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  cost_estimate NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  requires_approval BOOLEAN DEFAULT false,
  approval_id UUID REFERENCES mc_approvals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_paperclip_tasks_org ON mc_paperclip_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_paperclip_tasks_workspace ON mc_paperclip_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_mc_paperclip_tasks_status ON mc_paperclip_tasks(status);
CREATE INDEX IF NOT EXISTS idx_mc_paperclip_tasks_lead ON mc_paperclip_tasks(lead_id);

CREATE TRIGGER trg_mc_paperclip_tasks_updated_at
  BEFORE UPDATE ON mc_paperclip_tasks
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

-- ---------------------------------------------------------------------------
-- 10. Integration Configs — per-workspace provider bindings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_integration_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES mc_organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES mc_clients(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES mc_workspaces(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  config_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'error', 'validating')),
  encrypted_secret_ref TEXT,
  public_metadata JSONB DEFAULT '{}',
  private_metadata JSONB DEFAULT '{}',
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mc_integration_configs_org ON mc_integration_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_mc_integration_configs_workspace ON mc_integration_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_mc_integration_configs_provider ON mc_integration_configs(provider);

CREATE TRIGGER trg_mc_integration_configs_updated_at
  BEFORE UPDATE ON mc_integration_configs
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

-- ---------------------------------------------------------------------------
-- 11. Feature Flags
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mc_feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial feature flags
INSERT INTO mc_feature_flags (key, enabled, description) VALUES
  ('paperclip_integration', false, 'Enable Paperclip orchestration features'),
  ('meta_lead_intake', false, 'Enable Meta/Facebook lead webhook intake'),
  ('approval_system', true, 'Enable approval gates for sensitive actions'),
  ('deployment_center', false, 'Enable deployment management UI'),
  ('kpi_dashboard', false, 'Enable KPI reporting dashboard'),
  ('cost_controls', false, 'Enable cost/budget tracking')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 12. RLS for new tables
-- ---------------------------------------------------------------------------
ALTER TABLE mc_lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_workflow_step_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_agent_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_webhook_payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_paperclip_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_paperclip_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_paperclip_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mc_feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables (org-scoped)

-- mc_lead_events
CREATE POLICY "lead_events_select" ON mc_lead_events
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "lead_events_insert" ON mc_lead_events
  FOR INSERT WITH CHECK (
    organization_id = mc_user_org_id() AND mc_has_role('sales')
    OR auth.role() = 'service_role'
  );

-- mc_workflow_step_runs
CREATE POLICY "step_runs_select" ON mc_workflow_step_runs
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "step_runs_insert" ON mc_workflow_step_runs
  FOR INSERT WITH CHECK (
    organization_id = mc_user_org_id() AND mc_has_role('operator')
    OR auth.role() = 'service_role'
  );
CREATE POLICY "step_runs_update" ON mc_workflow_step_runs
  FOR UPDATE USING (
    organization_id = mc_user_org_id() AND mc_has_role('operator')
    OR auth.role() = 'service_role'
  );

-- mc_agent_versions
CREATE POLICY "agent_versions_select" ON mc_agent_versions
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "agent_versions_insert" ON mc_agent_versions
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('operator'));

-- mc_approvals
CREATE POLICY "approvals_select" ON mc_approvals
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "approvals_insert" ON mc_approvals
  FOR INSERT WITH CHECK (
    organization_id = mc_user_org_id()
    OR auth.role() = 'service_role'
  );
CREATE POLICY "approvals_update" ON mc_approvals
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('operator'));

-- mc_alerts
CREATE POLICY "alerts_select" ON mc_alerts
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "alerts_insert" ON mc_alerts
  FOR INSERT WITH CHECK (
    organization_id = mc_user_org_id()
    OR auth.role() = 'service_role'
  );
CREATE POLICY "alerts_update" ON mc_alerts
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('operator'));

-- mc_webhook_payloads (service-role only write, no user reads for now)
CREATE POLICY "webhook_payloads_insert" ON mc_webhook_payloads
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "webhook_payloads_select" ON mc_webhook_payloads
  FOR SELECT USING (mc_has_role('admin'));

-- mc_paperclip_projects
CREATE POLICY "paperclip_projects_select" ON mc_paperclip_projects
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "paperclip_projects_insert" ON mc_paperclip_projects
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('operator'));
CREATE POLICY "paperclip_projects_update" ON mc_paperclip_projects
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('operator'));

-- mc_paperclip_workers
CREATE POLICY "paperclip_workers_select" ON mc_paperclip_workers
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "paperclip_workers_insert" ON mc_paperclip_workers
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('operator'));
CREATE POLICY "paperclip_workers_update" ON mc_paperclip_workers
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('operator'));

-- mc_paperclip_tasks
CREATE POLICY "paperclip_tasks_select" ON mc_paperclip_tasks
  FOR SELECT USING (organization_id = mc_user_org_id());
CREATE POLICY "paperclip_tasks_insert" ON mc_paperclip_tasks
  FOR INSERT WITH CHECK (
    organization_id = mc_user_org_id() AND mc_has_role('operator')
    OR auth.role() = 'service_role'
  );
CREATE POLICY "paperclip_tasks_update" ON mc_paperclip_tasks
  FOR UPDATE USING (
    organization_id = mc_user_org_id() AND mc_has_role('operator')
    OR auth.role() = 'service_role'
  );

-- mc_integration_configs
CREATE POLICY "integration_configs_select" ON mc_integration_configs
  FOR SELECT USING (organization_id = mc_user_org_id() AND mc_has_role('operator'));
CREATE POLICY "integration_configs_insert" ON mc_integration_configs
  FOR INSERT WITH CHECK (organization_id = mc_user_org_id() AND mc_has_role('admin'));
CREATE POLICY "integration_configs_update" ON mc_integration_configs
  FOR UPDATE USING (organization_id = mc_user_org_id() AND mc_has_role('admin'));

-- mc_feature_flags (read-only for all authenticated)
CREATE POLICY "feature_flags_select" ON mc_feature_flags
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "feature_flags_update" ON mc_feature_flags
  FOR UPDATE USING (mc_has_role('owner'));

-- ---------------------------------------------------------------------------
-- 13. Realtime subscriptions for new tables
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE mc_approvals;
ALTER PUBLICATION supabase_realtime ADD TABLE mc_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE mc_paperclip_tasks;
