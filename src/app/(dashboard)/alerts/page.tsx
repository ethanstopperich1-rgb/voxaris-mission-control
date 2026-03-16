"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Flame,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface AlertRecord {
  id: string;
  severity: "info" | "warning" | "error" | "critical";
  category: string;
  title: string;
  body: string | null;
  status: "open" | "acknowledged" | "resolved" | "snoozed";
  related_type: string | null;
  related_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

const severityIcons: Record<string, typeof AlertCircle> = {
  critical: Flame,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const severityColors: Record<string, string> = {
  critical: "text-red-500 bg-red-500/10",
  error: "text-red-400 bg-red-400/10",
  warning: "text-amber-400 bg-amber-400/10",
  info: "text-blue-400 bg-blue-400/10",
};

const statusColors: Record<string, string> = {
  open: "text-red-400 bg-red-400/10",
  acknowledged: "text-amber-400 bg-amber-400/10",
  resolved: "text-emerald-400 bg-emerald-400/10",
  snoozed: "text-zinc-400 bg-zinc-400/10",
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? undefined;
  const severityFilter = searchParams.get("severity") ?? undefined;

  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts?limit=100");
      if (res.ok) {
        const json = await res.json();
        setAlerts(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const act = async (id: string, action: "acknowledge" | "resolve" | "snooze") => {
    if (acting) return;
    setActing(id);
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
    } finally {
      setActing(null);
    }
  };

  // Apply client-side filters
  const filtered = alerts.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (severityFilter && a.severity !== severityFilter) return false;
    return true;
  });

  const openCount = alerts.filter((a) => a.status === "open").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Alerts</h1>
          <p className="text-sm text-zinc-500">
            {openCount > 0 && (
              <span className="text-red-400">{openCount} open · </span>
            )}
            {alerts.length} total
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
          {["all", "open", "acknowledged", "resolved", "snoozed"].map((s) => {
            const isActive = s === "all" ? !statusFilter : statusFilter === s;
            const base = severityFilter ? `severity=${severityFilter}&` : "";
            const href =
              s === "all"
                ? `/alerts${severityFilter ? `?severity=${severityFilter}` : ""}`
                : `/alerts?${base}status=${s}`;
            return (
              <Link
                key={s}
                href={href}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-zinc-200 text-zinc-900"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300",
                )}
              >
                {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {["critical", "error", "warning", "info"].map((sev) => {
            const isActive = severityFilter === sev;
            const base = statusFilter ? `status=${statusFilter}&` : "";
            const href = isActive
              ? `/alerts${statusFilter ? `?status=${statusFilter}` : ""}`
              : `/alerts?${base}severity=${sev}`;
            return (
              <Link
                key={sev}
                href={href}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? severityColors[sev]
                    : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400",
                )}
              >
                {sev.charAt(0).toUpperCase() + sev.slice(1)}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Alerts List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 divide-y divide-zinc-800/50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={18} className="animate-spin text-zinc-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 size={32} className="mb-3 text-emerald-600" />
            <p className="text-sm text-zinc-400">No alerts match your filters</p>
            <p className="mt-1 text-xs text-zinc-600">
              System alerts for failures, sync issues, and critical events appear here
            </p>
          </div>
        ) : (
          filtered.map((alert) => {
            const severity = alert.severity;
            const status = alert.status;
            const isOpen = status === "open";
            const isAcknowledged = status === "acknowledged";
            const isActing = acting === alert.id;
            const Icon = severityIcons[severity] ?? Info;
            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-4",
                  severity === "critical" && isOpen && "bg-red-950/20",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                    severityColors[severity]?.split(" ")[1] ?? "bg-zinc-800",
                  )}
                >
                  <Icon
                    size={16}
                    className={severityColors[severity]?.split(" ")[0] ?? "text-zinc-400"}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-medium text-zinc-200">{alert.title}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        severityColors[severity],
                      )}
                    >
                      {severity}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusColors[status],
                      )}
                    >
                      {status}
                    </span>
                  </div>
                  {alert.body && (
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-1">{alert.body}</p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-zinc-600 flex-wrap">
                    <span>{alert.category}</span>
                    {alert.related_type && (
                      <span>
                        {alert.related_type}
                        {alert.related_id ? `: ${alert.related_id.slice(0, 8)}…` : ""}
                      </span>
                    )}
                    <span>{timeAgo(alert.created_at)}</span>
                    {alert.resolved_at && (
                      <span className="text-emerald-500">
                        resolved {timeAgo(alert.resolved_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                {(isOpen || isAcknowledged) && (
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    {isOpen && (
                      <button
                        onClick={() => act(alert.id, "acknowledge")}
                        disabled={!!acting}
                        className="rounded-lg border border-amber-800/50 bg-amber-950/20 px-2.5 py-1 text-[10px] font-medium text-amber-400 hover:bg-amber-950/40 disabled:opacity-40 transition-colors"
                      >
                        {isActing ? <Loader2 size={10} className="animate-spin" /> : "Ack"}
                      </button>
                    )}
                    <button
                      onClick={() => act(alert.id, "resolve")}
                      disabled={!!acting}
                      className="rounded-lg border border-emerald-800/50 bg-emerald-950/20 px-2.5 py-1 text-[10px] font-medium text-emerald-400 hover:bg-emerald-950/40 disabled:opacity-40 transition-colors"
                    >
                      {isActing ? <Loader2 size={10} className="animate-spin" /> : "Resolve"}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
