import { Rocket, ExternalLink, GitBranch, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { Deployment } from "@/lib/types";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getDeployments() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("mc_deployments")
    .select("*, mc_clients(name)")
    .order("last_deployed_at", { ascending: false });

  return (data ?? []) as Array<
    Deployment & { mc_clients?: { name: string } | null }
  >;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusStyles: Record<string, string> = {
  ready: "bg-emerald-500/15 text-emerald-400",
  building: "bg-amber-500/15 text-amber-400",
  error: "bg-red-500/15 text-red-400",
  queued: "bg-blue-500/15 text-blue-400",
  canceled: "bg-zinc-500/15 text-zinc-400",
};

const statusDots: Record<string, string> = {
  ready: "bg-emerald-400",
  building: "bg-amber-400",
  error: "bg-red-400",
  queued: "bg-blue-400",
  canceled: "bg-zinc-400",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DeploymentsPage() {
  const deployments = await getDeployments();

  if (deployments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Deployments</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Vercel deployment monitoring and project management.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60 py-24">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
            <Rocket className="h-6 w-6 text-zinc-600" />
          </div>
          <p className="text-sm font-medium text-zinc-400">No deployments yet</p>
          <p className="mt-1 max-w-sm text-center text-xs text-zinc-600">
            Vercel project status, deployment logs, and domain management will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Deployments</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Vercel deployment monitoring and project management.
          </p>
        </div>
        <span className="text-xs text-zinc-500">{deployments.length} projects</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deployments.map((deploy) => {
          const status = deploy.last_deployment_status ?? "queued";
          return (
            <div
              key={deploy.id}
              className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/60 hover:shadow-lg hover:shadow-black/20 hover:scale-[1.01]"
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-zinc-100">
                    {deploy.project_name}
                  </h3>
                  {deploy.mc_clients?.name && (
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {deploy.mc_clients.name}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                    statusStyles[status] ?? "bg-zinc-500/15 text-zinc-400"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", statusDots[status] ?? "bg-zinc-400")} />
                  {status}
                </span>
              </div>

              {/* Details */}
              <div className="mb-4 space-y-2 text-xs">
                {deploy.domain && (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Globe className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{deploy.domain}</span>
                  </div>
                )}
                {deploy.git_repo && (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <GitBranch className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="truncate">{deploy.git_repo}</span>
                  </div>
                )}
                {deploy.last_deployed_at && (
                  <p className="text-zinc-500">
                    Last deployed:{" "}
                    {new Date(deploy.last_deployed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>

              {/* Actions */}
              {deploy.last_deployment_url && (
                <a
                  href={deploy.last_deployment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-all duration-150 hover:text-zinc-200 hover:gap-2"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Deployment
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
