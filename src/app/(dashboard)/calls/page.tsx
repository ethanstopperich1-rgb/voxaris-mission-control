import { createClient } from "@/lib/supabase/server";
import { CallsTable } from "@/components/calls/calls-table";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getCalls() {
  const supabase = await createClient();

  const [callsRes, clientsRes] = await Promise.all([
    supabase
      .from("mc_calls")
      .select("id, platform, direction, status, outcome, duration_seconds, cost_usd, started_at, mc_agents(name), mc_clients(name, slug)")
      .order("started_at", { ascending: false })
      .limit(200),
    supabase
      .from("mc_clients")
      .select("slug, name")
      .order("name", { ascending: true }),
  ]);

  // Supabase returns joined relations - cast through unknown for type safety
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawCalls = (callsRes.data ?? []) as any[];

  const calls = rawCalls.map((c) => ({
    id: c.id as string,
    platform: c.platform as "vapi" | "tavus",
    direction: c.direction as "inbound" | "outbound",
    status: c.status as string,
    outcome: (c.outcome ?? null) as string | null,
    duration_seconds: (c.duration_seconds ?? 0) as number,
    cost_usd: (c.cost_usd ?? 0) as number,
    started_at: c.started_at as string,
    client_name: (c.mc_clients?.name ?? "Unknown") as string,
    client_slug: (c.mc_clients?.slug ?? "") as string,
    agent_name: (c.mc_agents?.name ?? "Unknown") as string,
  }));

  const clients = (clientsRes.data ?? []) as Array<{ slug: string; name: string }>;

  return { calls, clients };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CallsPage() {
  const { calls, clients } = await getCalls();

  return (
    <div className="space-y-6">
      <CallsTable calls={calls} clients={clients} />
    </div>
  );
}
