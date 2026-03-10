"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Agent } from "@/lib/types";

interface UseAgentsOptions {
  platform?: string;
  clientId?: string;
  status?: string;
}

export function useAgents(options: UseAgentsOptions = {}) {
  const { platform, clientId, status } = options;

  return useQuery<Agent[]>({
    queryKey: ["agents", { platform, clientId, status }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (platform) params.set("platform", platform);
      if (clientId) params.set("client_id", clientId);
      if (status) params.set("status", status);

      const qs = params.toString();
      const res = await fetch(`/api/agents${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
  });
}

export function useAgent(id: string) {
  return useQuery<Agent>({
    queryKey: ["agents", id],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${id}`);
      if (!res.ok) throw new Error("Failed to fetch agent");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: Pick<Agent, "client_id" | "name" | "platform" | "platform_agent_id"> &
        Partial<
          Pick<
            Agent,
            "agent_type" | "phone_number" | "voice_id" | "voice_name" | "llm_id" | "status"
          >
        >
    ) => {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Failed to create agent");
      }
      return res.json() as Promise<Agent>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useUpdateAgent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Agent>) => {
      const res = await fetch(`/api/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Failed to update agent");
      }
      return res.json() as Promise<Agent>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agents", id] });
    },
  });
}

export function useSyncAgents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/agents/sync", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Failed to sync agents");
      }
      return res.json() as Promise<{
        synced: number;
        total: number;
        errors?: string[];
      }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}
