"use client";

import {
  Phone,
  Bot,
  UserPlus,
  FileText,
  Rocket,
  DollarSign,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { ActivityEntry } from "@/lib/types";

const entityIconMap: Record<string, LucideIcon> = {
  call: Phone,
  agent: Bot,
  client: UserPlus,
  contact: UserPlus,
  deal: DollarSign,
  invoice: FileText,
  deployment: Rocket,
  content: FileText,
};

const entityColorMap: Record<string, string> = {
  call: "text-blue-400",
  agent: "text-emerald-400",
  client: "text-amber-400",
  contact: "text-violet-400",
  deal: "text-gold",
  invoice: "text-cyan-400",
  deployment: "text-rose-400",
  content: "text-indigo-400",
};

interface ActivityFeedProps {
  activities: ActivityEntry[];
  className?: string;
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-zinc-500", className)}>
        <Activity className="mb-3 h-8 w-8" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {activities.map((activity) => {
        const Icon = entityIconMap[activity.entity_type] ?? Activity;
        const iconColor = entityColorMap[activity.entity_type] ?? "text-zinc-400";

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-800/50"
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-800">
              <Icon className={cn("h-3.5 w-3.5", iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-200">
                <span className="font-medium">{activity.action}</span>
                {activity.details && (
                  <span className="text-zinc-400"> &mdash; {activity.details}</span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {activity.source && (
                  <span className="mr-2 capitalize">{activity.source}</span>
                )}
                {formatRelativeTime(activity.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
