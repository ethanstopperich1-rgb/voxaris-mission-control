"use client";

import { useState } from "react";
import { Phone, Search, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CallsPage() {
  const [platformFilter, setPlatformFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Placeholder -- no calls yet
  const calls: unknown[] = [];

  return (
    <div className="space-y-6">
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
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
        >
          <option value="all">All Platforms</option>
          <option value="vapi">VAPI</option>
          <option value="tavus">Tavus</option>
        </select>

        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
        >
          <option value="all">All Clients</option>
          <option value="suncoast-sports">Suncoast Sports</option>
          <option value="orlando-art-of-surgery">Orlando Art of Surgery</option>
          <option value="porsche-jackson">Porsche Jackson</option>
          <option value="arrivia">Arrivia</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="no_answer">No Answer</option>
          <option value="voicemail">Voicemail</option>
        </select>

        <input
          type="date"
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
        />

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search calls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20"
          />
        </div>
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
            <tbody>
              {calls.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
                        <Headphones className="h-6 w-6 text-zinc-600" />
                      </div>
                      <p className="text-sm font-medium text-zinc-400">No calls yet</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Agent calls will appear here automatically once synced.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
