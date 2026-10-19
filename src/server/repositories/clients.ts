import { BaseRepository } from "./base";
import type { Client } from "@/lib/types";

export class ClientRepository extends BaseRepository<Client> {
  constructor() {
    super("mc_clients");
  }

  protected buildSearchFilter(search: string): string {
    return `name.ilike.%${search}%,slug.ilike.%${search}%,industry.ilike.%${search}%`;
  }

  async findBySlug(slug: string): Promise<Client | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("slug", slug)
      .single();
    if (error) return null;
    return data as Client;
  }

  /** List clients with computed counts for dashboard. */
  async listWithCounts(orgId: string): Promise<Client[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("organization_id", orgId)
      .order("name");
    if (error) throw new Error(`listWithCounts: ${error.message}`);
    return (data ?? []) as Client[];
  }
}

export const clientRepository = new ClientRepository();
