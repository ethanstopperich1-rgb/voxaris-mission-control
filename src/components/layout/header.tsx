"use client";

import { RefreshCw, Zap, Bot, Link2 } from "lucide-react";
import { useMissionControl } from "@/lib/store";

export function Header() {
  const { triggerRefresh } = useMissionControl();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl lg:px-6">
      {/* Left -- title */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:block">
          <h1 className="text-sm font-semibold text-foreground">
            Voxaris Mission Control
          </h1>
          <p className="text-[11px] text-muted-foreground">
            AI Operations Hub
          </p>
        </div>
        {/* Spacer for mobile (hamburger is in sidebar) */}
        <div className="w-10 lg:hidden" />
      </div>

      {/* Right -- status indicators + actions */}
      <div className="flex items-center gap-3">
        {/* Agent count indicator */}
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5">
          <Bot size={13} className="text-zinc-200" />
          <span className="text-[11px] font-medium text-muted-foreground">
            Agents Active
          </span>
        </div>

        {/* Integration status indicator */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5">
          <div className="relative flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-center gap-1">
            <Link2 size={11} className="text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground">
              Integrations
            </span>
          </div>
        </div>

        {/* Refresh */}
        <button
          onClick={triggerRefresh}
          className="rounded-lg border border-border/60 bg-card p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Refresh data"
          aria-label="Refresh dashboard data"
        >
          <RefreshCw size={14} />
        </button>

        {/* Sync Agents button */}
        <button
          onClick={() => {
            fetch("/api/agents/sync", { method: "POST" });
          }}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-200 px-3 py-1.5 text-[12px] font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
        >
          <Zap size={13} />
          Sync Agents
        </button>
      </div>
    </header>
  );
}
