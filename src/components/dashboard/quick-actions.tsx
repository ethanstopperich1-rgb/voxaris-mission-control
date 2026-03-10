"use client";

import {
  Phone,
  RefreshCcw,
  FileBarChart,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { label: "Trigger Call", icon: Phone, color: "text-blue-400 hover:bg-blue-500/10" },
  { label: "Sync Agents", icon: RefreshCcw, color: "text-emerald-400 hover:bg-emerald-500/10" },
  { label: "Generate Report", icon: FileBarChart, color: "text-zinc-200 hover:bg-zinc-200/10" },
  { label: "New Client", icon: UserPlus, color: "text-violet-400 hover:bg-violet-500/10" },
];

export function QuickActions() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-100">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={cn(
              "group/action flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3",
              "text-sm font-medium text-zinc-300 transition-all duration-200",
              "hover:border-zinc-700 hover:text-zinc-100 hover:shadow-lg hover:shadow-black/20 hover:scale-[1.02]",
              "active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/50",
              action.color
            )}
          >
            <action.icon className="h-4 w-4 transition-transform duration-200 group-hover/action:scale-110" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
