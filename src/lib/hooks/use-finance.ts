"use client";

import { useQuery } from "@tanstack/react-query";

export interface FinanceSummary {
  total_revenue: number;
  total_costs: number;
  net_margin: number;
  invoices_outstanding: number;
  revenue_by_client: Array<{
    client_id: string;
    client_name: string;
    revenue: number;
  }>;
  period: {
    month: number;
    year: number;
    start: string;
    end: string;
  };
}

export function useFinanceSummary() {
  return useQuery<FinanceSummary>({
    queryKey: ["finance", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/finance/summary");
      if (!res.ok) throw new Error("Failed to fetch finance summary");
      return res.json();
    },
  });
}
