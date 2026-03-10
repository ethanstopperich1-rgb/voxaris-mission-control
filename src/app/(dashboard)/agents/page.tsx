import { createClient } from "@/lib/supabase/server";
import { AgentsTable } from "@/components/agents/agents-table";
import type { Agent } from "@/lib/types";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

interface AgentRow extends Agent {
  client_name: string;
}

async function getAgents(): Promise<AgentRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("mc_agents")
    .select("*, mc_clients(name)")
    .order("name", { ascending: true });

  const rows = (data ?? []) as Array<
    Agent & { mc_clients?: { name: string } | null }
  >;

  return rows.map((row) => ({
    ...row,
    client_name: row.mc_clients?.name ?? "Unknown",
  }));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div className="space-y-6">
      <AgentsTable agents={agents} />
    </div>
  );
}
