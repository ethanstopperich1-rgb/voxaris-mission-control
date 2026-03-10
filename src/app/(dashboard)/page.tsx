import {
  Phone,
  Bot,
  Building2,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { cn, formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { Client, ActivityEntry } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const industryBadge: Record<string, string> = {
  automotive: "bg-blue-500/10 text-blue-400",
  medical: "bg-rose-500/10 text-rose-400",
  travel: "bg-amber-500/10 text-amber-400",
};

const statusBadge: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  onboarding: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  paused: { bg: "bg-zinc-500/15", text: "text-zinc-400", dot: "bg-zinc-400" },
  churned: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getDashboardData() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  // Fire all queries in parallel
  const [
    clientsRes,
    agentsRes,
    callsRes,
    costsRes,
    activityRes,
  ] = await Promise.all([
    // 1. All clients
    supabase
      .from("mc_clients")
      .select("id, slug, name, industry, status, health_score, monthly_retainer"),

    // 2. Active agents with client_id for per-client counts
    supabase
      .from("mc_agents")
      .select("id, client_id, status"),

    // 3. Calls in last 30 days with client_id
    supabase
      .from("mc_calls")
      .select("id, client_id")
      .gte("created_at", thirtyDaysAgo),

    // 4. Platform costs for current month
    supabase
      .from("mc_costs")
      .select("amount")
      .eq("period_month", currentMonth),

    // 5. Recent activity (last 10)
    supabase
      .from("mc_activity")
      .select("id, action, details, entity_type, entity_id, source, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Extract data with fallbacks
  const clients = (clientsRes.data ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    industry: string;
    status: string;
    health_score: number;
    monthly_retainer: number;
  }>;

  const agents = (agentsRes.data ?? []) as Array<{
    id: string;
    client_id: string;
    status: string;
  }>;

  const calls = (callsRes.data ?? []) as Array<{
    id: string;
    client_id: string;
  }>;

  const costs = (costsRes.data ?? []) as Array<{
    amount: number;
  }>;

  const activities = (activityRes.data ?? []) as ActivityEntry[];

  // Compute per-client agent counts
  const agentCountByClient: Record<string, number> = {};
  for (const agent of agents) {
    agentCountByClient[agent.client_id] =
      (agentCountByClient[agent.client_id] ?? 0) + 1;
  }

  // Compute per-client call counts (30d)
  const callCountByClient: Record<string, number> = {};
  for (const call of calls) {
    callCountByClient[call.client_id] =
      (callCountByClient[call.client_id] ?? 0) + 1;
  }

  // Build enriched client summaries
  const clientSummaries: Client[] = clients.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    industry: c.industry,
    logo_url: null,
    primary_color: null,
    accent_color: null,
    website: null,
    status: c.status as Client["status"],
    onboarding_step: 5,
    health_score: c.health_score,
    contract_start: null,
    contract_end: null,
    monthly_retainer: c.monthly_retainer,
    notes: null,
    created_at: "",
    updated_at: "",
    agent_count: agentCountByClient[c.id] ?? 0,
    call_count_30d: callCountByClient[c.id] ?? 0,
  }));

  // KPI calculations
  const totalCalls30d = calls.length;
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const activeClients = clients.filter((c) => c.status === "active").length;
  const monthlyRevenue = clients
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + c.monthly_retainer, 0);
  const platformCosts = costs.reduce((sum, c) => sum + c.amount, 0);
  const profitMargin =
    monthlyRevenue > 0
      ? ((monthlyRevenue - platformCosts) / monthlyRevenue) * 100
      : 0;

  return {
    clientSummaries,
    activities,
    kpis: {
      totalCalls30d,
      activeAgents,
      activeClients,
      monthlyRevenue,
      platformCosts,
      profitMargin,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardHomePage() {
  const { clientSummaries, activities, kpis } = await getDashboardData();

  const kpiCards = [
    {
      label: "Total Calls (30d)",
      value: kpis.totalCalls30d.toLocaleString(),
      icon: Phone,
      color: "text-zinc-200",
      bg: "bg-zinc-200/10",
      border: "border-zinc-300/20",
      glow: true,
    },
    {
      label: "Active Agents",
      value: String(kpis.activeAgents),
      icon: Bot,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Active Clients",
      value: String(kpis.activeClients),
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(kpis.monthlyRevenue),
      icon: DollarSign,
      color: "text-zinc-200",
      bg: "bg-zinc-200/10",
      border: "border-zinc-300/20",
      glow: true,
    },
    {
      label: "Platform Costs",
      value: formatCurrency(kpis.platformCosts),
      icon: TrendingDown,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      label: "Profit Margin",
      value: `${kpis.profitMargin.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-300/20 bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-zinc-950 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-200/5 via-transparent to-transparent" />
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
            Mission Control
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Complete operational overview of Voxaris AI
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {kpiCards.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} delay={i * 80} />
        ))}
      </div>

      {/* Client Summary + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Summary */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">Client Summary</h2>
            <span className="text-xs text-zinc-500">{clientSummaries.length} clients</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {clientSummaries.map((client) => {
              const sBadge = statusBadge[client.status] ?? statusBadge.active;
              const iBadge = industryBadge[client.industry] ?? "bg-zinc-500/10 text-zinc-400";
              const healthColor =
                client.health_score > 70
                  ? "bg-emerald-500"
                  : client.health_score > 40
                    ? "bg-amber-500"
                    : "bg-red-500";

              return (
                <div
                  key={client.id}
                  className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="truncate text-sm font-semibold text-zinc-100">
                      {client.name}
                    </h3>
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        sBadge.bg,
                        sBadge.text
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", sBadge.dot)} />
                      {client.status}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "mb-3 w-fit rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                      iBadge
                    )}
                  >
                    {client.industry}
                  </span>
                  <div className="mb-3 flex items-center gap-3 text-xs text-zinc-400">
                    <span>{client.agent_count} agents</span>
                    <span className="text-zinc-700">&middot;</span>
                    <span>{client.call_count_30d} calls</span>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Health
                      </span>
                      <span className="text-xs font-semibold text-zinc-300">
                        {client.health_score}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={cn("h-full rounded-full transition-all", healthColor)}
                        style={{ width: `${client.health_score}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">Recent Activity</h2>
            <span className="text-xs text-zinc-500">last 24h</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-2">
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
