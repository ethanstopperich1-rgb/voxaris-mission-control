-- =============================================================================
-- VOXARIS MISSION CONTROL — Production Seed Data
-- Migration 007: Default org, client, workspace, workers, workflow, sample data
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Internal organization
-- ---------------------------------------------------------------------------
INSERT INTO mc_organizations (name, slug) VALUES ('Voxaris', 'voxaris')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Internal client
-- ---------------------------------------------------------------------------
INSERT INTO mc_clients (organization_id, slug, name, industry, status, health_score, monthly_retainer)
SELECT id, 'internal-ops', 'Internal Ops', 'internal', 'active', 100, 0
FROM mc_organizations WHERE slug = 'voxaris'
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Internal workspace
-- ---------------------------------------------------------------------------
INSERT INTO mc_workspaces (organization_id, client_id, name, slug, environment)
SELECT
  o.id,
  c.id,
  'Mission Control Internal',
  'mc-internal',
  'production'
FROM mc_organizations o
JOIN mc_clients c ON c.organization_id = o.id AND c.slug = 'internal-ops'
WHERE o.slug = 'voxaris'
ON CONFLICT (client_id, slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Default Paperclip worker templates
-- ---------------------------------------------------------------------------
INSERT INTO mc_paperclip_workers (organization_id, workspace_id, name, role, status, approval_policy, metadata)
SELECT
  o.id,
  w.id,
  t.name,
  t.role,
  'active',
  t.approval_policy::jsonb,
  t.metadata::jsonb
FROM mc_organizations o
JOIN mc_clients c ON c.organization_id = o.id AND c.slug = 'internal-ops'
JOIN mc_workspaces w ON w.client_id = c.id AND w.slug = 'mc-internal'
CROSS JOIN (VALUES
  ('Intake Router', 'classify_and_route_leads',
   '{"required": false}',
   '{"purpose": "classify and route leads", "risk": "low", "inputs": ["lead source", "payload", "campaign", "conversation state"], "outputs": ["lead category", "urgency", "next action"]}'),
  ('Follow-Up Coordinator', 'decide_next_outreach',
   '{"required": "policy_driven", "conditions": ["outbound_action"]}',
   '{"purpose": "decide next outreach action", "risk": "medium", "inputs": ["lead timeline", "channel permissions", "booking state"], "outputs": ["recommended sequence"]}'),
  ('Funnel Auditor', 'analyze_funnel_bottlenecks',
   '{"required": false}',
   '{"purpose": "review client funnel and identify bottlenecks", "risk": "low", "inputs": ["site info", "forms", "CRM fields", "response times"], "outputs": ["audit report", "priority fixes"]}'),
  ('Offer Strategist', 'recommend_offers',
   '{"required": false}',
   '{"purpose": "recommend offers and angles by client vertical", "risk": "low", "inputs": ["client vertical", "target audience", "funnel performance"], "outputs": ["offer recommendations", "hooks", "funnel tests"]}'),
  ('Proposal Writer', 'draft_proposals',
   '{"required": true, "gate": "before_external_send"}',
   '{"purpose": "turn audits/discovery into proposals", "risk": "medium", "inputs": ["discovery notes", "pricing model", "scope"], "outputs": ["draft proposal", "deliverables", "timeline"]}'),
  ('CRM Sync Analyst', 'monitor_sync_issues',
   '{"required": false}',
   '{"purpose": "monitor and reconcile GHL sync issues", "risk": "low", "inputs": ["contact mappings", "webhook logs", "opportunity records"], "outputs": ["sync issue reports", "corrections"]}'),
  ('Deployment Coordinator', 'coordinate_deployments',
   '{"required": true, "gate": "production_actions"}',
   '{"purpose": "coordinate environment and release actions", "risk": "high", "inputs": ["workspace config", "deployment target", "version metadata"], "outputs": ["deployment task state", "logs"]}'),
  ('Reporting Analyst', 'summarize_kpis',
   '{"required": false}',
   '{"purpose": "summarize KPIs and client health", "risk": "low", "inputs": ["leads", "bookings", "opportunities", "workflow outcomes"], "outputs": ["daily/weekly summaries", "anomaly detection"]}')
) AS t(name, role, approval_policy, metadata)
WHERE o.slug = 'voxaris'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Sample workflow: new-lead-intake
-- ---------------------------------------------------------------------------
INSERT INTO mc_workflows (organization_id, workspace_id, name, description, trigger_type, steps, enabled, config)
SELECT
  o.id,
  w.id,
  'New Lead Intake',
  'Normalize, dedupe, sync to GHL, classify via Intake Router',
  'webhook',
  '[
    {"key": "normalize_lead", "type": "normalize_lead", "provider": "internal"},
    {"key": "dedupe_lead", "type": "dedupe_lead", "provider": "internal"},
    {"key": "sync_to_ghl", "type": "sync_to_ghl", "provider": "ghl"},
    {"key": "classify_lead", "type": "delegate_to_paperclip", "provider": "paperclip", "worker": "Intake Router"},
    {"key": "update_status", "type": "update_lead_status", "provider": "internal"},
    {"key": "create_follow_up", "type": "create_task", "provider": "internal", "task_type": "follow_up"}
  ]'::jsonb,
  true,
  '{"auto_trigger_on_ingest": true}'::jsonb
