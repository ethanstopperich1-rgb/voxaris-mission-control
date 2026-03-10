import {
  ArrowLeft,
  Globe,
  Calendar,
  DollarSign,
  Bot,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { ClientDetailTabs } from "@/components/clients/client-detail-tabs";
import type { Client, Agent, UnifiedCall } from "@/lib/types";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getClientBySlug(slug: string) {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  // 1. Fetch client by slug
  const { data: clientRow } = await supabase
    .from("mc_clients")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!clientRow) return null;

  const client = clientRow as Client;

  // 2. Fetch agents and recent calls in parallel
  const [agentsRes, callsRes, callCountRes] = await Promise.all([
    supabase
      .from("mc_agents")
      .select("*")
      .eq("client_id", client.id)
      .order("name", { ascending: true }),
    supabase
      .from("mc_calls")
      .select("*, mc_agents(name)")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("mc_calls")
      .select("id", { count: "exact", head: true })
      .eq("client_id", client.id)
      .gte("created_at", thirtyDaysAgo),
  ]);

  const agents = (agentsRes.data ?? []) as Agent[];

  // Map calls and attach agent name from the join
  const rawCalls = (callsRes.data ?? []) as Array<
    UnifiedCall & { mc_agents?: { name: string } | null }
  >;
  const calls: UnifiedCall[] = rawCalls.map((c) => ({
    ...c,
    agent: c.mc_agents ? ({ name: c.mc_agents.name } as Agent) : undefined,
  }));

  const callCount30d = callCountRes.count ?? 0;

  return {
    client: {
      ...client,
      agent_count: agents.length,
      call_count_30d: callCount30d,
    },
    agents,
    calls,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getClientBySlug(slug);

  if (!data) {
    notFound();
  }

  const { client, agents, calls } = data;

  const healthColor =
    client.health_score > 70
      ? "bg-emerald-500"
      : client.health_score > 40
        ? "bg-amber-500"
        : "bg-red-500";

  const statusStyle: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400",
    onboarding: "bg-amber-500/15 text-amber-400",
    paused: "bg-zinc-500/15 text-zinc-400",
    churned: "bg-red-500/15 text-red-400",
  };

  // Overview content rendered on the server
  const overviewContent = (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Info card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-4 sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Client Information
        </h3>
        <div className="space-y-3">
          {[
            { icon: Globe, label: "Website", value: client.website ?? "N/A" },
            {
              icon: Calendar,
              label: "Contract Start",
              value: client.contract_start
                ? new Date(client.contract_start).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "N/A",
            },
            {
              icon: Calendar,
              label: "Contract End",
              value: client.contract_end
                ? new Date(client.contract_end).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "N/A",
            },
            {
              icon: DollarSign,
              label: "Monthly Retainer",
              value: formatCurrency(client.monthly_retainer),
            },
            { icon: Bot, label: "Agents", value: String(client.agent_count ?? agents.length) },
            { icon: Phone, label: "Calls (30d)", value: String(client.call_count_30d ?? 0) },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 sm:gap-3">
              <item.icon className="h-4 w-4 shrink-0 text-zinc-500" />
              <span className="w-28 shrink-0 text-xs text-zinc-500 sm:w-32">{item.label}</span>
              <span className="truncate text-sm text-zinc-200">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Health card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-4 sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Health Score
        </h3>
        <div className="flex items-end gap-4">
          <span className="text-5xl font-bold text-zinc-50">{client.health_score}</span>
          <span className="mb-1 text-lg text-zinc-500">/ 100</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={cn("h-full rounded-full transition-all duration-700", healthColor)}
            style={{ width: `${client.health_score}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500">
          Based on call volume, success rate, and agent performance over 30 days.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Back nav + header */}
      <div>
        <Link
          href="/clients"
          className="group/back mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-all duration-150 hover:text-zinc-200 hover:gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
              {client.name}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                  statusStyle[client.status]
                )}
              >
                {client.status}
              </span>
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-400">
                {client.industry}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ClientDetailTabs
        agents={agents}
        calls={calls}
        notes={client.notes}
        overviewContent={overviewContent}
      />
    </div>
  );
}
