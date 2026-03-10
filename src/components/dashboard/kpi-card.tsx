"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiSparkline } from "./kpi-sparkline";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  glow?: boolean;
  delay?: number;
  sparklineData?: number[];
  sparklineColor?: string;
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
  sparklineData,
  sparklineColor,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border p-3.5 transition-all duration-200 animate-fade-up sm:p-5",
        "bg-zinc-950/60 backdrop-blur-sm",
        "hover:bg-zinc-900/40 hover:border-zinc-700 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20",
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
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11", bg)}>
          <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", color)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-lg font-bold tracking-tight text-zinc-50 sm:text-2xl")}>{value}</p>
          <p className="text-[10px] font-medium tracking-wide text-zinc-400 uppercase sm:text-xs">{label}</p>
        </div>
      </div>
      {sparklineData && sparklineData.length > 0 && sparklineColor && (
        <div className="mt-3 flex justify-end">
          <KpiSparkline data={sparklineData} color={sparklineColor} />
        </div>
      )}
    </div>
  );
}
