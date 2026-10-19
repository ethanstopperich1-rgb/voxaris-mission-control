// ---------------------------------------------------------------------------
// Voxaris Mission Control — Domain Types (Phase 1)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Auth & Tenancy
// ---------------------------------------------------------------------------

export type UserRole = 'owner' | 'admin' | 'operator' | 'sales' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface SessionContext {
  userId: string;
  organizationId: string;
  role: UserRole;
  email: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface Client {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  website: string | null;
  status: 'active' | 'onboarding' | 'paused' | 'churned';
  onboarding_step: number;
  health_score: number;
  contract_start: string | null;
  contract_end: string | null;
  monthly_retainer: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  agent_count?: number;
  workspace_count?: number;
  lead_count?: number;
  call_count_30d?: number;
  total_cost_30d?: number;
}

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

export type WorkspaceEnvironment = 'production' | 'staging' | 'development';

export interface Workspace {
  id: string;
  organization_id: string;
  client_id: string;
  name: string;
  slug: string;
  environment: WorkspaceEnvironment;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  client?: Client;
  agent_count?: number;
  lead_count?: number;
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

export type AgentPlatform = 'vapi' | 'tavus' | 'retell' | 'custom';
export type AgentType = 'inbound' | 'outbound' | 'video' | 'both';
export type AgentStatus = 'active' | 'inactive' | 'development' | 'retired';

export interface Agent {
  id: string;
  organization_id: string | null;
  client_id: string | null;
  workspace_id: string | null;
  name: string;
  platform: AgentPlatform;
  platform_agent_id: string;
  agent_type: AgentType;
  phone_number: string | null;
  voice_id: string | null;
  voice_name: string | null;
  llm_id: string | null;
  prompt_version: string;
  status: AgentStatus;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  workspace?: Workspace;
}

// ---------------------------------------------------------------------------
// Lead
// ---------------------------------------------------------------------------

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'nurturing' | 'converted' | 'lost' | 'disqualified';

export interface Lead {
  id: string;
  organization_id: string;
  workspace_id: string | null;
  client_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  external_id: string | null;
  ghl_contact_id: string | null;
  apollo_id: string | null;
  status: LeadStatus;
  source: string | null;
  score: number;
  assigned_to: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  last_contacted_at: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  workspace?: Workspace;
  assignee?: Profile;
  conversations?: Conversation[];
  tasks?: Task[];
}

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------

export type ConversationChannel = 'phone' | 'sms' | 'email' | 'video' | 'chat' | 'webhook';

export interface Conversation {
  id: string;
  organization_id: string;
  lead_id: string;
  agent_id: string | null;
  channel: ConversationChannel;
  direction: 'inbound' | 'outbound' | null;
  platform_call_id: string | null;
  status: 'active' | 'completed' | 'failed' | 'missed';
  duration_seconds: number;
  summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  outcome: string | null;
  metadata: Record<string, unknown>;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  lead?: Lead;
  agent?: Agent;
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

export type TaskType = 'follow_up' | 'callback' | 'review' | 'approval' | 'sync' | 'custom';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  organization_id: string;
  lead_id: string | null;
  workspace_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  due_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  lead?: Lead;
  assignee?: Profile;
}

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export type WorkflowTriggerType = 'manual' | 'webhook' | 'schedule' | 'event';
export type WorkflowRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Workflow {
  id: string;
  organization_id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  trigger_type: WorkflowTriggerType;
  steps: Record<string, unknown>[];
  config: Record<string, unknown>;
  enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: string;
  organization_id: string;
  workflow_id: string;
  status: WorkflowRunStatus;
  trigger_type: string | null;
  triggered_by: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error: string | null;
  steps_completed: number;
  steps_total: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  workflow?: Workflow;
  triggerer?: Profile;
}

// ---------------------------------------------------------------------------
// Deployment
// ---------------------------------------------------------------------------

export interface Deployment {
  id: string;
  organization_id: string | null;
  project_name: string;
  vercel_project_id: string | null;
  domain: string | null;
  client_id: string | null;
  last_deployment_url: string | null;
  last_deployment_status: 'ready' | 'building' | 'error' | 'queued' | 'canceled' | null;
  last_deployed_at: string | null;
  git_repo: string | null;
  env_vars: Record<string, string> | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export interface AuditLog {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Profile;
}

// ---------------------------------------------------------------------------
// GHL Credentials
// ---------------------------------------------------------------------------

export interface GHLCredentials {
  id: string;
  organization_id: string;
  workspace_id: string | null;
  location_id: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  api_version: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Activity (legacy compat)
// ---------------------------------------------------------------------------

export interface ActivityEntry {
  id: string;
  organization_id: string | null;
  action: string;
  details: string | null;
  entity_type: string | null;
  entity_id: string | null;
  source: string | null;
  user_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Legacy compat types (pages still using mc_calls, mc_contacts, etc.)
// ---------------------------------------------------------------------------

export interface UnifiedCall {
  id: string;
  organization_id: string | null;
  client_id: string | null;
  agent_id: string | null;
  platform: string;
  platform_call_id: string;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'failed' | 'in_progress' | 'missed' | 'queued';
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  from_number: string | null;
  to_number: string | null;
  recording_url: string | null;
  transcript: string | null;
  summary: string | null;
  sentiment: string | null;
  outcome: string | null;
  cost: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  agent?: Agent;
  client?: Client;
}

export interface Contact {
  id: string;
  organization_id: string | null;
  client_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  tags: string[];
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  organization_id: string | null;
  contact_id: string | null;
  client_id: string | null;
  title: string;
  stage: string;
  value: number;
  monthly_value: number;
  probability: number;
  expected_close: string | null;
  closed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  organization_id: string | null;
  client_id: string | null;
  title: string;
  content_type: string;
  body: string | null;
  status: string;
  platform_url: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  tags: string[];
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Utility types
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };
