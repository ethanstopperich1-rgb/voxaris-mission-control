"use client";

import { useState, useMemo } from "react";
import { RefreshCcw, Search, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "@/components/agents/platform-badge";
import type { Agent } from "@/lib/types";

// ---------------------------------------------------------------------------
// Seed data (full agent registry from memory)
// ---------------------------------------------------------------------------

interface AgentRow extends Agent {
  client_name: string;
}

const allAgents: AgentRow[] = [
  {
    id: "ag1",
    client_id: "1",
    client_name: "Suncoast Sports",
    name: "Riley",
    platform: "vapi",
    platform_agent_id: "agent_b8dbc0ff6a0186474e73020500",
    agent_type: "inbound",
    phone_number: "(228) 220-7210",
    voice_id: null,
    voice_name: "Riley",
    llm_id: "llm_57409331afc4a06b92be7f455f0e",
    prompt_version: 3,
    status: "active",
    config: null,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "ag2",
    client_id: "1",
    client_name: "Suncoast Sports",
    name: "Riley (Outbound)",
    platform: "vapi",
    platform_agent_id: "agent_277b76faaff90b8488df9c5073",
    agent_type: "outbound",
    phone_number: "(228) 220-7210",
    voice_id: null,
    voice_name: "Riley",
    llm_id: "llm_025b8eb0bb46c55d458cf8111ea1",
    prompt_version: 2,
    status: "active",
    config: null,
    created_at: "2025-09-15T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "ag3",
    client_id: "2",
    client_name: "Orlando Art of Surgery",
    name: "Aria",
    platform: "vapi",
    platform_agent_id: "agent_aab4d2ceb18a893763451ffcaf",
    agent_type: "inbound",
    phone_number: "(321) 463-3984",
    voice_id: null,
    voice_name: "Aria",
    llm_id: null,
    prompt_version: 2,
    status: "active",
    config: null,
    created_at: "2025-10-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "ag4",
    client_id: "5",
    client_name: "Hill Nissan",
    name: "Kate",
    platform: "vapi",
    platform_agent_id: "agent_b3a4a253d0264ff8abe904e701",
    agent_type: "inbound",
    phone_number: "(407) 759-4100",
    voice_id: null,
    voice_name: "Kate",
    llm_id: null,
    prompt_version: 1,
    status: "active",
    config: null,
    created_at: "2026-01-10T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "ag5",
    client_id: "6",
    client_name: "Gulf Coast Mitsubishi",
    name: "Maria",
    platform: "vapi",
    platform_agent_id: "agent_6fea4b12bc72aa3581e2463779",
    agent_type: "inbound",
    phone_number: null,
    voice_id: null,
    voice_name: "Maria",
    llm_id: null,
    prompt_version: 1,
    status: "active",
    config: null,
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "ag6",
    client_id: "3",
    client_name: "Porsche Jackson",
    name: "Ashley",
    platform: "tavus",
    platform_agent_id: "pa1a586cf4ad",
    agent_type: "video",
    phone_number: null,
    voice_id: null,
    voice_name: null,
    llm_id: null,
    prompt_version: 1,
    status: "active",
    config: null,
    created_at: "2025-11-15T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "ag7",
    client_id: "2",
    client_name: "Orlando Art of Surgery",
    name: "Maria V",
    platform: "tavus",
    platform_agent_id: "p2c5fa762be7",
    agent_type: "video",
    phone_number: null,
    voice_id: null,
    voice_name: null,
    llm_id: null,
    prompt_version: 1,
    status: "active",
    config: null,
    created_at: "2025-10-15T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "ag8",
    client_id: "4",
    client_name: "Arrivia",
    name: "USAA V-SENSE Inbound",
    platform: "vapi",
    platform_agent_id: "agent_0bf4698527ae66e7ccaaad2b2e",
    agent_type: "inbound",
    phone_number: null,
    voice_id: null,
    voice_name: null,
    llm_id: "llm_c7d2d65f5c4ca63573d5754fd56f",
    prompt_version: 1,
    status: "active",
    config: null,
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "ag9",
    client_id: "4",
    client_name: "Arrivia",
    name: "USAA V-SENSE Outbound",
    platform: "vapi",
    platform_agent_id: "agent_a34129591f0e7e19abeadd264f",
    agent_type: "outbound",
    phone_number: null,
    voice_id: null,
    voice_name: null,
    llm_id: "llm_354ab6275424bb2174bf1dbd6d06",
    prompt_version: 1,
    status: "active",
    config: null,
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "ag10",
    client_id: "4",
    client_name: "Arrivia",
    name: "USAA V-FACE Concierge",
    platform: "tavus",
    platform_agent_id: "p29a8c3a3ca6",
    agent_type: "video",
    phone_number: null,
    voice_id: null,
    voice_name: null,
    llm_id: null,
    prompt_version: 1,
    status: "active",
    config: null,
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "ag11",
    client_id: "4",
    client_name: "Arrivia",
    name: "Mia (Inbound)",
    platform: "vapi",
    platform_agent_id: "d6997829-ff21-44b1-9853-27ea1e4d4030",
    agent_type: "inbound",
    phone_number: "(407) 289-0294",
    voice_id: null,
    voice_name: "Mia",
    llm_id: null,
    prompt_version: 3,
    status: "active",
    config: null,
    created_at: "2025-12-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "ag12",
    client_id: "4",
    client_name: "Arrivia",
    name: "Mia (Outbound)",
    platform: "vapi",
    platform_agent_id: "c36ebbfc-330f-419c-a954-ec965e3dd26d",
    agent_type: "outbound",
    phone_number: "(407) 289-0294",
    voice_id: null,
    voice_name: "Mia",
    llm_id: null,
    prompt_version: 2,
    status: "active",
    config: null,
    created_at: "2025-12-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgentsPage() {
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return allAgents.filter((agent) => {
      if (platformFilter !== "all" && agent.platform !== platformFilter) return false;
      if (statusFilter !== "all" && agent.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          agent.name.toLowerCase().includes(q) ||
          agent.client_name.toLowerCase().includes(q) ||
          agent.platform.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [platformFilter, statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Agent Hub</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage and monitor all AI agents across platforms.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          <RefreshCcw className="h-4 w-4" />
          Sync Agents
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
        >
          <option value="all">All Platforms</option>
          <option value="vapi">VAPI</option>
          <option value="tavus">Tavus</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="development">Development</option>
          <option value="retired">Retired</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
          />
        </div>

        <span className="text-xs text-zinc-500">{filtered.length} agents</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                {["Name", "Client", "Platform", "Type", "Phone", "Status", ""].map(
                  (header) => (
                    <th
                      key={header || "actions"}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-zinc-500"
                  >
                    No agents match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((agent) => (
                  <tr
                    key={agent.id}
                    className="transition-colors hover:bg-zinc-900/30"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-200">
                      {agent.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{agent.client_name}</td>
                    <td className="px-4 py-3">
                      <PlatformBadge platform={agent.platform} />
                    </td>
                    <td className="px-4 py-3 capitalize text-zinc-400">
                      {agent.agent_type}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {agent.phone_number ?? (
                        <span className="text-zinc-600">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          agent.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : agent.status === "development"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-zinc-500/15 text-zinc-400"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            agent.status === "active"
                              ? "bg-emerald-400"
                              : agent.status === "development"
                                ? "bg-amber-400"
                                : "bg-zinc-400"
                          )}
                        />
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                        aria-label={`Actions for ${agent.name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
