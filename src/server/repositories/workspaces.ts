import { BaseRepository } from "./base";
import type { Workspace } from "@/lib/types";

export class WorkspaceRepository extends BaseRepository<Workspace> {
  constructor() {
    super("mc_workspaces");
  }

  protected buildSearchFilter(search: string): string {
    return `name.ilike.%${search}%,slug.ilike.%${search}%`;
  }

  async findBySlug(clientId: string, slug: string): Promise<Workspace | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("client_id", clientId)
      .eq("slug", slug)
      .single();
    if (error) return null;
    return data as Workspace;
  }

  async listByClient(clientId: string): Promise<Workspace[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("client_id", clientId)
      .order("name");
    if (error) throw new Error(`listByClient: ${error.message}`);
    return (data ?? []) as Workspace[];
  }
}

export const workspaceRepository = new WorkspaceRepository();
