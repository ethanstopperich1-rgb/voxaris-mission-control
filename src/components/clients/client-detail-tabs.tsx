"use client";

import { useState } from "react";
import {
  Bot,
  Phone,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "@/components/agents/platform-badge";
import type { Agent, UnifiedCall } from "@/lib/types";

// ---------------------------------------------------------------------------
// Tab constants
// ---------------------------------------------------------------------------

const tabs = ["overview", "agents", "calls", "notes"] as const;
type Tab = (typeof tabs)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ClientDetailTabsProps {
  agents: Agent[];
  calls: UnifiedCall[];
  notes: string | null;
  overviewContent: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClientDetailTabs({
  agents,
  calls,
  notes: initialNotes,
  overviewContent,
}: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [notes, setNotes] = useState(initialNotes ?? "");

  return (
    <>
      {/* Tabs */}
      <div className="border-b border-zinc-800 overflow-x-auto">
        <nav className="-mb-px flex gap-4 sm:gap-6" aria-label="Client tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "border-b-2 pb-3 pt-1 text-sm font-medium capitalize transition-all duration-200",
                activeTab === tab
                  ? "border-zinc-300 text-zinc-200"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {/* ---- Overview ---- */}
        {activeTab === "overview" && overviewContent}

        {/* ---- Agents ---- */}
        {activeTab === "agents" && (
          <div className="space-y-3">
            {agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60 py-16 text-zinc-500">
                <Bot className="mb-3 h-8 w-8" />
                <p className="text-sm">No agents deployed for this client yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-zinc-950/80">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Agent
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Platform
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Type
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {agents.map((agent) => (
                      <tr key={agent.id} className="transition-colors duration-150 hover:bg-zinc-900/40">
                        <td className="px-4 py-3 font-medium text-zinc-200 whitespace-nowrap">{agent.name}</td>
                        <td className="px-4 py-3">
                          <PlatformBadge platform={agent.platform} />
                        </td>
                        <td className="px-4 py-3 capitalize text-zinc-300">{agent.agent_type}</td>
                        <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                          {agent.phone_number ?? <span className="text-zinc-600">--</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              agent.status === "active"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-zinc-500/15 text-zinc-400"
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                agent.status === "active" ? "bg-emerald-400" : "bg-zinc-400"
                              )}
                            />
                            {agent.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---- Calls ---- */}
        {activeTab === "calls" && (
          <div>
            {calls.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60 py-16 text-zinc-500">
                <Phone className="mb-3 h-8 w-8" />
                <p className="text-sm font-medium">No call data loaded</p>
                <p className="mt-1 text-xs text-zinc-600">
                  Call records will populate once the API sync is configured.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-zinc-950/80">
                    <tr>
                      {["Date", "Agent", "Direction", "Duration", "Status", "Outcome"].map(
                        (header) => (
                          <th
                            key={header}
                            className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500"
                          >
                            {header}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {calls.map((call) => (
                      <tr key={call.id} className="transition-colors duration-150 hover:bg-zinc-900/40">
                        <td className="px-4 py-3 text-zinc-300 text-xs whitespace-nowrap">
                          {new Date(call.started_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 text-zinc-200 whitespace-nowrap">{call.agent?.name ?? "--"}</td>
                        <td className="px-4 py-3 capitalize text-zinc-300">{call.direction}</td>
                        <td className="px-4 py-3 text-zinc-300">
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
                                  : "bg-zinc-500/15 text-zinc-400"
                            )}
                          >
                            {call.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-300 text-xs">
                          {call.outcome ?? "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---- Notes ---- */}
        {activeTab === "notes" && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-300">Client Notes</h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this client..."
              className={cn(
                "h-48 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3",
                "text-sm text-zinc-200 placeholder:text-zinc-600",
                "transition-colors focus:border-zinc-300/40 focus:outline-none focus:ring-1 focus:ring-zinc-300/20"
              )}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="rounded-lg bg-zinc-200/10 px-4 py-2 text-sm font-medium text-zinc-200 transition-all duration-150 hover:bg-zinc-200/20 hover:shadow-md hover:shadow-zinc-200/5 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                Save Notes
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
