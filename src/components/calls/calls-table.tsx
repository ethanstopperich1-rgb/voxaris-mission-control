"use client";

import { useState, useMemo } from "react";
import { Search, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "@/components/agents/platform-badge";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CallRow {
  id: string;
  platform: "vapi" | "tavus";
  direction: "inbound" | "outbound";
  status: string;
  outcome: string | null;
  duration_seconds: number;
  cost_usd: number;
  started_at: string;
  client_name: string;
  client_slug: string;
  agent_name: string;
}

interface ClientOption {
  slug: string;
  name: string;
}

interface CallsTableProps {
  calls: CallRow[];
  clients: ClientOption[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CallsTable({ calls, clients }: CallsTableProps) {
  const [platformFilter, setPlatformFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return calls.filter((call) => {
      if (platformFilter !== "all" && call.platform !== platformFilter) return false;
      if (clientFilter !== "all" && call.client_slug !== clientFilter) return false;
      if (statusFilter !== "all" && call.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          call.client_name.toLowerCase().includes(q) ||
          call.agent_name.toLowerCase().includes(q) ||
          (call.outcome ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [calls, platformFilter, clientFilter, statusFilter, search]);

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Call Center</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Unified call log across all platforms and agents.
        </p>
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
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition-all duration-150 hover:border-zinc-700 focus:border-zinc-300/40 focus:outline-none focus:ring-2 focus:ring-zinc-300/20"
        >
          <option value="all">All Clients</option>
          {clients.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition-all duration-150 hover:border-zinc-700 focus:border-zinc-300/40 focus:outline-none focus:ring-2 focus:ring-zinc-300/20"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="no_answer">No Answer</option>
          <option value="voicemail">Voicemail</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search calls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-300 placeholder:text-zinc-600 transition-all duration-150 hover:border-zinc-700 focus:border-zinc-300/40 focus:outline-none focus:ring-2 focus:ring-zinc-300/20"
          />
        </div>

        <span className="text-xs text-zinc-500">{filtered.length} calls</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                {[
                  "Date",
                  "Client",
                  "Agent",
                  "Platform",
                  "Direction",
                  "Duration",
                  "Status",
                  "Outcome",
                  "Cost",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
                        <Headphones className="h-6 w-6 text-zinc-600" />
                      </div>
                      <p className="text-sm font-medium text-zinc-400">No calls found</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {calls.length === 0
                          ? "Agent calls will appear here automatically once synced."
                          : "Try adjusting your filters."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((call) => (
                  <tr key={call.id} className="transition-colors duration-150 hover:bg-zinc-900/40">
                    <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                      {new Date(call.started_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-zinc-200">{call.client_name}</td>
                    <td className="px-4 py-3 text-zinc-200">{call.agent_name}</td>
                    <td className="px-4 py-3">
                      <PlatformBadge platform={call.platform} />
                    </td>
                    <td className="px-4 py-3 capitalize text-zinc-400">{call.direction}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {call.duration_seconds > 0
                        ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, "0")}`
                        : "--"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          call.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : call.status === "failed"
                              ? "bg-red-500/15 text-red-400"
                              : call.status === "no_answer"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-zinc-500/15 text-zinc-400"
                        )}
                      >
                        {call.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {call.outcome ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {call.cost_usd > 0 ? formatCurrency(call.cost_usd) : "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
