"use client";

import { useRouter } from "next/navigation";
import { Bot, Phone, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { Client } from "@/lib/types";

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  onboarding: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  paused: { bg: "bg-zinc-500/15", text: "text-zinc-400", dot: "bg-zinc-400" },
  churned: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
};

const industryStyles: Record<string, string> = {
  automotive: "bg-blue-500/10 text-blue-400",
  medical: "bg-rose-500/10 text-rose-400",
  travel: "bg-amber-500/10 text-amber-400",
  default: "bg-zinc-500/10 text-zinc-400",
};

interface ClientCardProps {
  client: Client;
}

export function ClientCard({ client }: ClientCardProps) {
  const router = useRouter();
  const status = statusStyles[client.status] ?? statusStyles.active;
  const industryStyle = industryStyles[client.industry] ?? industryStyles.default;

  const healthColor =
    client.health_score > 70
      ? "bg-emerald-500"
      : client.health_score > 40
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <button
      type="button"
      onClick={() => router.push(`/clients/${client.slug}`)}
      className={cn(
        "group flex w-full flex-col rounded-xl border border-zinc-800 bg-zinc-950/60 p-5",
        "text-left transition-all duration-200",
        "hover:border-zinc-700 hover:bg-zinc-900/60 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-zinc-100 group-hover:text-gold transition-colors">
            {client.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", industryStyle)}>
              {client.industry}
            </span>
          </div>
        </div>
        <span className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium", status.bg, status.text)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {client.status}
        </span>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Bot className="h-3.5 w-3.5" />
          <span className="text-xs">{client.agent_count ?? 0} agents</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Phone className="h-3.5 w-3.5" />
          <span className="text-xs">{client.call_count_30d ?? 0} calls</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <DollarSign className="h-3.5 w-3.5" />
          <span className="text-xs">{formatCurrency(client.monthly_retainer)}</span>
        </div>
      </div>

      {/* Health score bar */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Health
          </span>
          <span className="text-xs font-semibold text-zinc-300">{client.health_score}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={cn("h-full rounded-full transition-all duration-500", healthColor)}
            style={{ width: `${Math.min(client.health_score, 100)}%` }}
          />
        </div>
      </div>
    </button>
  );
}
