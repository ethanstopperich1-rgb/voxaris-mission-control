// =============================================================================
// Paperclip Orchestration — Types
// =============================================================================

export interface PaperclipConfig {
  baseUrl: string;
  apiKey?: string;
  companyId?: string;
}

export interface PaperclipProject {
  id: string;
  name: string;
  status: string;
  workers: PaperclipWorker[];
  metadata: Record<string, unknown>;
}

export interface PaperclipWorker {
  id: string;
  name: string;
  role: string;
  status: string;
  budget?: { limit: number; spent: number };
  metadata: Record<string, unknown>;
}

export interface PaperclipTask {
  id: string;
  title: string;
  goal: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  assignedWorkerId?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  costEstimate?: number;
  actualCost?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaperclipTaskCreateParams {
  title: string;
  goal: string;
  workerId?: string;
  input: Record<string, unknown>;
  requiresApproval?: boolean;
  budget?: number;
}

export type PaperclipResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; degraded?: boolean };

/** Default worker templates for new workspaces. */
export const DEFAULT_WORKER_TEMPLATES = [
  { name: 'Intake Router', role: 'classify_and_route_leads', approvalRequired: false },
  { name: 'Follow-Up Coordinator', role: 'decide_next_outreach', approvalRequired: false },
  { name: 'Funnel Auditor', role: 'analyze_funnel_bottlenecks', approvalRequired: false },
  { name: 'Offer Strategist', role: 'recommend_offers', approvalRequired: false },
  { name: 'Proposal Writer', role: 'draft_proposals', approvalRequired: true },
  { name: 'CRM Sync Analyst', role: 'monitor_sync_issues', approvalRequired: false },
  { name: 'Deployment Coordinator', role: 'coordinate_deployments', approvalRequired: true },
  { name: 'Reporting Analyst', role: 'summarize_kpis', approvalRequired: false },
] as const;
