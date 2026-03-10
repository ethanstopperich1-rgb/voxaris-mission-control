import { UserPlus } from "lucide-react";
import { ClientCard } from "@/components/clients/client-card";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getClients(): Promise<Client[]> {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [clientsRes, agentsRes, callsRes] = await Promise.all([
    supabase
      .from("mc_clients")
      .select("*")
      .order("name", { ascending: true }),
    supabase.from("mc_agents").select("id, client_id"),
    supabase
      .from("mc_calls")
      .select("id, client_id")
      .gte("created_at", thirtyDaysAgo),
  ]);

  const clients = (clientsRes.data ?? []) as Client[];
  const agents = (agentsRes.data ?? []) as Array<{ id: string; client_id: string }>;
  const calls = (callsRes.data ?? []) as Array<{ id: string; client_id: string }>;

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

  return clients.map((c) => ({
    ...c,
    agent_count: agentCountByClient[c.id] ?? 0,
    call_count_30d: callCountByClient[c.id] ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Clients</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your client portfolio and monitor account health.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-zinc-200/20 transition-all duration-150 hover:bg-zinc-100 hover:shadow-xl hover:shadow-zinc-200/25 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/50"
        >
          <UserPlus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Client Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>
    </div>
  );
}
