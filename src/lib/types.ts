// ---------------------------------------------------------------------------
// Voxaris Mission Control -- Domain Types
// ---------------------------------------------------------------------------

/** Client / account managed by Voxaris. */
export interface Client {
  id: string;
  slug: string;
  name: string;
  industry: string;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  website: string | null;
  status: "active" | "onboarding" | "paused" | "churned";
  onboarding_step: number;
  health_score: number;
  contract_start: string | null;
  contract_end: string | null;
  monthly_retainer: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  /** Computed / joined fields (optional). */
  agent_count?: number;
  call_count_30d?: number;
  total_cost_30d?: number;
}

/** AI agent deployed for a client across any platform. */
export interface Agent {
  id: string;
  client_id: string;
  name: string;
  platform: "vapi" | "tavus";
  platform_agent_id: string;
  agent_type: "inbound" | "outbound" | "video" | "both";
  phone_number: string | null;
  voice_id: string | null;
  voice_name: string | null;
  llm_id: string | null;
  prompt_version: number;
  status: "active" | "inactive" | "development" | "retired";
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  /** Joined / computed fields. */
  client?: Client;
  call_count_30d?: number;
  avg_duration?: number;
  success_rate?: number;
}

/** Unified call record normalised across VAPI and Tavus. */
export interface UnifiedCall {
  id: string;
  client_id: string;
  agent_id: string;
  platform: "vapi" | "tavus";
  platform_call_id: string;
  direction: "inbound" | "outbound";
  caller_number: string | null;
  callee_number: string | null;
  status:
    | "queued"
    | "ringing"
    | "in_progress"
    | "completed"
    | "failed"
    | "no_answer"
    | "busy"
    | "voicemail";
  outcome: string | null;
  duration_seconds: number;
  cost_usd: number;
  transcript: string | null;
  recording_url: string | null;
  summary: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  metadata: Record<string, unknown> | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  /** Joined relations. */
  client?: Client;
  agent?: Agent;
}

/** Contact / lead stored for outreach and CRM sync. */
export interface Contact {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company: string | null;
  industry: string | null;
  linkedin_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  source: string | null;
  tags: string[];
  apollo_id: string | null;
  ghl_contact_id: string | null;
  enriched_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/** Sales deal / opportunity. */
export interface Deal {
  id: string;
  contact_id: string | null;
  client_id: string;
  title: string;
  stage:
    | "prospect"
    | "contacted"
    | "demo"
    | "proposal"
    | "closed_won"
    | "closed_lost";
  value: number;
  monthly_value: number;
  probability: number;
  expected_close: string | null;
  notes: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  /** Joined relations. */
  contact?: Contact;
  client?: Client;
}

/** Invoice issued to a client. */
export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  due_date: string;
  paid_date: string | null;
  period_start: string;
  period_end: string;
  line_items: InvoiceLineItem[];
  notes: string | null;
  created_at: string;
  /** Joined relations. */
  client?: Client;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

/** Platform cost record for margin tracking. */
export interface PlatformCost {
  id: string;
  client_id: string;
  platform: "vapi" | "tavus" | "vercel" | "supabase" | "other";
  amount: number;
  period_month: string;
  description: string | null;
  created_at: string;
}

/** Content item for marketing / social scheduling. */
export interface ContentItem {
  id: string;
  title: string;
  content_type: "twitter" | "linkedin" | "blog" | "email" | "video";
  status: "draft" | "scheduled" | "published" | "archived";
  body: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  platform_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/** Vercel deployment record. */
export interface Deployment {
  id: string;
  project_name: string;
  vercel_project_id: string | null;
  domain: string | null;
  client_id: string | null;
  last_deployment_url: string | null;
  last_deployment_status:
    | "ready"
    | "building"
    | "error"
    | "queued"
    | "canceled"
    | null;
  last_deployed_at: string | null;
  git_repo: string | null;
  env_vars: Record<string, string> | null;
  created_at: string;
}

/** Activity feed entry for the global timeline. */
export interface ActivityEntry {
  id: string;
  action: string;
  details: string | null;
  entity_type:
    | "client"
    | "agent"
    | "call"
    | "contact"
    | "deal"
    | "invoice"
    | "deployment"
    | "content";
  entity_id: string | null;
  source: string | null;
  user_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Utility / helper types
// ---------------------------------------------------------------------------

/** Generic paginated response wrapper. */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Common filter params used across list endpoints. */
export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}
