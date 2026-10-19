// =============================================================================
// PaperclipProjectService — manages workspace → Paperclip project linkage
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createPaperclipClient } from "@/lib/paperclip";
import type { SessionContext } from "@/lib/types";

export interface PaperclipProjectRecord {
  id: string;
  organization_id: string;
  workspace_id: string;
  paperclip_project_id: string | null;
  project_name: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

class PaperclipProjectService {
  /**
   * Ensure a Paperclip project exists for a workspace.
   * Creates a local record and attempts to create/link in Paperclip.
   */
  async ensureForWorkspace(
    session: SessionContext,
    workspaceId: string,
    projectName: string,
  ): Promise<PaperclipProjectRecord> {
    const supabase = await createClient();

    // Check if we already have a linked project
    const { data: existing } = await supabase
      .from("mc_paperclip_projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("organization_id", session.organizationId)
      .single();

    if (existing) return existing as PaperclipProjectRecord;

    // Create local record first
    const { data: record, error } = await supabase
      .from("mc_paperclip_projects")
      .insert({
        organization_id: session.organizationId,
        workspace_id: workspaceId,
        project_name: projectName,
        status: "provisioning",
        metadata: {},
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create Paperclip project record: ${error.message}`);

    // Attempt to create in Paperclip (non-blocking failure)
    const client = createPaperclipClient();
    if (client) {
      const result = await client.ensureProject(projectName);
      if (result.success) {
        await supabase
          .from("mc_paperclip_projects")
          .update({
            paperclip_project_id: result.data.id,
            status: "active",
            metadata: result.data.metadata ?? {},
          })
          .eq("id", record.id);

        return {
          ...(record as PaperclipProjectRecord),
          paperclip_project_id: result.data.id,
          status: "active",
        };
      }
      // Paperclip unavailable — mark degraded
      await supabase
        .from("mc_paperclip_projects")
        .update({ status: "degraded" })
        .eq("id", record.id);
    }

    return record as PaperclipProjectRecord;
  }

  /** List all Paperclip projects for the organization. */
  async listByOrg(orgId: string): Promise<PaperclipProjectRecord[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("mc_paperclip_projects")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    return (data ?? []) as PaperclipProjectRecord[];
  }

  /** Sync project status from Paperclip API. */
  async syncStatus(projectId: string): Promise<void> {
    const service = createServiceClient();
    const { data: record } = await service
      .from("mc_paperclip_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!record || !record.paperclip_project_id) return;

    const client = createPaperclipClient();
    if (!client) {
      await service
        .from("mc_paperclip_projects")
        .update({ status: "degraded" })
        .eq("id", projectId);
      return;
    }

    const result = await client.getProject(record.paperclip_project_id);
    if (result.success) {
      await service
        .from("mc_paperclip_projects")
        .update({
          status: result.data.status,
          metadata: result.data.metadata ?? {},
        })
        .eq("id", projectId);
    } else {
      await service
        .from("mc_paperclip_projects")
        .update({ status: "degraded" })
        .eq("id", projectId);
    }
  }
}

export const paperclipProjectService = new PaperclipProjectService();
