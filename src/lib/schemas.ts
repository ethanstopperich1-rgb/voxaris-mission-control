import { z } from "zod/v4";

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

export const organizationCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  logo_url: z.url().optional(),
});

export const organizationUpdateSchema = organizationCreateSchema
  .extend({ settings: z.record(z.string(), z.unknown()).optional() })
  .partial();

// ---------------------------------------------------------------------------
// Profile / Invite
// ---------------------------------------------------------------------------

export const profileUpdateSchema = z.object({
  display_name: z.string().min(1).max(200).optional(),
  avatar_url: z.url().optional().or(z.literal("")),
  role: z.enum(["owner", "admin", "operator", "sales", "viewer"]).optional(),
});

export const inviteUserSchema = z.object({
  email: z.email(),
  role: z.enum(["admin", "operator", "sales", "viewer"]),
  display_name: z.string().max(200).optional(),
});

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const clientCreateSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  industry: z.string().optional(),
  website: z.url().optional().or(z.literal("")),
  status: z.enum(["active", "onboarding", "churned", "paused"]).optional(),
  monthly_retainer: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const clientUpdateSchema = clientCreateSchema
  .omit({ slug: true })
  .extend({
    health_score: z.number().min(0).max(100).optional(),
    onboarding_step: z.number().min(0).optional(),
    contract_start: z.string().optional(),
    contract_end: z.string().optional(),
    primary_color: z.string().optional(),
    accent_color: z.string().optional(),
    logo_url: z.url().optional().or(z.literal("")),
  })
  .partial();

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

export const workspaceCreateSchema = z.object({
  client_id: z.uuid(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  environment: z.enum(["production", "staging", "development"]).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const workspaceUpdateSchema = workspaceCreateSchema
  .omit({ client_id: true, slug: true })
  .partial();

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

export const agentCreateSchema = z.object({
  client_id: z.uuid().optional().nullable(),
  workspace_id: z.uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  platform: z.enum(["vapi", "tavus", "retell", "custom"]),
  platform_agent_id: z.string().min(1),
  agent_type: z.enum(["inbound", "outbound", "video", "both"]).optional(),
  phone_number: z.string().optional(),
  voice_id: z.string().optional(),
  voice_name: z.string().optional(),
  llm_id: z.string().optional(),
  status: z.enum(["active", "inactive", "development", "retired"]).optional(),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const agentUpdateSchema = agentCreateSchema
  .extend({ prompt_version: z.string().optional() })
  .partial();

/** @deprecated Use agentCreateSchema */
export const agentSchema = agentCreateSchema;

// ---------------------------------------------------------------------------
// Lead
// ---------------------------------------------------------------------------

export const leadCreateSchema = z.object({
  workspace_id: z.uuid().optional().nullable(),
  client_id: z.uuid().optional().nullable(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  external_id: z.string().optional(),
  ghl_contact_id: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "nurturing", "converted", "lost", "disqualified"]).optional(),
  score: z.number().min(0).max(100).optional(),
  assigned_to: z.uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const leadUpdateSchema = leadCreateSchema.partial();

// ---------------------------------------------------------------------------
// Lead Ingest (webhook / API)
// ---------------------------------------------------------------------------

export const leadIngestSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  external_id: z.string().optional(),
  source: z.string(),
  workspace_slug: z.string().optional(),
  client_slug: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

export const taskCreateSchema = z.object({
  lead_id: z.uuid().optional().nullable(),
  workspace_id: z.uuid().optional().nullable(),
  assigned_to: z.uuid().optional().nullable(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: z.enum(["follow_up", "callback", "review", "approval", "sync", "custom"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  due_at: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const taskUpdateSchema = taskCreateSchema
  .extend({
    status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  })
  .partial();

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export const workflowCreateSchema = z.object({
  workspace_id: z.uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  trigger_type: z.enum(["manual", "webhook", "schedule", "event"]).optional(),
  steps: z.array(z.record(z.string(), z.unknown())).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

export const workflowUpdateSchema = workflowCreateSchema.partial();

// ---------------------------------------------------------------------------
// Workflow Run (manual trigger)
// ---------------------------------------------------------------------------

export const workflowRunTriggerSchema = z.object({
  workflow_id: z.uuid(),
  input: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// GHL Credentials
// ---------------------------------------------------------------------------

export const ghlCredentialsSchema = z.object({
  workspace_id: z.uuid().optional().nullable(),
  location_id: z.string().min(1),
  access_token: z.string().min(1),
  refresh_token: z.string().optional(),
  token_expires_at: z.string().optional(),
  api_version: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Contact (legacy compat)
// ---------------------------------------------------------------------------

export const contactSchema = z.object({
  client_id: z.uuid().optional().nullable(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Deal (legacy compat)
// ---------------------------------------------------------------------------

export const dealSchema = z.object({
  contact_id: z.uuid().optional().nullable(),
  client_id: z.uuid().optional().nullable(),
  title: z.string().min(1).max(300),
  stage: z.enum(["prospect", "contacted", "demo", "proposal", "closed_won", "closed_lost"]).optional(),
  value: z.number().min(0).optional(),
  monthly_value: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  expected_close: z.string().optional(),
  notes: z.string().optional(),
});

export const dealUpdateSchema = dealSchema
  .extend({ closed_at: z.string().optional() })
  .partial();
