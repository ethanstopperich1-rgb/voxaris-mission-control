"use client";

import { useQuery } from "@tanstack/react-query";
import type { UnifiedCall } from "@/lib/types";

interface UseCallsOptions {
  platform?: string;
  clientId?: string;
  agentId?: string;
  status?: string;
  limit?: number;
}

export function useCalls(options: UseCallsOptions = {}) {
  const { platform, clientId, agentId, status, limit } = options;

  return useQuery<UnifiedCall[]>({
    queryKey: ["calls", { platform, clientId, agentId, status, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (platform) params.set("platform", platform);
      if (clientId) params.set("client_id", clientId);
      if (agentId) params.set("agent_id", agentId);
      if (status) params.set("status", status);
      if (limit) params.set("limit", String(limit));

      const qs = params.toString();
      const res = await fetch(`/api/calls${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch calls");
      return res.json();
    },
  });
}

export function useCall(id: string) {
  return useQuery<UnifiedCall>({
    queryKey: ["calls", id],
    queryFn: async () => {
      const res = await fetch(`/api/calls/${id}`);
      if (!res.ok) throw new Error("Failed to fetch call");
      return res.json();
    },
    enabled: !!id,
  });
}
