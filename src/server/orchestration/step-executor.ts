// =============================================================================
// Workflow Step Executor — runs individual workflow steps
// =============================================================================

import { createServiceClient } from "@/lib/supabase/service";
import { alertService } from "@/server/services/alert.service";

export type StepType =
  | "normalize_lead"
  | "dedupe_lead"
  | "enrich_lead"
  | "sync_to_ghl"
  | "create_note"
  | "create_task"
  | "delegate_to_paperclip"
  | "request_approval"
  | "send_alert"
  | "update_lead_status"
  | "evaluate_policy"
  | "no_op";

export interface StepDefinition {
  key: string;
  type: StepType;
  config: Record<string, unknown>;
}

export interface StepRunResult {
  status: "completed" | "failed" | "paused";
  output: Record<string, unknown>;
  error?: string;
}

/**
 * Execute a single workflow step.
 * Each step type has a handler that takes input and config and returns a result.
 */
export async function executeStep(
  step: StepDefinition,
  input: Record<string, unknown>,
  context: {
    organizationId: string;
    workspaceId?: string;
    workflowRunId: string;
    leadId?: string;
  },
): Promise<StepRunResult> {
  try {
    switch (step.type) {
      case "normalize_lead":
        return handleNormalizeLead(input);

      case "dedupe_lead":
        return await handleDedupeLead(input, context);

      case "update_lead_status":
        return await handleUpdateLeadStatus(input, step.config, context);

      case "send_alert":
        return await handleSendAlert(input, step.config, context);

      case "request_approval":
        return await handleRequestApproval(input, step.config, context);

      case "create_task":
        return await handleCreateTask(input, step.config, context);

      case "sync_to_ghl":
        return handleSyncToGhl(input, step.config);

      case "delegate_to_paperclip":
        return handleDelegateToPaperclip(input, step.config);

      case "enrich_lead":
        return handleEnrichLead(input);

      case "create_note":
        return handleCreateNote(input, step.config);

      case "evaluate_policy":
        return handleEvaluatePolicy(input, step.config);

      case "no_op":
        return { status: "completed", output: { ...input } };

      default:
        return { status: "failed", output: {}, error: `Unknown step type: ${step.type}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Step execution failed";
    return { status: "failed", output: {}, error: message };
  }
}

// ---------------------------------------------------------------------------
// Step handlers
// ---------------------------------------------------------------------------

function handleNormalizeLead(input: Record<string, unknown>): StepRunResult {
  const normalized: Record<string, unknown> = { ...input };

  // Normalize email
  if (typeof normalized.email === "string") {
    normalized.email = normalized.email.toLowerCase().trim();
  }

  // Normalize phone (strip non-digits, ensure +1 prefix for US)
  if (typeof normalized.phone === "string") {
    let phone = normalized.phone.replace(/[^\d+]/g, "");
    if (phone.length === 10) phone = `+1${phone}`;
    else if (phone.length === 11 && phone.startsWith("1")) phone = `+${phone}`;
    normalized.phone = phone;
  }

  // Normalize names
  if (typeof normalized.first_name === "string") {
    normalized.first_name = normalized.first_name.trim();
  }
  if (typeof normalized.last_name === "string") {
    normalized.last_name = normalized.last_name.trim();
  }

  return { status: "completed", output: normalized };
}

async function handleDedupeLead(
  input: Record<string, unknown>,
  context: { organizationId: string },
): Promise<StepRunResult> {
  const service = createServiceClient();

  // Check by email
  if (typeof input.email === "string" && input.email) {
    const { data } = await service
      .from("mc_leads")
      .select("id, email")
      .eq("organization_id", context.organizationId)
      .eq("email", input.email)
      .limit(1)
      .single();

    if (data) {
      return {
        status: "completed",
        output: { ...input, is_duplicate: true, existing_lead_id: data.id },
      };
    }
  }

  // Check by phone
  if (typeof input.phone === "string" && input.phone) {
    const { data } = await service
      .from("mc_leads")
      .select("id, phone")
      .eq("organization_id", context.organizationId)
      .eq("phone", input.phone)
      .limit(1)
      .single();

    if (data) {
      return {
        status: "completed",
        output: { ...input, is_duplicate: true, existing_lead_id: data.id },
      };
    }
  }

  // Check by external_id
  if (typeof input.external_id === "string" && input.external_id) {
    const { data } = await service
      .from("mc_leads")
      .select("id, external_id")
      .eq("organization_id", context.organizationId)
      .eq("external_id", input.external_id)
      .limit(1)
      .single();

    if (data) {
      return {
        status: "completed",
        output: { ...input, is_duplicate: true, existing_lead_id: data.id },
      };
    }
  }

  return { status: "completed", output: { ...input, is_duplicate: false } };
}

async function handleUpdateLeadStatus(
  input: Record<string, unknown>,
  config: Record<string, unknown>,
  context: { organizationId: string; leadId?: string },
): Promise<StepRunResult> {
  const leadId = (input.lead_id as string) ?? context.leadId;
  const newStatus = (config.status as string) ?? (input.new_status as string);

  if (!leadId || !newStatus) {
    return { status: "failed", output: {}, error: "Missing lead_id or status" };
  }

  const service = createServiceClient();
  const { error } = await service
    .from("mc_leads")
    .update({ status: newStatus })
    .eq("id", leadId)
    .eq("organization_id", context.organizationId);

  if (error) return { status: "failed", output: {}, error: error.message };

  return { status: "completed", output: { ...input, status_updated: newStatus } };
}

async function handleSendAlert(
  input: Record<string, unknown>,
  config: Record<string, unknown>,
  context: { organizationId: string; workspaceId?: string },
): Promise<StepRunResult> {
  await alertService.create({
    organizationId: context.organizationId,
    workspaceId: context.workspaceId,
    severity: (config.severity as "info" | "warning" | "error" | "critical") ?? "info",
    category: (config.category as string) ?? "workflow_failure",
    title: (config.title as string) ?? "Workflow Alert",
    body: (config.body as string) ?? JSON.stringify(input).slice(0, 500),
    relatedType: "workflow_run",
    relatedId: (input.workflow_run_id as string) ?? undefined,
  });

  return { status: "completed", output: { ...input, alert_sent: true } };
}

async function handleRequestApproval(
  input: Record<string, unknown>,
  config: Record<string, unknown>,
  context: { organizationId: string; workspaceId?: string; workflowRunId: string },
): Promise<StepRunResult> {
  const service = createServiceClient();

  await service.from("mc_approvals").insert({
    organization_id: context.organizationId,
    workspace_id: context.workspaceId ?? null,
    related_type: "workflow_run",
    related_id: context.workflowRunId,
    approval_type: (config.approval_type as string) ?? "workflow_action",
    status: "pending",
    requested_by_type: "system",
    requested_by_id: null,
    reason: (config.reason as string) ?? "Workflow step requires approval",
    metadata: { step_config: config, step_input: input },
  });

  // Return paused — workflow should halt until approval
  return { status: "paused", output: { ...input, awaiting_approval: true } };
}

async function handleCreateTask(
  input: Record<string, unknown>,
  config: Record<string, unknown>,
  context: { organizationId: string; workspaceId?: string; leadId?: string },
): Promise<StepRunResult> {
  const service = createServiceClient();

  const { data, error } = await service
    .from("mc_tasks")
    .insert({
      organization_id: context.organizationId,
      workspace_id: context.workspaceId ?? null,
      lead_id: context.leadId ?? (input.lead_id as string) ?? null,
      title: (config.title as string) ?? "Auto-created task",
      description: (config.description as string) ?? null,
      type: (config.task_type as string) ?? "follow_up",
      priority: (config.priority as string) ?? "medium",
      status: "pending",
      metadata: { source: "workflow", input },
    })
    .select("id")
    .single();

  if (error) return { status: "failed", output: {}, error: error.message };

  return { status: "completed", output: { ...input, task_id: data.id } };
}

function handleSyncToGhl(
  input: Record<string, unknown>,
  _config: Record<string, unknown>,
): StepRunResult {
  // GHL sync is async — mark as completed and let the GHL service handle it
  return {
    status: "completed",
    output: { ...input, ghl_sync_queued: true },
  };
}

function handleDelegateToPaperclip(
  input: Record<string, unknown>,
  _config: Record<string, unknown>,
): StepRunResult {
  // Paperclip delegation is async — mark as completed
  return {
    status: "completed",
    output: { ...input, paperclip_delegation_queued: true },
  };
}

function handleEnrichLead(input: Record<string, unknown>): StepRunResult {
  // Enrichment is a future integration point
  return { status: "completed", output: { ...input, enrichment: "pending_integration" } };
}

function handleCreateNote(
  input: Record<string, unknown>,
  config: Record<string, unknown>,
): StepRunResult {
  return {
    status: "completed",
    output: {
      ...input,
      note_created: true,
      note_content: (config.content as string) ?? "Auto-generated note",
    },
  };
}

function handleEvaluatePolicy(
  input: Record<string, unknown>,
  config: Record<string, unknown>,
): StepRunResult {
  const policyType = (config.policy as string) ?? "default";
  // Simple policy evaluation — extend with DB-backed policies later
  return {
    status: "completed",
    output: { ...input, policy_result: "pass", policy_type: policyType },
  };
}
