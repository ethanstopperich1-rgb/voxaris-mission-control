"use client";

import { CallsChart } from "@/components/charts/calls-chart";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { PlatformChart } from "@/components/charts/platform-chart";

interface DashboardChartsProps {
  callsData: { date: string; calls: number }[];
  revenueData: { month: string; revenue: number }[];
  platformData: { platform: string; count: number }[];
}

export function DashboardCharts({
  callsData,
  revenueData,
  platformData,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Calls per Day */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 transition-colors duration-200 hover:border-zinc-700">
        <h3 className="mb-3 text-sm font-semibold text-zinc-100">
          Calls per Day
        </h3>
        {callsData.length > 0 ? (
          <CallsChart data={callsData} />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-xs text-zinc-500">
            No call data available
          </div>
        )}
      </div>

      {/* Revenue Trend */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 transition-colors duration-200 hover:border-zinc-700">
        <h3 className="mb-3 text-sm font-semibold text-zinc-100">
          Revenue Trend
        </h3>
        {revenueData.length > 0 ? (
          <RevenueChart data={revenueData} />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-xs text-zinc-500">
            No revenue data available
          </div>
        )}
      </div>

      {/* Platform Distribution */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 transition-colors duration-200 hover:border-zinc-700">
        <h3 className="mb-3 text-sm font-semibold text-zinc-100">
          Platform Distribution
        </h3>
        {platformData.length > 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <PlatformChart data={platformData} />
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-xs text-zinc-500">
            No platform data available
          </div>
        )}
      </div>
    </div>
  );
}
