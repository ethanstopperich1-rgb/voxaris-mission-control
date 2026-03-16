"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface ApprovalRecord {
  id: string;
  related_type: string;
  related_id: string;
  approval_type: string;
  status: "pending" | "approved" | "rejected" | "expired" | "auto_approved";
  requested_by_type: string;
  requested_by_id: string | null;
  reason: string | null;
  expires_at: string | null;
  decided_at: string | null;
  created_at: string;
}

const statusIcons: Record<string, typeof CheckCircle2> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  expired: AlertTriangle,
  auto_approved: CheckCircle2,
};

const statusColors: Record<string, string> = {
  pending: "text-amber-400 bg-amber-400/10",
  approved: "text-emerald-400 bg-emerald-400/10",
  rejected: "text-red-400 bg-red-400/10",
  expired: "text-zinc-500 bg-zinc-500/10",
  auto_approved: "text-emerald-300 bg-emerald-300/10",
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

export default function ApprovalsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? undefined;

  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ limit: "50" });
    if (statusFilter) qs.set("status", statusFilter);
    try {
      const res = await fetch(`/api/approvals?${qs.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setApprovals(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const decide = async (id: string, action: "approve" | "reject") => {
    if (acting) return;
    setActing(id);
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setApprovals((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, status: action === "approve" ? "approved" : "rejected" }
              : a,
          ),
        );
      }
    } finally {
      setActing(null);
    }
  };

  const pendingCount = approvals.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Approvals</h1>
          <p className="text-sm text-zinc-500">
            {pendingCount > 0 && (
              <span className="text-amber-400">{pendingCount} pending · </span>
            )}
            {approvals.length} total
          </p>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "approved", "rejected", "expired"].map((s) => {
          const isActive = s === "all" ? !statusFilter : statusFilter === s;
          const href = s === "all" ? "/approvals" : `/approvals?status=${s}`;
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
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          );
        })}
      </div>

      {/* Approvals List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 divide-y divide-zinc-800/50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={18} className="animate-spin text-zinc-500" />
          </div>
        ) : approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck size={32} className="mb-3 text-zinc-600" />
            <p className="text-sm text-zinc-400">No approvals found</p>
            <p className="mt-1 text-xs text-zinc-600">
              Approval requests from workflows and agent actions appear here
            </p>
          </div>
        ) : (
          approvals.map((approval) => {
            const status = approval.status;
            const isPending = status === "pending";
            const isActing = acting === approval.id;
            const Icon = statusIcons[status] ?? Clock;
            return (
              <div
                key={approval.id}
                className={cn(
                  "flex items-center justify-between px-4 py-4 gap-4",
                  isPending && "bg-amber-950/10",
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                      statusColors[status]?.split(" ")[1] ?? "bg-zinc-800",
                    )}
                  >
                    <Icon
                      size={16}
                      className={statusColors[status]?.split(" ")[0] ?? "text-zinc-400"}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-200">
                        {approval.approval_type}
                      </span>
                      <span className="text-xs text-zinc-500">
                        on {approval.related_type}
                        {approval.related_id
                          ? ` (${approval.related_id.slice(0, 8)}…)`
                          : ""}
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
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-zinc-500">
                        by {approval.requested_by_type}
                        {approval.requested_by_id
                          ? ` (${approval.requested_by_id.slice(0, 8)}…)`
                          : ""}
                      </span>
                      {approval.reason && (
                        <span className="text-[10px] text-zinc-600 truncate max-w-xs">
                          — {approval.reason}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-600">
                        {timeAgo(approval.created_at)}
                      </span>
                      {approval.expires_at && isPending && (
                        <span className="text-[10px] text-amber-600">
                          expires {timeAgo(approval.expires_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons — pending only */}
                {isPending ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => decide(approval.id, "reject")}
                      disabled={!!acting}
                      className="flex items-center justify-center rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950/60 hover:border-red-700 disabled:opacity-40 transition-colors min-w-[56px]"
                    >
                      {isActing ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        "Reject"
                      )}
                    </button>
                    <button
                      onClick={() => decide(approval.id, "approve")}
                      disabled={!!acting}
                      className="flex items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-950/60 hover:border-emerald-700 disabled:opacity-40 transition-colors min-w-[64px]"
                    >
                      {isActing ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        "Approve"
                      )}
                    </button>
                  </div>
                ) : (
                  approval.decided_at && (
                    <span className="shrink-0 text-[10px] text-zinc-500">
                      decided {timeAgo(approval.decided_at)}
                    </span>
                  )
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
