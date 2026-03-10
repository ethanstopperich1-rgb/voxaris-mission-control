"use client";

import {
  Phone,
  Bot,
  Building2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Zap,
  RefreshCcw,
  FileBarChart,
  UserPlus,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { cn, formatCurrency } from "@/lib/utils";
import type { Client, ActivityEntry } from "@/lib/types";

// ---------------------------------------------------------------------------
// Placeholder seed data
// ---------------------------------------------------------------------------

const kpis = [
  {
    label: "Total Calls (30d)",
    value: "1,247",
    icon: Phone,
    color: "text-gold",
    bg: "bg-gold/10",
    border: "border-gold/20",
    glow: true,
  },
  {
    label: "Active Agents",
    value: "12",
    icon: Bot,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    label: "Active Clients",
    value: "4",
    icon: Building2,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    label: "Monthly Revenue",
    value: "$18,500",
    icon: DollarSign,
    color: "text-gold",
    bg: "bg-gold/10",
    border: "border-gold/20",
    glow: true,
  },
  {
    label: "Platform Costs",
    value: "$3,420",
    icon: TrendingDown,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  {
    label: "Profit Margin",
    value: "81.5%",
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];

const clientSummaries: Client[] = [
  {
    id: "1",
    slug: "suncoast-sports",
    name: "Suncoast Sports",
    industry: "automotive",
    logo_url: null,
    primary_color: null,
    accent_color: null,
    website: "https://suncoastsports.com",
    status: "active",
    onboarding_step: 5,
    health_score: 92,
    contract_start: "2025-09-01",
    contract_end: "2026-08-31",
    monthly_retainer: 5000,
    notes: null,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    agent_count: 2,
    call_count_30d: 487,
  },
  {
    id: "2",
    slug: "orlando-art-of-surgery",
    name: "Orlando Art of Surgery",
    industry: "medical",
    logo_url: null,
    primary_color: null,
    accent_color: null,
    website: "https://orlandoartofsurgery.com",
    status: "active",
    onboarding_step: 5,
    health_score: 88,
    contract_start: "2025-10-01",
    contract_end: "2026-09-30",
    monthly_retainer: 4500,
    notes: null,
    created_at: "2025-10-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    agent_count: 2,
    call_count_30d: 312,
  },
  {
    id: "3",
    slug: "porsche-jackson",
    name: "Porsche Jackson",
    industry: "automotive",
    logo_url: null,
    primary_color: null,
    accent_color: null,
    website: "https://porschejackson.com",
    status: "active",
    onboarding_step: 5,
    health_score: 76,
    contract_start: "2025-11-15",
    contract_end: "2026-11-14",
    monthly_retainer: 5000,
    notes: null,
    created_at: "2025-11-15T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    agent_count: 1,
    call_count_30d: 198,
  },
  {
    id: "4",
    slug: "arrivia",
    name: "Arrivia",
    industry: "travel",
    logo_url: null,
    primary_color: null,
    accent_color: null,
    website: "https://arrivia.com",
    status: "active",
    onboarding_step: 5,
    health_score: 85,
    contract_start: "2025-12-01",
    contract_end: "2026-11-30",
    monthly_retainer: 4000,
    notes: null,
    created_at: "2025-12-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    agent_count: 5,
    call_count_30d: 250,
  },
];

const recentActivities: ActivityEntry[] = [
  {
    id: "a1",
    action: "Call completed",
    details: "Riley handled inbound call for Suncoast Sports (3m 42s)",
    entity_type: "call",
    entity_id: "c1",
    source: "vapi",
    user_id: null,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "a2",
    action: "Agent synced",
    details: "12 agents synced from VAPI API",
    entity_type: "agent",
    entity_id: null,
    source: "system",
    user_id: null,
    created_at: new Date(Date.now() - 22 * 60000).toISOString(),
  },
  {
    id: "a3",
    action: "New deal created",
    details: "Hill Nissan - AI Receptionist Demo ($4,500/mo)",
    entity_type: "deal",
    entity_id: "d1",
    source: "manual",
    user_id: null,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "a4",
    action: "Invoice paid",
    details: "Suncoast Sports - March 2026 retainer ($5,000)",
    entity_type: "invoice",
    entity_id: "i1",
    source: "stripe",
    user_id: null,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "a5",
    action: "Call completed",
    details: "Aria answered inbound for Orlando Art of Surgery (5m 18s)",
    entity_type: "call",
    entity_id: "c2",
    source: "vapi",
    user_id: null,
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: "a6",
    action: "Deployment updated",
    details: "suncoast-command deployed to Vercel (production)",
    entity_type: "deployment",
    entity_id: "dep1",
    source: "vercel",
    user_id: null,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "a7",
    action: "Client onboarded",
    details: "Gulf Coast Mitsubishi added to Mission Control",
    entity_type: "client",
    entity_id: "cl5",
    source: "manual",
    user_id: null,
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: "a8",
    action: "Agent created",
    details: "Maria (Gulf Coast Mitsubishi) deployed on VAPI",
    entity_type: "agent",
    entity_id: "ag5",
    source: "vapi",
    user_id: null,
    created_at: new Date(Date.now() - 10 * 3600000).toISOString(),
  },
  {
    id: "a9",
    action: "Call completed",
    details: "Mia handled upgrade call for Arrivia member (4m 55s)",
    entity_type: "call",
    entity_id: "c3",
    source: "vapi",
    user_id: null,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: "a10",
    action: "Content published",
    details: "LinkedIn post: AI Voice Agents in Automotive",
    entity_type: "content",
    entity_id: "ct1",
    source: "linkedin",
    user_id: null,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

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
// Page
// ---------------------------------------------------------------------------

export default function DashboardHomePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-zinc-950 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
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
        {kpis.map((kpi, i) => (
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
            <ActivityFeed activities={recentActivities} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Trigger Call", icon: Phone, color: "text-blue-400 hover:bg-blue-500/10" },
            { label: "Sync Agents", icon: RefreshCcw, color: "text-emerald-400 hover:bg-emerald-500/10" },
            { label: "Generate Report", icon: FileBarChart, color: "text-gold hover:bg-gold/10" },
            { label: "New Client", icon: UserPlus, color: "text-violet-400 hover:bg-violet-500/10" },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              className={cn(
                "flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3",
                "text-sm font-medium text-zinc-300 transition-all duration-200",
                "hover:border-zinc-700 hover:text-zinc-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                action.color
              )}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
