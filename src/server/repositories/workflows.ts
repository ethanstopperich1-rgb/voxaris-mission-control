import { BaseRepository } from "./base";
import type { Workflow, WorkflowRun } from "@/lib/types";

export class WorkflowRepository extends BaseRepository<Workflow> {
  constructor() {
    super("mc_workflows");
  }

  protected buildSearchFilter(search: string): string {
    return `name.ilike.%${search}%,description.ilike.%${search}%`;
  }

  async listByWorkspace(workspaceId: string): Promise<Workflow[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name");
    if (error) throw new Error(`listByWorkspace: ${error.message}`);
    return (data ?? []) as Workflow[];
  }
}

export class WorkflowRunRepository extends BaseRepository<WorkflowRun> {
  constructor() {
    super("mc_workflow_runs");
  }

  async listByWorkflow(workflowId: string): Promise<WorkflowRun[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("workflow_id", workflowId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(`listByWorkflow: ${error.message}`);
    return (data ?? []) as WorkflowRun[];
  }

  async countFailed(orgId: string): Promise<number> {
    const supabase = await this.getClient();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from(this.tableName)
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "failed")
      .gte("created_at", oneDayAgo);
    if (error) return 0;
    return count ?? 0;
  }

  async countRunning(orgId: string): Promise<number> {
    const supabase = await this.getClient();
    const { count, error } = await supabase
      .from(this.tableName)
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "running");
    if (error) return 0;
    return count ?? 0;
  }
}

export const workflowRepository = new WorkflowRepository();
export const workflowRunRepository = new WorkflowRunRepository();
