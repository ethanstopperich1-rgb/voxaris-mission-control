-- =============================================================================
-- VOXARIS MISSION CONTROL — Database Improvements
-- Migration 004: Auto-update triggers, composite indexes, unique constraints
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Auto-update updated_at trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mc_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to every table that has an updated_at column
CREATE TRIGGER trg_mc_clients_updated_at
  BEFORE UPDATE ON mc_clients
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

CREATE TRIGGER trg_mc_agents_updated_at
  BEFORE UPDATE ON mc_agents
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

CREATE TRIGGER trg_mc_contacts_updated_at
  BEFORE UPDATE ON mc_contacts
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

CREATE TRIGGER trg_mc_deals_updated_at
  BEFORE UPDATE ON mc_deals
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

CREATE TRIGGER trg_mc_content_updated_at
  BEFORE UPDATE ON mc_content
  FOR EACH ROW EXECUTE FUNCTION mc_update_timestamp();

-- ---------------------------------------------------------------------------
-- 2. Composite indexes for dashboard queries
--    (Regular CREATE INDEX — not CONCURRENTLY — because Supabase SQL editor
--     runs statements inside a transaction block)
-- ---------------------------------------------------------------------------

-- Dashboard: calls per client in last 30 days
CREATE INDEX IF NOT EXISTS idx_mc_calls_client_created
  ON mc_calls(client_id, created_at DESC);

-- Dashboard: active agents per client
CREATE INDEX IF NOT EXISTS idx_mc_agents_client_status
  ON mc_agents(client_id, status);

-- Pipeline: deals by stage per client
CREATE INDEX IF NOT EXISTS idx_mc_deals_client_stage
  ON mc_deals(client_id, stage);

-- Contacts: lookup by client and email
CREATE INDEX IF NOT EXISTS idx_mc_contacts_client_email
  ON mc_contacts(client_id, email);

-- ---------------------------------------------------------------------------
-- 3. Unique constraint on platform agent IDs
--    Prevents duplicate agent registrations for the same platform identity
-- ---------------------------------------------------------------------------
ALTER TABLE mc_agents
  ADD CONSTRAINT uq_mc_agents_platform_id UNIQUE (platform, platform_agent_id);

-- ---------------------------------------------------------------------------
-- 4. Unique constraint on platform_call_id for upsert support
--    Webhook handlers use onConflict: "platform_call_id" which requires
--    a unique constraint to function correctly
-- ---------------------------------------------------------------------------
ALTER TABLE mc_calls
  ADD CONSTRAINT uq_mc_calls_platform_call_id UNIQUE (platform_call_id);
