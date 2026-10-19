// =============================================================================
// PaperclipWorkerService — manages worker definitions and sync
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createPaperclipClient, DEFAULT_WORKER_TEMPLATES } from "@/lib/paperclip";
import type { SessionContext } from "@/lib/types";

export interface PaperclipWorkerRecord {
  id: string;
  organization_id: string;
  workspace_id: string | null;
  paperclip_worker_id: string | null;
  name: string;
  role: string;
  status: string;
  approval_required: boolean;
  budget_limit: number | null;
  budget_spent: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

class PaperclipWorkerService {
  /**
   * Provision default worker templates for a workspace.
   * Idempotent — skips workers that already exist for the workspace.
   */
  async provisionDefaults(
    session: SessionContext,
    workspaceId: string,
  ): Promise<PaperclipWorkerRecord[]> {
    const supabase = await createClient();

    // Check existing workers for this workspace
    const { data: existing } = await supabase
      .from("mc_paperclip_workers")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("organization_id", session.organizationId);

    const existingRoles = new Set((existing ?? []).map((w: Record<string, unknown>) => w.role));

    const toCreate = DEFAULT_WORKER_TEMPLATES.filter(
      (t) => !existingRoles.has(t.role),
    );

    if (toCreate.length === 0) {
      const { data } = await supabase
        .from("mc_paperclip_workers")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("organization_id", session.organizationId);
      return (data ?? []) as PaperclipWorkerRecord[];
    }

    const records = toCreate.map((t) => ({
      organization_id: session.organizationId,
      workspace_id: workspaceId,
      name: t.name,
      role: t.role,
      status: "provisioned",
      approval_required: t.approvalRequired,
      metadata: {},
    }));

    const { data: created, error } = await supabase
      .from("mc_paperclip_workers")
      .insert(records)
      .select();

    if (error) throw new Error(`Failed to provision workers: ${error.message}`);

    // Return all workers for this workspace
    const { data: all } = await supabase
      .from("mc_paperclip_workers")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("organization_id", session.organizationId);

    return (all ?? created ?? []) as PaperclipWorkerRecord[];
  }

  /** List workers for a workspace. */
  async listByWorkspace(orgId: string, workspaceId: string): Promise<PaperclipWorkerRecord[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("mc_paperclip_workers")
      .select("*")
      .eq("organization_id", orgId)
      .eq("workspace_id", workspaceId)
      .order("name");

    return (data ?? []) as PaperclipWorkerRecord[];
  }

  /** List all workers across the organization. */
  async listByOrg(orgId: string): Promise<PaperclipWorkerRecord[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("mc_paperclip_workers")
      .select("*")
      .eq("organization_id", orgId)
      .order("name");

    return (data ?? []) as PaperclipWorkerRecord[];
  }

  /** Sync worker definitions from Paperclip API for a project. */
  async syncFromPaperclip(
    projectId: string,
    paperclipProjectId: string,
    orgId: string,
    workspaceId: string,
  ): Promise<void> {
    const client = createPaperclipClient();
    if (!client) return;

    const result = await client.listWorkers(paperclipProjectId);
    if (!result.success) return;

    const service = createServiceClient();
    for (const worker of result.data) {
      // Upsert by paperclip_worker_id
      const { data: existing } = await service
        .from("mc_paperclip_workers")
        .select("id")
        .eq("paperclip_worker_id", worker.id)
        .eq("organization_id", orgId)
        .single();

      if (existing) {
        await service
          .from("mc_paperclip_workers")
          .update({
            status: worker.status,
            metadata: worker.metadata ?? {},
            budget_limit: worker.budget?.limit ?? null,
            budget_spent: worker.budget?.spent ?? null,
          })
          .eq("id", existing.id);
      } else {
        await service.from("mc_paperclip_workers").insert({
          organization_id: orgId,
          workspace_id: workspaceId,
          paperclip_worker_id: worker.id,
          name: worker.name,
          role: worker.role,
          status: worker.status,
          budget_limit: worker.budget?.limit ?? null,
          budget_spent: worker.budget?.spent ?? null,
          metadata: worker.metadata ?? {},
        });
      }
    }
  }
}

export const paperclipWorkerService = new PaperclipWorkerService();
