import { auditLogRepository } from "../repositories";
import type { SessionContext, AuditLog } from "@/lib/types";

/**
 * AuditService — logs every mutation to mc_audit_logs.
 * Call this from other services after successful writes.
 */
export class AuditService {
  async logAction(
    session: SessionContext,
    action: string,
    entityType: string,
    entityId?: string,
    opts?: {
      oldData?: Record<string, unknown> | null;
      newData?: Record<string, unknown> | null;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    await auditLogRepository.log({
      organizationId: session.organizationId,
      actorId: session.userId,
      action,
      entityType,
      entityId,
      oldData: opts?.oldData,
      newData: opts?.newData,
      ipAddress: opts?.ipAddress,
      userAgent: opts?.userAgent,
      metadata: opts?.metadata,
    });
  }

  async getRecent(orgId: string, limit = 50): Promise<AuditLog[]> {
    return auditLogRepository.listRecent(orgId, limit);
  }

  async getEntityHistory(entityType: string, entityId: string): Promise<AuditLog[]> {
    return auditLogRepository.listByEntity(entityType, entityId);
  }
}

export const auditService = new AuditService();
