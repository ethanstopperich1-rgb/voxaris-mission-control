import { BaseRepository } from "./base";
import type { AuditLog } from "@/lib/types";

export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor() {
    super("mc_audit_logs");
  }

  /** Log an action — uses service client to bypass RLS when needed. */
  async log(params: {
    organizationId: string;
    actorId: string | null;
    action: string;
    entityType: string;
    entityId?: string;
    oldData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const client = this.getServiceClient();
    await client.from(this.tableName).insert({
      organization_id: params.organizationId,
      actor_id: params.actorId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      old_data: params.oldData ?? null,
      new_data: params.newData ?? null,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
      metadata: params.metadata ?? {},
    });
  }

  /** Get recent audit logs for an org. */
  async listRecent(orgId: string, limit = 50): Promise<AuditLog[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`listRecent: ${error.message}`);
    return (data ?? []) as AuditLog[];
  }

  /** Get audit logs for a specific entity. */
  async listByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(`listByEntity: ${error.message}`);
    return (data ?? []) as AuditLog[];
  }
}

export const auditLogRepository = new AuditLogRepository();
