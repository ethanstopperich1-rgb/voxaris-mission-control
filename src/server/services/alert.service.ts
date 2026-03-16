// =============================================================================
// AlertService — operational alerts creation and management
// =============================================================================

import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export type AlertSeverity = "info" | "warning" | "error" | "critical";
export type AlertStatus = "open" | "acknowledged" | "resolved" | "snoozed";

export type AlertCategory =
  | "webhook_failure"
  | "integration_failure"
  | "workflow_failure"
  | "paperclip_unavailable"
  | "ghl_sync_issue"
  | "deployment_failure"
  | "policy_violation"
  | "stale_leads"
  | "data_mismatch"
  | "system";

export interface AlertRecord {
  id: string;
  organization_id: string;
  workspace_id: string | null;
  severity: AlertSeverity;
  category: string;
  title: string;
  body: string | null;
  status: AlertStatus;
  related_type: string | null;
  related_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
}

interface CreateAlertParams {
  organizationId: string;
  workspaceId?: string;
  severity: AlertSeverity;
  category: AlertCategory | string;
  title: string;
  body?: string;
  relatedType?: string;
  relatedId?: string;
  metadata?: Record<string, unknown>;
}

class AlertService {
  /**
   * Create an alert. Uses service client to bypass RLS
   * (alerts are often created from system/webhook contexts).
   */
  async create(params: CreateAlertParams): Promise<AlertRecord> {
    const service = createServiceClient();
    const { data, error } = await service
      .from("mc_alerts")
      .insert({
        organization_id: params.organizationId,
        workspace_id: params.workspaceId ?? null,
        severity: params.severity,
        category: params.category,
        title: params.title,
        body: params.body ?? null,
        status: "open",
        related_type: params.relatedType ?? null,
        related_id: params.relatedId ?? null,
        metadata: params.metadata ?? {},
      })
      .select()
      .single();

    if (error) {
      console.error("[AlertService] Failed to create alert:", error.message);
      throw new Error(`Failed to create alert: ${error.message}`);
    }

    return data as AlertRecord;
  }

  /** Acknowledge an alert. */
  async acknowledge(alertId: string): Promise<void> {
    const supabase = await createClient();
    await supabase
      .from("mc_alerts")
      .update({ status: "acknowledged" })
      .eq("id", alertId)
      .eq("status", "open");
  }

  /** Resolve an alert. */
  async resolve(alertId: string): Promise<void> {
    const supabase = await createClient();
    await supabase
      .from("mc_alerts")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", alertId);
  }

  /** Snooze an alert. */
  async snooze(alertId: string): Promise<void> {
    const supabase = await createClient();
    await supabase
      .from("mc_alerts")
      .update({ status: "snoozed" })
      .eq("id", alertId);
  }

  /** Count open alerts by severity. */
  async countOpen(orgId: string): Promise<Record<AlertSeverity, number>> {
    const supabase = await createClient();
    const counts: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };

    for (const severity of ["info", "warning", "error", "critical"] as AlertSeverity[]) {
      const { count } = await supabase
        .from("mc_alerts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("status", "open")
        .eq("severity", severity);
      counts[severity] = count ?? 0;
    }

    return counts;
  }

  /** Get a single alert by ID. */
  async getById(id: string): Promise<AlertRecord | null> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("mc_alerts")
      .select("*")
      .eq("id", id)
      .single();
    return (data ?? null) as AlertRecord | null;
  }

  /** List recent alerts. */
  async listRecent(orgId: string, limit = 20): Promise<AlertRecord[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("mc_alerts")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data ?? []) as AlertRecord[];
  }
}

export const alertService = new AlertService();
