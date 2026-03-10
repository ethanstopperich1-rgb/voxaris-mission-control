"use client";

import { cn } from "@/lib/utils";

const platformStyles: Record<string, { bg: string; text: string; label: string }> = {
  vapi: { bg: "bg-teal-500/15", text: "text-teal-400", label: "VAPI" },
  tavus: { bg: "bg-violet-500/15", text: "text-violet-400", label: "Tavus" },
};

interface PlatformBadgeProps {
  platform: "vapi" | "tavus";
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const style = platformStyles[platform] ?? platformStyles.vapi;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        style.bg,
        style.text,
        className
      )}
    >
      {style.label}
    </span>
  );
}
