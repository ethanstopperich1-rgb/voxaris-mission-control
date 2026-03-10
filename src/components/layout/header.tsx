"use client";

import { RefreshCw, Zap, Bot, Link2, Search } from "lucide-react";
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
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search trigger -- icon-only on mobile, full on sm+ */}
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-500 transition-all duration-150 hover:border-zinc-700 hover:text-zinc-400 hover:bg-zinc-900 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:px-3"
          aria-label="Search"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-[10px] font-mono">&#8984;K</kbd>
        </button>

        {/* Agent count indicator -- hidden below md */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5">
          <Bot size={13} className="text-zinc-200" />
          <span className="text-[11px] font-medium text-muted-foreground">
            Agents Active
          </span>
        </div>

        {/* Integration status indicator -- hidden below lg */}
        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5">
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
          className="group/refresh rounded-lg border border-border/60 bg-card p-2 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground hover:border-zinc-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          title="Refresh data"
          aria-label="Refresh dashboard data"
        >
          <RefreshCw size={14} className="transition-transform duration-300 group-hover/refresh:rotate-90" />
        </button>

        {/* Sync Agents button -- icon-only on mobile */}
        <button
          onClick={() => {
            fetch("/api/agents/sync", { method: "POST" });
          }}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-200 px-2.5 py-1.5 text-[12px] font-semibold text-zinc-950 transition-all duration-150 hover:bg-zinc-100 hover:shadow-md hover:shadow-zinc-200/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:px-3"
          title="Sync Agents"
          aria-label="Sync agents from platforms"
        >
          <Zap size={13} />
          <span className="hidden sm:inline">Sync Agents</span>
        </button>
      </div>
    </header>
  );
}
