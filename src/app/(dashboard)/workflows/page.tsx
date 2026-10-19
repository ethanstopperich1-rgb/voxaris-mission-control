import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { Workflow, Play, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const statusIcons: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  failed: AlertCircle,
  running: Play,
  pending: Clock,
};

const statusColors: Record<string, string> = {
  completed: "text-emerald-400",
  failed: "text-red-400",
  running: "text-blue-400",
  pending: "text-zinc-400",
  cancelled: "text-zinc-500",
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

export default async function WorkflowsPage() {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const supabase = await createClient();

  const [workflowsRes, runsRes] = await Promise.all([
    supabase
      .from("mc_workflows")
      .select("*")
      .eq("organization_id", session.organizationId)
      .order("name"),
    supabase
      .from("mc_workflow_runs")
      .select("*")
      .eq("organization_id", session.organizationId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const workflows = workflowsRes.data ?? [];
  const runs = runsRes.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Workflows</h1>
        <p className="text-sm text-zinc-500">{workflows.length} workflows registered</p>
      </div>

      {/* Workflow definitions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Definitions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.length === 0 ? (
            <div className="col-span-full flex flex-col items-center py-12 text-center">
              <Workflow size={32} className="mb-3 text-zinc-600" />
              <p className="text-sm text-zinc-400">No workflows yet</p>
            </div>
          ) : (
            workflows.map((wf: Record<string, unknown>) => (
              <div key={wf.id as string} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 card-hover">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-200">{wf.name as string}</h3>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    wf.enabled ? "text-emerald-400 bg-emerald-400/10" : "text-zinc-500 bg-zinc-500/10",
                  )}>
                    {wf.enabled ? "active" : "disabled"}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{(wf.description as string) ?? "No description"}</p>
                <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                  <span>trigger: {wf.trigger_type as string}</span>
                  <span>{((wf.steps as unknown[]) ?? []).length} steps</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent runs */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Recent Runs</h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 divide-y divide-zinc-800/50">
          {runs.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">No workflow runs yet</div>
          ) : (
            runs.map((run: Record<string, unknown>) => {
              const status = run.status as string;
              const Icon = statusIcons[status] ?? Clock;
              return (
                <div key={run.id as string} className="flex items-center justify-between px-4 py-3 row-hover">
                  <div className="flex items-center gap-3">
                    <Icon size={14} className={statusColors[status] ?? "text-zinc-400"} />
                    <div>
                      <span className="text-xs font-medium text-zinc-300">{run.trigger_type as string} run</span>
                      {typeof run.error === "string" && run.error && (
                        <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-xs">{run.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span className={cn("font-medium", statusColors[status])}>{status}</span>
                    <span>{timeAgo(run.created_at as string)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
