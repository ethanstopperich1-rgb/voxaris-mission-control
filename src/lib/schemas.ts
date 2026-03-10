import { z } from "zod";

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------
export const clientSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  status: z
    .enum(["active", "onboarding", "churned", "paused"])
    .optional(),
  monthly_retainer: z.number().min(0).optional(),
  notes: z.string().optional(),
});

/** Partial variant used for PUT / PATCH updates. */
export const clientUpdateSchema = clientSchema
  .omit({ slug: true })
  .extend({
    health_score: z.number().min(0).max(100).optional(),
    onboarding_step: z.number().min(0).optional(),
    contract_start: z.string().optional(),
    contract_end: z.string().optional(),
    primary_color: z.string().optional(),
    accent_color: z.string().optional(),
    logo_url: z.string().url().optional().or(z.literal("")),
  })
  .partial();

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------
export const agentSchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  platform: z.enum(["vapi", "tavus"]),
  platform_agent_id: z.string().min(1),
  agent_type: z
    .enum(["inbound", "outbound", "video", "both"])
    .optional(),
  phone_number: z.string().optional(),
  voice_id: z.string().optional(),
  voice_name: z.string().optional(),
  llm_id: z.string().optional(),
  status: z
    .enum(["active", "inactive", "development", "retired"])
    .optional(),
});

/** Partial variant for PATCH updates. */
export const agentUpdateSchema = agentSchema
  .extend({
    prompt_version: z.number().int().min(1).optional(),
    config: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .partial();

// ---------------------------------------------------------------------------
// Deal
// ---------------------------------------------------------------------------
export const dealSchema = z.object({
  contact_id: z.string().uuid().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(300),
  stage: z
    .enum([
      "prospect",
      "contacted",
      "demo",
      "proposal",
      "closed_won",
      "closed_lost",
    ])
    .optional(),
  value: z.number().min(0).optional(),
  monthly_value: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  expected_close: z.string().optional(),
  notes: z.string().optional(),
});

/** Partial variant for PATCH updates. */
export const dealUpdateSchema = dealSchema
  .extend({
    closed_at: z.string().optional(),
  })
  .partial();

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------
export const contactSchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
});
