"use client";

import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="text-sm font-semibold text-zinc-200">
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4d4d8" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#d4d4d8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#71717a" }}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "#3f3f46", strokeDasharray: "4 4" }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#d4d4d8"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{
            r: 4,
            fill: "#d4d4d8",
            stroke: "#18181b",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
