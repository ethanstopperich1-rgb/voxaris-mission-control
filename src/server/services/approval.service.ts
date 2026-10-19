// =============================================================================
// ApprovalService — approval lifecycle and policy evaluation
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SessionContext, UserRole } from "@/lib/types";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "auto_approved";

export interface ApprovalRecord {
  id: string;
  organization_id: string;
  workspace_id: string | null;
  related_type: string;
  related_id: string;
  approval_type: string;
  status: ApprovalStatus;
  requested_by_type: "user" | "agent" | "system";
  requested_by_id: string | null;
  decided_by: string | null;
  reason: string | null;
  expires_at: string | null;
  decided_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface RequestApprovalParams {
  workspaceId?: string;
  relatedType: string;
  relatedId: string;
  approvalType: string;
  requestedByType: "user" | "agent" | "system";
  requestedById?: string;
  reason?: string;
  expiresInMinutes?: number;
  metadata?: Record<string, unknown>;
}

/** Simple policy rules — extend later with DB-backed policies. */
const AUTO_APPROVE_ACTIONS = new Set([
  "classify_and_route_leads",
  "analyze_funnel_bottlenecks",
  "summarize_kpis",
  "monitor_sync_issues",
]);

const ROLE_CAN_APPROVE: Record<string, UserRole[]> = {
  default: ["owner", "admin", "operator"],
  production_deployment: ["owner", "admin"],
  high_cost_task: ["owner", "admin"],
  external_send: ["owner", "admin", "operator"],
};

class ApprovalService {
  /**
   * Evaluate whether an action needs approval.
   * Returns true if approval is required.
   */
  evaluatePolicy(
    actionType: string,
    actorRole: UserRole,
    _context?: Record<string, unknown>,
  ): boolean {
    // Auto-approve known safe actions
    if (AUTO_APPROVE_ACTIONS.has(actionType)) return false;

    // Owners and admins bypass most approvals
    if (actorRole === "owner") return false;

    // Actions that always need approval
    const alwaysApprove = [
      "production_deployment",
      "external_send",
      "high_cost_task",
      "destructive_sync",
      "prompt_version_promotion",
    ];

    return alwaysApprove.includes(actionType);
  }

  /** Request a new approval. */
  async request(
    session: SessionContext,
    params: RequestApprovalParams,
  ): Promise<ApprovalRecord> {
    const supabase = await createClient();

    // Check if this should be auto-approved
    const needsApproval = this.evaluatePolicy(
      params.approvalType,
      session.role,
      params.metadata,
    );

    const status: ApprovalStatus = needsApproval ? "pending" : "auto_approved";
    const expiresAt = params.expiresInMinutes
      ? new Date(Date.now() + params.expiresInMinutes * 60000).toISOString()
      : null;

    const { data, error } = await supabase
      .from("mc_approvals")
      .insert({
        organization_id: session.organizationId,
        workspace_id: params.workspaceId ?? null,
        related_type: params.relatedType,
        related_id: params.relatedId,
        approval_type: params.approvalType,
        status,
        requested_by_type: params.requestedByType,
        requested_by_id: params.requestedById ?? session.userId,
        reason: params.reason ?? null,
        expires_at: expiresAt,
        decided_at: !needsApproval ? new Date().toISOString() : null,
        metadata: params.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create approval: ${error.message}`);

    // If auto-approved, create an audit log
    if (!needsApproval) {
      const svc = createServiceClient();
      await svc.from("mc_audit_logs").insert({
        organization_id: session.organizationId,
        actor_id: session.userId,
        action: "approval.auto_approved",
        entity_type: "approval",
        entity_id: data.id,
        metadata: { approval_type: params.approvalType, reason: "policy_auto_approved" },
      });
    }

    return data as ApprovalRecord;
  }

  /** Approve a pending approval. */
  async approve(session: SessionContext, approvalId: string, reason?: string): Promise<ApprovalRecord> {
    this.assertCanApprove(session.role);
    return this.decide(session, approvalId, "approved", reason);
  }

  /** Reject a pending approval. */
  async reject(session: SessionContext, approvalId: string, reason?: string): Promise<ApprovalRecord> {
    this.assertCanApprove(session.role);
    return this.decide(session, approvalId, "rejected", reason);
  }

  private async decide(
    session: SessionContext,
    approvalId: string,
    status: "approved" | "rejected",
    reason?: string,
  ): Promise<ApprovalRecord> {
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("mc_approvals")
      .select("*")
      .eq("id", approvalId)
      .eq("organization_id", session.organizationId)
      .single();

    if (!existing) throw new Error("Approval not found");
    if (existing.status !== "pending") throw new Error(`Cannot ${status}: approval is already ${existing.status}`);

    // Check if expired
    if (existing.expires_at && new Date(existing.expires_at) < new Date()) {
      await supabase
        .from("mc_approvals")
        .update({ status: "expired" })
        .eq("id", approvalId);
      throw new Error("Approval has expired");
    }

    const { data, error } = await supabase
      .from("mc_approvals")
      .update({
        status,
        decided_by: session.userId,
        decided_at: new Date().toISOString(),
        reason: reason ?? existing.reason,
      })
      .eq("id", approvalId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update approval: ${error.message}`);

    // Audit
    const svc = createServiceClient();
    await svc.from("mc_audit_logs").insert({
      organization_id: session.organizationId,
      actor_id: session.userId,
      action: `approval.${status}`,
      entity_type: "approval",
      entity_id: approvalId,
      metadata: { reason, related_type: existing.related_type, related_id: existing.related_id },
    });

    return data as ApprovalRecord;
  }

  private assertCanApprove(role: UserRole): void {
    const allowed = ROLE_CAN_APPROVE.default;
    if (!allowed.includes(role)) {
      throw new Error(`Role '${role}' is not authorized to approve/reject`);
    }
  }

  /** List approvals for the organization. */
  async list(
    orgId: string,
    filters?: { status?: string; workspaceId?: string },
    limit = 25,
  ): Promise<ApprovalRecord[]> {
    const supabase = await createClient();
    let query = supabase
      .from("mc_approvals")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.workspaceId) query = query.eq("workspace_id", filters.workspaceId);

    const { data } = await query;
    return (data ?? []) as ApprovalRecord[];
  }

  /** Count pending approvals. */
  async countPending(orgId: string): Promise<number> {
    const supabase = await createClient();
    const { count } = await supabase
      .from("mc_approvals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "pending");

    return count ?? 0;
  }

  /** Get by ID. */
  async getById(approvalId: string): Promise<ApprovalRecord | null> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("mc_approvals")
      .select("*")
      .eq("id", approvalId)
      .single();

    return data as ApprovalRecord | null;
  }
}

export const approvalService = new ApprovalService();
