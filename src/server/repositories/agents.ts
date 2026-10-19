import { BaseRepository } from "./base";
import type { Agent } from "@/lib/types";

export class AgentRepository extends BaseRepository<Agent> {
  constructor() {
    super("mc_agents");
  }

  protected buildSearchFilter(search: string): string {
    return `name.ilike.%${search}%,platform.ilike.%${search}%`;
  }

  async listByWorkspace(workspaceId: string): Promise<Agent[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name");
    if (error) throw new Error(`listByWorkspace: ${error.message}`);
    return (data ?? []) as Agent[];
  }

  async listByClient(clientId: string): Promise<Agent[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("client_id", clientId)
      .order("name");
    if (error) throw new Error(`listByClient: ${error.message}`);
    return (data ?? []) as Agent[];
  }

  async countActive(orgId: string): Promise<number> {
    const supabase = await this.getClient();
    const { count, error } = await supabase
      .from(this.tableName)
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "active");
    if (error) return 0;
    return count ?? 0;
  }
}

export const agentRepository = new AgentRepository();
