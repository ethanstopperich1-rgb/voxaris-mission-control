-- =============================================================================
-- VOXARIS MISSION CONTROL — Seed Data
-- Pre-populate with known clients and agents
-- =============================================================================

-- Clients
INSERT INTO mc_clients (slug, name, industry, status, health_score, monthly_retainer, website) VALUES
  ('suncoast', 'Suncoast Sports', 'sports', 'active', 82, 1500.00, 'https://suncoastsoftball.com'),
  ('orlando-art', 'Orlando Art of Surgery', 'medical', 'active', 78, 2000.00, NULL),
  ('porsche-jackson', 'Porsche Jackson', 'automotive', 'active', 85, 2500.00, NULL),
  ('arrivia', 'Arrivia', 'travel', 'active', 90, 3500.00, NULL)
ON CONFLICT (slug) DO NOTHING;

-- Agents — Suncoast Sports
INSERT INTO mc_agents (client_id, name, platform, platform_agent_id, agent_type, phone_number, voice_name, status) VALUES
  ((SELECT id FROM mc_clients WHERE slug='suncoast'), 'Riley', 'vapi', 'agent_b8dbc0ff6a0186474e73020500', 'inbound', '(228) 220-7210', 'Caroline - Southern Guide', 'active'),
  ((SELECT id FROM mc_clients WHERE slug='suncoast'), 'Riley (Outbound)', 'vapi', 'agent_277b76faaff90b8488df9c5073', 'outbound', '(228) 220-7210', 'Caroline - Southern Guide', 'active')
ON CONFLICT DO NOTHING;

-- Agents — Orlando Art of Surgery
INSERT INTO mc_agents (client_id, name, platform, platform_agent_id, agent_type, phone_number, status) VALUES
  ((SELECT id FROM mc_clients WHERE slug='orlando-art'), 'Aria', 'vapi', 'agent_aab4d2ceb18a893763451ffcaf', 'inbound', '(321) 463-3984', 'active'),
  ((SELECT id FROM mc_clients WHERE slug='orlando-art'), 'Maria (Video)', 'tavus', 'p2c5fa762be7', 'video', NULL, 'active')
ON CONFLICT DO NOTHING;

-- Agents — Porsche Jackson
INSERT INTO mc_agents (client_id, name, platform, platform_agent_id, agent_type, status) VALUES
  ((SELECT id FROM mc_clients WHERE slug='porsche-jackson'), 'Ashley', 'tavus', 'pa1a586cf4ad', 'video', 'active')
ON CONFLICT DO NOTHING;

-- Agents — Arrivia
INSERT INTO mc_agents (client_id, name, platform, platform_agent_id, agent_type, phone_number, status) VALUES
  ((SELECT id FROM mc_clients WHERE slug='arrivia'), 'Mia (Inbound)', 'vapi', 'd6997829-ff21-44b1-9853-27ea1e4d4030', 'inbound', '(407) 289-0294', 'active'),
  ((SELECT id FROM mc_clients WHERE slug='arrivia'), 'Mia (Outbound)', 'vapi', 'c36ebbfc-330f-419c-a954-ec965e3dd26d', 'outbound', '(407) 289-0294', 'active'),
  ((SELECT id FROM mc_clients WHERE slug='arrivia'), 'USAA V-SENSE Inbound', 'vapi', 'agent_0bf4698527ae66e7ccaaad2b2e', 'inbound', NULL, 'active'),
  ((SELECT id FROM mc_clients WHERE slug='arrivia'), 'USAA V-SENSE Outbound', 'vapi', 'agent_a34129591f0e7e19abeadd264f', 'outbound', NULL, 'active'),
  ((SELECT id FROM mc_clients WHERE slug='arrivia'), 'USAA V-FACE Concierge', 'tavus', 'p29a8c3a3ca6', 'video', NULL, 'active')
ON CONFLICT DO NOTHING;

-- Agents — Internal (Voxaris demo)
INSERT INTO mc_agents (client_id, name, platform, platform_agent_id, agent_type, status) VALUES
  (NULL, 'Voxaris Site Demo', 'tavus', 'p40793780aaa', 'video', 'active'),
  (NULL, 'Sarah (Roofing Demo)', 'vapi', 'agent_a69305c2fdf8246dadcae8284e', 'outbound', 'inactive')
ON CONFLICT DO NOTHING;

-- Deployments
INSERT INTO mc_deployments (project_name, vercel_project_id, domain, client_id) VALUES
  ('voxaris.io', 'prj_v8TdPRSThHgOsEzKkYMzlxtOHxII', 'voxaris.io', NULL),
  ('voxaris-orchestrator', 'prj_8feiiCEX9qudoqYtzoGoOlMbHSxK', 'voxaris-orchestrator.vercel.app', NULL),
  ('voxaris-command', 'prj_GuWrqeI1QXsDAh5dCtmqNXCT37NS', 'voxaris-command.vercel.app', NULL),
  ('suncoast-command', 'prj_8BwETP56UAVF3CMwCq5aItX1X6oX', 'suncoast-command.vercel.app', (SELECT id FROM mc_clients WHERE slug='suncoast'))
ON CONFLICT DO NOTHING;

-- Initial activity
INSERT INTO mc_activity (action, details, entity_type, source) VALUES
  ('system_initialized', 'Voxaris Mission Control deployed', NULL, 'system'),
  ('clients_seeded', '4 clients loaded into Mission Control', 'client', 'system'),
  ('agents_seeded', '12 agents registered across VAPI and Tavus', 'agent', 'system');
