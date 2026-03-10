"use client";

import { useState, useMemo } from "react";
import { RefreshCcw, Search, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "@/components/agents/platform-badge";
import type { Agent } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentRow extends Agent {
  client_name: string;
}

interface AgentsTableProps {
  agents: AgentRow[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentsTable({ agents: allAgents }: AgentsTableProps) {
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
  }, [allAgents, platformFilter, statusFilter, search]);

  return (
    <>
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
          className="group/sync inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-all duration-150 hover:bg-zinc-800 hover:border-zinc-600 hover:shadow-md hover:shadow-black/20 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/50"
        >
          <RefreshCcw className="h-4 w-4 transition-transform duration-300 group-hover/sync:rotate-90" />
          Sync Agents
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition-all duration-150 hover:border-zinc-700 focus:border-zinc-300/40 focus:outline-none focus:ring-2 focus:ring-zinc-300/20"
        >
          <option value="all">All Platforms</option>
          <option value="vapi">VAPI</option>
          <option value="tavus">Tavus</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition-all duration-150 hover:border-zinc-700 focus:border-zinc-300/40 focus:outline-none focus:ring-2 focus:ring-zinc-300/20"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="development">Development</option>
          <option value="retired">Retired</option>
        </select>

        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-300 placeholder:text-zinc-600 transition-all duration-150 hover:border-zinc-700 focus:border-zinc-300/40 focus:outline-none focus:ring-2 focus:ring-zinc-300/20"
          />
        </div>

        <span className="text-xs text-zinc-500">{filtered.length} agents</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-950/80">
            <tr>
              {["Name", "Client", "Platform", "Type", "Phone", "Status", ""].map(
                (header) => (
                  <th
                    key={header || "actions"}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500"
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
                  className="transition-colors duration-150 hover:bg-zinc-900/40"
                >
                  <td className="px-4 py-3 font-medium text-zinc-200 whitespace-nowrap">
                    {agent.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">{agent.client_name}</td>
                  <td className="px-4 py-3">
                    <PlatformBadge platform={agent.platform} />
                  </td>
                  <td className="px-4 py-3 capitalize text-zinc-300">
                    {agent.agent_type}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
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
                      className="rounded-md p-1 text-zinc-500 transition-all duration-150 hover:bg-zinc-800 hover:text-zinc-300 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
    </>
  );
}
