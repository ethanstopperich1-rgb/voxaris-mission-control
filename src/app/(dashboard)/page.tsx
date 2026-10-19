import {
  UserPlus,
  UserX,
  Bot,
  Building2,
  AlertTriangle,
  ShieldCheck,
  Workflow,
  Zap,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/server/auth";
import { redirect } from "next/navigation";
import type { ActivityEntry } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getCommandCenterData() {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const orgId = session.organizationId;
  const today = new Date().toISOString().slice(0, 10);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    leadsToday,
    leadsUncontacted,
    activeAgents,
    activeClients,
    failedRuns,
    pendingApprovals,
    openAlerts,
    activeWorkspaces,
    recentLeads,
    recentFailedRuns,
    recentAlerts,
    activityRes,
  ] = await Promise.all([
    // New leads today
    supabase
      .from("mc_leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("created_at", `${today}T00:00:00Z`),

    // Uncontacted leads
    supabase
      .from("mc_leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "new"),

    // Active agents
    supabase
      .from("mc_agents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "active"),

    // Active clients
    supabase
      .from("mc_clients")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "active"),

    // Failed workflow runs (24h)
    supabase
      .from("mc_workflow_runs")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "failed")
      .gte("created_at", oneDayAgo),

    // Pending approvals
    supabase
      .from("mc_approvals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "pending"),

    // Open alerts (error + critical)
    supabase
      .from("mc_alerts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "open")
      .in("severity", ["error", "critical"]),

    // Active workspaces
    supabase
      .from("mc_workspaces")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),

    // Recent leads (10)
    supabase
      .from("mc_leads")
      .select("id, first_name, last_name, email, phone, source, status, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(8),

    // Recent failed workflow runs (5)
    supabase
      .from("mc_workflow_runs")
      .select("id, workflow_id, status, error, created_at")
      .eq("organization_id", orgId)
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(5),

    // Recent alerts (5)
    supabase
      .from("mc_alerts")
      .select("id, severity, category, title, status, created_at")
      .eq("organization_id", orgId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5),

    // Activity feed
    supabase
      .from("mc_activity")
      .select("id, action, details, entity_type, entity_id, source, user_id, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    kpis: {
      leadsToday: leadsToday.count ?? 0,
      leadsUncontacted: leadsUncontacted.count ?? 0,
      activeAgents: activeAgents.count ?? 0,
      activeClients: activeClients.count ?? 0,
      failedRuns: failedRuns.count ?? 0,
      pendingApprovals: pendingApprovals.count ?? 0,
      openAlerts: openAlerts.count ?? 0,
      activeWorkspaces: activeWorkspaces.count ?? 0,
    },
    lists: {
      recentLeads: (recentLeads.data ?? []) as Array<{
        id: string; first_name: string; last_name: string;
        email: string; phone: string; source: string; status: string; created_at: string;
      }>,
      recentFailedRuns: (recentFailedRuns.data ?? []) as Array<{
        id: string; workflow_id: string; status: string; error: string; created_at: string;
      }>,
      recentAlerts: (recentAlerts.data ?? []) as Array<{
        id: string; severity: string; category: string; title: string; status: string; created_at: string;
      }>,
      activities: (activityRes.data ?? []) as ActivityEntry[],
    },
  };
}

// ---------------------------------------------------------------------------
// Status badge helpers
// ---------------------------------------------------------------------------

const severityColors: Record<string, string> = {
  info: "text-blue-400 bg-blue-400/10",
  warning: "text-amber-400 bg-amber-400/10",
  error: "text-red-400 bg-red-400/10",
  critical: "text-red-500 bg-red-500/15 animate-pulse-glow-red",
};

const leadStatusColors: Record<string, string> = {
  new: "text-blue-400 bg-blue-400/10",
  contacted: "text-amber-400 bg-amber-400/10",
  qualified: "text-emerald-400 bg-emerald-400/10",
  nurturing: "text-violet-400 bg-violet-400/10",
  converted: "text-emerald-500 bg-emerald-500/10",
  lost: "text-red-400 bg-red-400/10",
  disqualified: "text-zinc-400 bg-zinc-400/10",
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CommandCenterPage() {
  const { kpis, lists } = await getCommandCenterData();

  const kpiCards = [
    { label: "New Leads Today", value: kpis.leadsToday, icon: UserPlus, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", href: "/leads?status=new" },
    { label: "Uncontacted", value: kpis.leadsUncontacted, icon: UserX, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", href: "/leads?status=new" },
    { label: "Active Agents", value: kpis.activeAgents, icon: Bot, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", href: "/agents" },
    { label: "Active Clients", value: kpis.activeClients, icon: Building2, color: "text-zinc-200", bg: "bg-zinc-200/10", border: "border-zinc-300/20", href: "/clients" },
    { label: "Failed Runs (24h)", value: kpis.failedRuns, icon: Workflow, color: kpis.failedRuns > 0 ? "text-red-400" : "text-zinc-400", bg: kpis.failedRuns > 0 ? "bg-red-500/10" : "bg-zinc-500/10", border: kpis.failedRuns > 0 ? "border-red-500/20" : "border-zinc-500/20", href: "/workflows" },
    { label: "Pending Approvals", value: kpis.pendingApprovals, icon: ShieldCheck, color: kpis.pendingApprovals > 0 ? "text-amber-400" : "text-zinc-400", bg: kpis.pendingApprovals > 0 ? "bg-amber-500/10" : "bg-zinc-500/10", border: kpis.pendingApprovals > 0 ? "border-amber-500/20" : "border-zinc-500/20", href: "/approvals" },
    { label: "Open Alerts", value: kpis.openAlerts, icon: AlertTriangle, color: kpis.openAlerts > 0 ? "text-red-400" : "text-emerald-400", bg: kpis.openAlerts > 0 ? "bg-red-500/10" : "bg-emerald-500/10", border: kpis.openAlerts > 0 ? "border-red-500/20" : "border-emerald-500/20", href: "/alerts" },
    { label: "Workspaces", value: kpis.activeWorkspaces, icon: Zap, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", href: "/clients" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-300/20 bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-zinc-950 p-5 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-200/5 via-transparent to-transparent" />
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            Command Center
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Voxaris Mission Control — Operational overview
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-8">
        {kpiCards.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={cn(
              "group flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20",
              kpi.border,
              kpi.bg,
            )}
          >
            <kpi.icon size={18} className={cn("mb-2", kpi.color)} />
            <span className="text-2xl font-bold text-zinc-100">{kpi.value}</span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              {kpi.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Main Grid: Leads + Alerts + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Latest Leads */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">Latest Leads</h2>
            <Link href="/leads" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              View all
            </Link>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 divide-y divide-zinc-800/50">
            {lists.recentLeads.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                No leads yet. Ingest leads via webhook or create manually.
              </div>
            ) : (
              lists.recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between px-4 py-3 row-hover">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {lead.email ?? lead.phone ?? "No contact info"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", leadStatusColors[lead.status] ?? "text-zinc-400 bg-zinc-400/10")}>
                      {lead.status}
                    </span>
                    <span className="text-[10px] text-zinc-600">{lead.source}</span>
                    <span className="text-[10px] text-zinc-600">{timeAgo(lead.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Alerts + Approvals + Activity */}
        <div className="space-y-6">
          {/* Alerts */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Open Alerts</h2>
              <Link href="/alerts" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                View all
              </Link>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 divide-y divide-zinc-800/50">
              {lists.recentAlerts.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500">No open alerts</div>
              ) : (
                lists.recentAlerts.map((alert) => (
                  <div key={alert.id} className="px-3 py-2.5 row-hover">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase", severityColors[alert.severity])}>
                        {alert.severity}
                      </span>
                      <span className="truncate text-xs text-zinc-300">{alert.title}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-zinc-600">
                      {alert.category} &middot; {timeAgo(alert.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Failed Runs */}
          {lists.recentFailedRuns.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-red-400">Failed Workflow Runs</h2>
              <div className="rounded-xl border border-red-900/30 bg-red-950/10 divide-y divide-red-900/20">
                {lists.recentFailedRuns.map((run) => (
                  <div key={run.id} className="px-3 py-2.5">
                    <p className="truncate text-xs text-red-300">
                      {run.error ?? "Unknown error"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-600">{timeAgo(run.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Recent Activity</h2>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-2">
              <ActivityFeed activities={lists.activities} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
