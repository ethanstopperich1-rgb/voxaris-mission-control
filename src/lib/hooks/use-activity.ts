"use client";

import { useQuery } from "@tanstack/react-query";
import type { ActivityEntry } from "@/lib/types";

export function useActivity() {
  return useQuery<ActivityEntry[]>({
    queryKey: ["activity"],
    queryFn: async () => {
      const res = await fetch("/api/activity");
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
    refetchInterval: 30_000, // Poll every 30s for near-realtime feed
  });
}
