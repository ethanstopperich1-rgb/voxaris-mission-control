"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Client } from "@/lib/types";

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });
}

export function useClient(slug: string) {
  return useQuery<Client & { agent_count: number }>({
    queryKey: ["clients", slug],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch client");
      return res.json();
    },
    enabled: !!slug,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: Pick<Client, "name" | "slug"> &
        Partial<Pick<Client, "industry" | "status" | "monthly_retainer" | "website" | "notes">>
    ) => {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Failed to create client");
      }
      return res.json() as Promise<Client>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Client>) => {
      const res = await fetch(`/api/clients/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Failed to update client");
      }
      return res.json() as Promise<Client>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", slug] });
    },
  });
}
