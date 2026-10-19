// =============================================================================
// PaperclipTaskService — task dispatch, tracking, and mirroring
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createPaperclipClient } from "@/lib/paperclip";
import type { SessionContext } from "@/lib/types";

export interface PaperclipTaskRecord {
  id: string;
  organization_id: string;
  workspace_id: string | null;
  paperclip_task_id: string | null;
  worker_id: string | null;
  title: string;
  goal: string;
  status: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error: string | null;
  cost_estimate: number | null;
  actual_cost: number | null;
  requires_approval: boolean;
  approval_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface CreateTaskParams {
  workspaceId?: string;
  workerId?: string;
  title: string;
  goal: string;
  input: Record<string, unknown>;
  requiresApproval?: boolean;
  budget?: number;
}

class PaperclipTaskService {
  /**
   * Create a task and dispatch to Paperclip if available.
   * If Paperclip is unavailable, the task is created locally with 'pending_dispatch' status.
   */
  async createTask(
    session: SessionContext,
    params: CreateTaskParams,
  ): Promise<PaperclipTaskRecord> {
    const supabase = await createClient();

    // Create local record
    const { data: record, error } = await supabase
      .from("mc_paperclip_tasks")
      .insert({
        organization_id: session.organizationId,
        workspace_id: params.workspaceId ?? null,
        worker_id: params.workerId ?? null,
        title: params.title,
        goal: params.goal,
        status: "pending_dispatch",
        input: params.input,
        output: {},
        requires_approval: params.requiresApproval ?? false,
        metadata: {},
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create task: ${error.message}`);

    // If approval required, don't dispatch yet
    if (params.requiresApproval) {
      await supabase
        .from("mc_paperclip_tasks")
        .update({ status: "awaiting_approval" })
        .eq("id", record.id);
      return { ...(record as PaperclipTaskRecord), status: "awaiting_approval" };
    }

    // Attempt dispatch to Paperclip
    return this.dispatchTask(record as PaperclipTaskRecord, params.budget);
  }

  /**
   * Dispatch a pending task to Paperclip.
   * Returns the updated task record.
   */
  async dispatchTask(
    task: PaperclipTaskRecord,
    budget?: number,
  ): Promise<PaperclipTaskRecord> {
    const client = createPaperclipClient();
    if (!client) {
      // Paperclip unavailable — remain in pending_dispatch, create alert
      const service = createServiceClient();
      await service.from("mc_alerts").insert({
        organization_id: task.organization_id,
        workspace_id: task.workspace_id,
        severity: "warning",
        category: "paperclip_unavailable",
        title: "Task dispatch failed — Paperclip unavailable",
        body: `Task "${task.title}" could not be dispatched. Paperclip is not configured or unreachable.`,
        related_type: "paperclip_task",
        related_id: task.id,
      });
      return task;
    }

    const result = await client.createTask({
      title: task.title,
      goal: task.goal,
      workerId: task.worker_id ?? undefined,
      input: task.input,
      budget,
    });

    const service = createServiceClient();
    if (result.success) {
      await service
        .from("mc_paperclip_tasks")
        .update({
          paperclip_task_id: result.data.id,
          status: result.data.status,
          cost_estimate: result.data.costEstimate ?? null,
        })
        .eq("id", task.id);

      return {
        ...task,
        paperclip_task_id: result.data.id,
        status: result.data.status,
      };
    }

    // Dispatch failed
    await service
      .from("mc_paperclip_tasks")
      .update({ status: "dispatch_failed", error: result.error })
      .eq("id", task.id);

    await service.from("mc_alerts").insert({
      organization_id: task.organization_id,
      workspace_id: task.workspace_id,
      severity: "error",
      category: "paperclip_unavailable",
      title: "Task dispatch failed",
      body: `Task "${task.title}" failed to dispatch: ${result.error}`,
      related_type: "paperclip_task",
      related_id: task.id,
    });

    return { ...task, status: "dispatch_failed", error: result.error };
  }

  /** Sync task status from Paperclip. */
  async syncTaskStatus(taskId: string): Promise<void> {
    const service = createServiceClient();
    const { data: record } = await service
      .from("mc_paperclip_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (!record || !record.paperclip_task_id) return;

    const client = createPaperclipClient();
    if (!client) return;

    const result = await client.getTask(record.paperclip_task_id);
    if (!result.success) return;

    await service
      .from("mc_paperclip_tasks")
      .update({
        status: result.data.status,
        output: result.data.output ?? {},
        actual_cost: result.data.actualCost ?? null,
        error: result.data.error ?? null,
      })
      .eq("id", taskId);
  }

  /** Cancel a task (locally and in Paperclip). */
  async cancelTask(session: SessionContext, taskId: string): Promise<void> {
    const supabase = await createClient();
    const { data: record } = await supabase
      .from("mc_paperclip_tasks")
      .select("*")
      .eq("id", taskId)
      .eq("organization_id", session.organizationId)
      .single();

    if (!record) throw new Error("Task not found");

    // Cancel in Paperclip if linked
    if (record.paperclip_task_id) {
      const client = createPaperclipClient();
      if (client) {
        await client.cancelTask(record.paperclip_task_id);
      }
    }

    await supabase
      .from("mc_paperclip_tasks")
      .update({ status: "cancelled" })
      .eq("id", taskId);
  }

  /** List tasks for a workspace. */
  async listByWorkspace(orgId: string, workspaceId: string): Promise<PaperclipTaskRecord[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("mc_paperclip_tasks")
      .select("*")
      .eq("organization_id", orgId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50);

    return (data ?? []) as PaperclipTaskRecord[];
  }

  /** List recent tasks across the organization. */
  async listRecent(orgId: string, limit = 20): Promise<PaperclipTaskRecord[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("mc_paperclip_tasks")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data ?? []) as PaperclipTaskRecord[];
  }

  /** Get task by ID. */
  async getById(taskId: string): Promise<PaperclipTaskRecord | null> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("mc_paperclip_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    return data as PaperclipTaskRecord | null;
  }
}

export const paperclipTaskService = new PaperclipTaskService();
