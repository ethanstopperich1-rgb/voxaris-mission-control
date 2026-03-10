"use client";

import { cn, formatCurrency } from "@/lib/utils";
import type { Deal } from "@/lib/types";

// ---------------------------------------------------------------------------
// Pipeline stages
// ---------------------------------------------------------------------------

const stages = [
  { key: "prospect", label: "Prospect", color: "border-zinc-700" },
  { key: "contacted", label: "Contacted", color: "border-blue-700" },
  { key: "demo", label: "Demo", color: "border-violet-700" },
  { key: "proposal", label: "Proposal", color: "border-amber-700" },
  { key: "closed_won", label: "Closed Won", color: "border-emerald-700" },
  { key: "closed_lost", label: "Closed Lost", color: "border-red-700" },
] as const;

// ---------------------------------------------------------------------------
// Seed deals
// ---------------------------------------------------------------------------

const sampleDeals: Deal[] = [
  {
    id: "d1",
    contact_id: null,
    client_id: "5",
    title: "Hill Nissan - AI Receptionist",
    stage: "demo",
    value: 54000,
    monthly_value: 4500,
    probability: 0.6,
    expected_close: "2026-04-15",
    notes: "Demo scheduled for next week. Decision maker confirmed.",
    closed_at: null,
    created_at: "2026-02-10T00:00:00Z",
    updated_at: "2026-03-05T00:00:00Z",
  },
  {
    id: "d2",
    contact_id: null,
    client_id: "6",
    title: "Gulf Coast Mitsubishi - Voice + Video",
    stage: "proposal",
    value: 72000,
    monthly_value: 6000,
    probability: 0.75,
    expected_close: "2026-03-30",
    notes: "Proposal sent. Awaiting budget approval.",
    closed_at: null,
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-03-08T00:00:00Z",
  },
  {
    id: "d3",
    contact_id: null,
    client_id: "7",
    title: "Luxury Auto Group - AI Concierge",
    stage: "contacted",
    value: 96000,
    monthly_value: 8000,
    probability: 0.3,
    expected_close: "2026-05-01",
    notes: "Initial conversation. Interested in video agents.",
    closed_at: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-09T00:00:00Z",
  },
  {
    id: "d4",
    contact_id: null,
    client_id: "8",
    title: "Premier Dental - Patient Scheduler",
    stage: "prospect",
    value: 48000,
    monthly_value: 4000,
    probability: 0.15,
    expected_close: "2026-06-01",
    notes: "Inbound lead from website. Medical vertical expansion.",
    closed_at: null,
    created_at: "2026-03-05T00:00:00Z",
    updated_at: "2026-03-05T00:00:00Z",
  },
  {
    id: "d5",
    contact_id: null,
    client_id: "1",
    title: "Suncoast Sports - Contract Renewal",
    stage: "closed_won",
    value: 60000,
    monthly_value: 5000,
    probability: 1,
    expected_close: "2026-08-31",
    notes: "12-month renewal confirmed.",
    closed_at: "2026-02-28T00:00:00Z",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-02-28T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Pipeline</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Sales pipeline and deal tracking across prospects and clients.
        </p>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = sampleDeals.filter((d) => d.stage === stage.key);
          const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={stage.key}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border bg-zinc-950/60",
                stage.color
              )}
            >
              {/* Column header */}
              <div className="border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-200">{stage.label}</h3>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                    {stageDeals.length}
                  </span>
                </div>
                {totalValue > 0 && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatCurrency(totalValue)} total
                  </p>
                )}
              </div>

              {/* Deal cards */}
              <div className="flex-1 space-y-2 p-3">
                {stageDeals.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-zinc-800 py-8 text-center">
                    <p className="text-xs text-zinc-600">No deals</p>
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                    >
                      <h4 className="text-sm font-medium text-zinc-200 leading-snug">
                        {deal.title}
                      </h4>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-zinc-200">
                          {formatCurrency(deal.monthly_value)}
                          <span className="text-xs font-normal text-zinc-500">/mo</span>
                        </span>
                        <span className="text-xs text-zinc-500">
                          {Math.round(deal.probability * 100)}%
                        </span>
                      </div>
                      {deal.expected_close && (
                        <p className="mt-1.5 text-[10px] text-zinc-500">
                          Close:{" "}
                          {new Date(deal.expected_close).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
