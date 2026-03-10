-- =============================================================================
-- VOXARIS MISSION CONTROL — Fix RLS Policies
-- Replaces wide-open "auth_all_*" policies with proper role-based access.
--
-- Policy design:
--   - All mc_* tables: SELECT for authenticated users only
--   - Most tables: INSERT/UPDATE/DELETE for authenticated users only
--   - mc_calls, mc_activity: INSERT also allowed for service_role
--     (webhook handlers write via service_role key)
--   - mc_calls, mc_activity: UPDATE/DELETE for authenticated users only
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Drop every wide-open policy created in 001_mission_control.sql
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "auth_all_mc_clients"     ON mc_clients;
DROP POLICY IF EXISTS "auth_all_mc_agents"      ON mc_agents;
DROP POLICY IF EXISTS "auth_all_mc_calls"       ON mc_calls;
DROP POLICY IF EXISTS "auth_all_mc_contacts"    ON mc_contacts;
DROP POLICY IF EXISTS "auth_all_mc_deals"       ON mc_deals;
DROP POLICY IF EXISTS "auth_all_mc_invoices"    ON mc_invoices;
DROP POLICY IF EXISTS "auth_all_mc_costs"       ON mc_costs;
DROP POLICY IF EXISTS "auth_all_mc_content"     ON mc_content;
DROP POLICY IF EXISTS "auth_all_mc_deployments" ON mc_deployments;
DROP POLICY IF EXISTS "auth_all_mc_users"       ON mc_users;
DROP POLICY IF EXISTS "auth_all_mc_activity"    ON mc_activity;

-- ---------------------------------------------------------------------------
-- 2. Standard tables — authenticated users get full CRUD
--    Tables: mc_clients, mc_agents, mc_contacts, mc_deals,
--            mc_invoices, mc_costs, mc_content, mc_deployments, mc_users
-- ---------------------------------------------------------------------------

-- mc_clients
CREATE POLICY "mc_clients_select" ON mc_clients
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "mc_clients_insert" ON mc_clients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mc_clients_update" ON mc_clients
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "mc_clients_delete" ON mc_clients
  FOR DELETE USING (auth.role() = 'authenticated');

-- mc_agents
CREATE POLICY "mc_agents_select" ON mc_agents
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "mc_agents_insert" ON mc_agents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mc_agents_update" ON mc_agents
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "mc_agents_delete" ON mc_agents
  FOR DELETE USING (auth.role() = 'authenticated');

-- mc_contacts
CREATE POLICY "mc_contacts_select" ON mc_contacts
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "mc_contacts_insert" ON mc_contacts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mc_contacts_update" ON mc_contacts
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "mc_contacts_delete" ON mc_contacts
  FOR DELETE USING (auth.role() = 'authenticated');

-- mc_deals
CREATE POLICY "mc_deals_select" ON mc_deals
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "mc_deals_insert" ON mc_deals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mc_deals_update" ON mc_deals
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "mc_deals_delete" ON mc_deals
  FOR DELETE USING (auth.role() = 'authenticated');

-- mc_invoices
CREATE POLICY "mc_invoices_select" ON mc_invoices
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "mc_invoices_insert" ON mc_invoices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mc_invoices_update" ON mc_invoices
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "mc_invoices_delete" ON mc_invoices
  FOR DELETE USING (auth.role() = 'authenticated');

-- mc_costs
CREATE POLICY "mc_costs_select" ON mc_costs
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "mc_costs_insert" ON mc_costs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mc_costs_update" ON mc_costs
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "mc_costs_delete" ON mc_costs
  FOR DELETE USING (auth.role() = 'authenticated');

-- mc_content
CREATE POLICY "mc_content_select" ON mc_content
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "mc_content_insert" ON mc_content
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mc_content_update" ON mc_content
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "mc_content_delete" ON mc_content
  FOR DELETE USING (auth.role() = 'authenticated');

-- mc_deployments
CREATE POLICY "mc_deployments_select" ON mc_deployments
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "mc_deployments_insert" ON mc_deployments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mc_deployments_update" ON mc_deployments
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "mc_deployments_delete" ON mc_deployments
  FOR DELETE USING (auth.role() = 'authenticated');

-- mc_users
CREATE POLICY "mc_users_select" ON mc_users
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "mc_users_insert" ON mc_users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "mc_users_update" ON mc_users
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "mc_users_delete" ON mc_users
  FOR DELETE USING (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 3. Webhook-written tables — service_role can INSERT alongside authenticated
--    Tables: mc_calls, mc_activity
-- ---------------------------------------------------------------------------

-- mc_calls
CREATE POLICY "mc_calls_select" ON mc_calls
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "mc_calls_insert" ON mc_calls
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
  );

CREATE POLICY "mc_calls_update" ON mc_calls
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "mc_calls_delete" ON mc_calls
  FOR DELETE USING (auth.role() = 'authenticated');

-- mc_activity
CREATE POLICY "mc_activity_select" ON mc_activity
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "mc_activity_insert" ON mc_activity
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
  );

CREATE POLICY "mc_activity_update" ON mc_activity
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "mc_activity_delete" ON mc_activity
  FOR DELETE USING (auth.role() = 'authenticated');
