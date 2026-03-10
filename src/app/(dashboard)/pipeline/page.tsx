import { cn, formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
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
// Data fetching
// ---------------------------------------------------------------------------

async function getDeals(): Promise<Deal[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("mc_deals")
    .select("*, mc_contacts(first_name, last_name)")
    .order("updated_at", { ascending: false });

  return (data ?? []) as Deal[];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PipelinePage() {
  const deals = await getDeals();

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
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:gap-4 sm:px-0">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={stage.key}
              className={cn(
                "flex w-64 shrink-0 flex-col rounded-xl border bg-zinc-950/60 sm:w-72",
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
                      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-md hover:shadow-black/20 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing"
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