FROM mc_organizations o
JOIN mc_clients c ON c.organization_id = o.id AND c.slug = 'internal-ops'
JOIN mc_workspaces w ON w.client_id = c.id AND w.slug = 'mc-internal'
WHERE o.slug = 'voxaris'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Sample lead
-- ---------------------------------------------------------------------------
INSERT INTO mc_leads (organization_id, workspace_id, client_id, first_name, last_name, email, phone, source, status, score, metadata)
SELECT
  o.id,
  w.id,
  c.id,
  'Demo',
  'Lead',
  'demo@example.com',
  '+15551234567',
  'manual_seed',
  'new',
  50,
  '{"seeded": true}'::jsonb
FROM mc_organizations o
JOIN mc_clients c ON c.organization_id = o.id AND c.slug = 'internal-ops'
JOIN mc_workspaces w ON w.client_id = c.id AND w.slug = 'mc-internal'
WHERE o.slug = 'voxaris'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Sample alert
-- ---------------------------------------------------------------------------
INSERT INTO mc_alerts (organization_id, workspace_id, severity, category, title, body, status)
SELECT
  o.id,
  w.id,
  'info',
  'system',
  'Mission Control initialized',
  'Seed data loaded successfully. System ready for operation.',
  'open'
FROM mc_organizations o
JOIN mc_clients c ON c.organization_id = o.id AND c.slug = 'internal-ops'
JOIN mc_workspaces w ON w.client_id = c.id AND w.slug = 'mc-internal'
WHERE o.slug = 'voxaris'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. Backfill existing clients/agents with org ID
-- ---------------------------------------------------------------------------
UPDATE mc_clients SET organization_id = (SELECT id FROM mc_organizations WHERE slug = 'voxaris')
WHERE organization_id IS NULL;
UPDATE mc_agents SET organization_id = (SELECT id FROM mc_organizations WHERE slug = 'voxaris')
WHERE organization_id IS NULL;
UPDATE mc_calls SET organization_id = (SELECT id FROM mc_organizations WHERE slug = 'voxaris')
WHERE organization_id IS NULL;
UPDATE mc_contacts SET organization_id = (SELECT id FROM mc_organizations WHERE slug = 'voxaris')
WHERE organization_id IS NULL;
UPDATE mc_deals SET organization_id = (SELECT id FROM mc_organizations WHERE slug = 'voxaris')
WHERE organization_id IS NULL;
UPDATE mc_deployments SET organization_id = (SELECT id FROM mc_organizations WHERE slug = 'voxaris')
WHERE organization_id IS NULL;
UPDATE mc_activity SET organization_id = (SELECT id FROM mc_organizations WHERE slug = 'voxaris')
WHERE organization_id IS NULL;
