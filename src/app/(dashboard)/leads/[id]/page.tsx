"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Tag,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";

const PIPELINE_STAGES: { status: LeadStatus; label: string; color: string }[] = [
  { status: "new", label: "New", color: "bg-blue-400" },
  { status: "contacted", label: "Contacted", color: "bg-amber-400" },
  { status: "qualified", label: "Qualified", color: "bg-violet-400" },
  { status: "nurturing", label: "Nurturing", color: "bg-orange-400" },
  { status: "converted", label: "Converted", color: "bg-emerald-500" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  contacted: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  qualified: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  nurturing: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  converted: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  lost: "text-red-400 bg-red-400/10 border-red-400/20",
  disqualified: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
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

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLead = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${params.id}`);
      if (!res.ok) {
        setError(res.status === 404 ? "Lead not found" : "Failed to load lead");
        return;
      }
      const data = await res.json();
      setLead(data);
    } catch {
      setError("Failed to load lead");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const transitionStatus = async (status: LeadStatus) => {
    if (!lead || transitioning || lead.status === status) return;
    setTransitioning(true);
    try {
      const res = await fetch(`/api/leads/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLead(updated);
      }
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-zinc-400">{error ?? "Lead not found"}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-xs text-zinc-500 hover:text-zinc-300"
        >
          Go back
        </button>
      </div>
    );
  }

  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.status === lead.status);
  const isTerminal = lead.status === "lost" || lead.status === "disqualified";

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft size={12} />
        Leads
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
            <User size={20} className="text-zinc-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">
              {[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown"}
            </h1>
            {lead.company && (
              <p className="text-sm text-zinc-500">{lead.company}</p>
            )}
          </div>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium capitalize",
            STATUS_COLORS[lead.status],
          )}
        >
          {lead.status}
        </span>
      </div>

      {/* Pipeline progress bar */}
      {!isTerminal && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Pipeline Stage
          </p>
          <div className="flex items-center gap-1">
            {PIPELINE_STAGES.map((stage, i) => {
              const isPast = i < currentStageIndex;
              const isCurrent = i === currentStageIndex;
              const isFuture = i > currentStageIndex;
              return (
                <div key={stage.status} className="flex flex-1 items-center">
                  <button
                    onClick={() => transitionStatus(stage.status)}
                    disabled={transitioning || isCurrent}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1 rounded-lg p-2 text-center transition-all",
                      isCurrent && "cursor-default",
                      isFuture && !transitioning && "hover:bg-zinc-800/50 cursor-pointer",
                      isPast && !transitioning && "hover:bg-zinc-800/50 cursor-pointer opacity-60",
                    )}
                    title={isCurrent ? stage.label : `Move to ${stage.label}`}
                  >
                    <div
                      className={cn(
                        "h-2 w-full rounded-full transition-all",
                        isPast ? "bg-emerald-500" : isCurrent ? stage.color : "bg-zinc-800",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        isCurrent ? "text-zinc-200" : "text-zinc-500",
                      )}
                    >
                      {stage.label}
                    </span>
                  </button>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <ChevronRight size={12} className="shrink-0 text-zinc-700" />
                  )}
                </div>
              );
            })}
          </div>
          {transitioning && (
            <p className="mt-2 text-center text-[10px] text-zinc-500">Updating…</p>
          )}
        </div>
      )}

      {/* Quick actions for terminal states */}
      {isTerminal && (
        <div className="flex gap-2">
          <button
            onClick={() => transitionStatus("new")}
            disabled={transitioning}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
          >
            Re-open as New
          </button>
          <button
            onClick={() => transitionStatus("qualified")}
            disabled={transitioning}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
          >
            Re-qualify
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Contact info */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Contact
          </p>
          {lead.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="shrink-0 text-zinc-500" />
              <a
                href={`mailto:${lead.email}`}
                className="text-zinc-300 hover:text-zinc-100 transition-colors"
              >
                {lead.email}
              </a>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="shrink-0 text-zinc-500" />
              <a
                href={`tel:${lead.phone}`}
                className="text-zinc-300 hover:text-zinc-100 transition-colors"
              >
                {lead.phone}
              </a>
            </div>
          )}
          {lead.company && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 size={14} className="shrink-0 text-zinc-500" />
              <span className="text-zinc-300">{lead.company}</span>
            </div>
          )}
          {(!lead.email && !lead.phone && !lead.company) && (
            <p className="text-xs text-zinc-600">No contact details</p>
          )}
        </div>

        {/* Lead metadata */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Details
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-zinc-500">Source</span>
            <span className="text-zinc-300">{lead.source ?? "—"}</span>
            <span className="text-zinc-500">Score</span>
            <span className="text-zinc-300">{lead.score}</span>
            <span className="text-zinc-500">GHL</span>
            <span>
              {lead.ghl_contact_id ? (
                <span className="rounded-full bg-green-400/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                  synced
                </span>
              ) : (
                <span className="text-zinc-600">—</span>
              )}
            </span>
            <span className="text-zinc-500">Created</span>
            <span className="text-zinc-300">{timeAgo(lead.created_at)}</span>
            {lead.last_contacted_at && (
              <>
                <span className="text-zinc-500">Last contact</span>
                <span className="text-zinc-300">{timeAgo(lead.last_contacted_at)}</span>
              </>
            )}
            {lead.converted_at && (
              <>
                <span className="text-zinc-500">Converted</span>
                <span className="text-zinc-300">{timeAgo(lead.converted_at)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      {lead.tags.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Tag size={12} className="text-zinc-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tags</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lead.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-800/50 px-2.5 py-1 text-xs text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {Object.keys(lead.metadata ?? {}).length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Clock size={12} className="text-zinc-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Metadata
            </p>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-zinc-900/50 p-3 text-[11px] text-zinc-400">
            {JSON.stringify(lead.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
