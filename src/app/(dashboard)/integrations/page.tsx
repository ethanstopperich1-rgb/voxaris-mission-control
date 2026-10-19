import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/server/auth";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Integration {
  name: string;
  slug: string;
  description: string;
  status: "connected" | "disconnected" | "partial";
  icon: string;
  details?: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getIntegrations(): Promise<Integration[]> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const orgId = session.organizationId;

  // Check GHL credentials
  const { count: ghlCount } = await supabase
    .from("mc_ghl_credentials")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);

  // Check Paperclip connectivity
  let paperclipStatus: "connected" | "disconnected" = "disconnected";
  const paperclipUrl = process.env.PAPERCLIP_BASE_URL;
  if (paperclipUrl) {
    try {
      const res = await fetch(`${paperclipUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) paperclipStatus = "connected";
    } catch {
      // Paperclip unreachable
    }
  }

  return [
    {
      name: "GoHighLevel",
      slug: "ghl",
      description: "CRM, pipeline management, and marketing automation",
      status: (ghlCount ?? 0) > 0 ? "connected" : "disconnected",
      icon: "GHL",
      details: (ghlCount ?? 0) > 0 ? `${ghlCount} workspace(s) connected` : "No credentials configured",
    },
    {
      name: "Paperclip AI",
      slug: "paperclip",
      description: "AI worker orchestration and task delegation",
      status: paperclipStatus,
      icon: "PC",
      details: paperclipStatus === "connected"
        ? `Connected at ${paperclipUrl}`
        : paperclipUrl
          ? "Server unreachable"
          : "PAPERCLIP_BASE_URL not set",
    },
    {
      name: "VAPI",
      slug: "vapi",
      description: "Voice AI agents for inbound and outbound calls",
      status: process.env.VAPI_API_KEY ? "connected" : "disconnected",
      icon: "VA",
      details: process.env.VAPI_API_KEY ? "API key configured" : "VAPI_API_KEY not set",
    },
    {
      name: "Tavus",
      slug: "tavus",
      description: "Conversational video AI personas",
      status: process.env.TAVUS_API_KEY ? "connected" : "disconnected",
      icon: "TV",
      details: process.env.TAVUS_API_KEY ? "API key configured" : "TAVUS_API_KEY not set",
    },
    {
      name: "Apollo.io",
      slug: "apollo",
      description: "Lead enrichment and prospecting data",
      status: process.env.APOLLO_API_KEY ? "connected" : "disconnected",
      icon: "AP",
      details: process.env.APOLLO_API_KEY ? "API key configured" : "APOLLO_API_KEY not set",
    },
    {
      name: "Supabase",
      slug: "supabase",
      description: "Database, auth, and realtime subscriptions",
      status: "connected",
      icon: "SB",
      details: "Primary data store",
    },
    {
      name: "Vercel",
      slug: "vercel",
      description: "Deployment platform and edge functions",
      status: process.env.VERCEL_TOKEN ? "connected" : "disconnected",
      icon: "VC",
      details: process.env.VERCEL_TOKEN ? "Deploy token configured" : "VERCEL_TOKEN not set",
    },
  ];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  connected: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", label: "Connected" },
  disconnected: { bg: "bg-zinc-500/10 border-zinc-500/20", text: "text-zinc-500", label: "Disconnected" },
  partial: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", label: "Partial" },
};

const iconBg: Record<string, string> = {
  ghl: "bg-green-500/15 text-green-400",
  paperclip: "bg-violet-500/15 text-violet-400",
  vapi: "bg-teal-500/15 text-teal-400",
  tavus: "bg-purple-500/15 text-purple-400",
  apollo: "bg-orange-500/15 text-orange-400",
  supabase: "bg-emerald-500/15 text-emerald-400",
  vercel: "bg-zinc-200/15 text-zinc-200",
};

export default async function IntegrationsPage() {
  const integrations = await getIntegrations();
  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {connectedCount} of {integrations.length} integrations active
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          const style = statusStyles[integration.status];
          return (
            <div
              key={integration.slug}
              className={cn(
                "relative rounded-xl border p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/10",
                style.bg,
              )}
            >
              {/* Top row: icon + status */}
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold",
                    iconBg[integration.slug] ?? "bg-zinc-500/15 text-zinc-400",
                  )}
                >
                  {integration.icon}
                </div>
                <div className="flex items-center gap-1.5">
                  {integration.status === "connected" ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : (
                    <XCircle size={14} className="text-zinc-500" />
                  )}
                  <span className={cn("text-[10px] font-medium uppercase tracking-wider", style.text)}>
                    {style.label}
                  </span>
                </div>
              </div>

              {/* Name + description */}
              <h3 className="mt-3 text-sm font-semibold text-zinc-100">
                {integration.name}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                {integration.description}
              </p>

              {/* Details */}
              {integration.details && (
                <p className="mt-3 text-[11px] text-zinc-600">
                  {integration.details}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
