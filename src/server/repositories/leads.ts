import { BaseRepository } from "./base";
import type { Lead } from "@/lib/types";

export class LeadRepository extends BaseRepository<Lead> {
  constructor() {
    super("mc_leads");
  }

  protected buildSearchFilter(search: string): string {
    return `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`;
  }

  /** Deduplicate: find existing lead by phone, email, or external_id within an org. */
  async findDuplicate(
    orgId: string,
    params: { email?: string; phone?: string; external_id?: string },
  ): Promise<Lead | null> {
    const supabase = await this.getClient();

    // Try external_id first (most specific)
    if (params.external_id) {
      const { data } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("organization_id", orgId)
        .eq("external_id", params.external_id)
        .single();
      if (data) return data as Lead;
    }

    // Try email
    if (params.email) {
      const { data } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("organization_id", orgId)
        .eq("email", params.email)
        .single();
      if (data) return data as Lead;
    }

    // Try phone
    if (params.phone) {
      const { data } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("organization_id", orgId)
        .eq("phone", params.phone)
        .single();
      if (data) return data as Lead;
    }

    return null;
  }

  /** Upsert a lead — dedupe then create or update. */
  async upsert(orgId: string, payload: Partial<Lead>): Promise<{ lead: Lead; created: boolean }> {
    const existing = await this.findDuplicate(orgId, {
      email: payload.email ?? undefined,
      phone: payload.phone ?? undefined,
      external_id: payload.external_id ?? undefined,
    });

    if (existing) {
      const updated = await this.update(existing.id, payload);
      return { lead: updated, created: false };
    }

    const created = await this.create(payload, orgId);
    return { lead: created, created: true };
  }

  /** Get leads by status for a workspace. */
  async listByStatus(
    workspaceId: string,
    status: string,
  ): Promise<Lead[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`listByStatus: ${error.message}`);
    return (data ?? []) as Lead[];
  }

  /** Count leads created today for an org. */
  async countToday(orgId: string): Promise<number> {
    const supabase = await this.getClient();
    const today = new Date().toISOString().slice(0, 10);
    const { count, error } = await supabase
      .from(this.tableName)
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("created_at", `${today}T00:00:00Z`);

    if (error) return 0;
    return count ?? 0;
  }

  /** Count uncontacted leads for an org. */
  async countUncontacted(orgId: string): Promise<number> {
    const supabase = await this.getClient();
    const { count, error } = await supabase
      .from(this.tableName)
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "new");

    if (error) return 0;
    return count ?? 0;
  }
}

export const leadRepository = new LeadRepository();
