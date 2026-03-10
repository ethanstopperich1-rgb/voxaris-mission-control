"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  glow?: boolean;
  delay?: number;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  border,
  glow = false,
  delay = 0,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border p-5 transition-all duration-300 animate-fade-up",
        "bg-zinc-950/60 backdrop-blur-sm hover:bg-zinc-900/60",
        border,
        glow && "shadow-lg animate-pulse-glow"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {glow && (
        <div
          className={cn(
            "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100",
            "blur-xl -z-10"
          )}
          style={{ background: bg.replace("/10", "/5") }}
        />
      )}
      <div className="flex items-center gap-4">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", bg)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-2xl font-bold tracking-tight text-zinc-50")}>{value}</p>
          <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">{label}</p>
        </div>
      </div>
    </div>
  );
}
