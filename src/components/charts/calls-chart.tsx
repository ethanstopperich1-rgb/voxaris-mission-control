"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useState } from "react";

interface CallsChartProps {
  data: { date: string; calls: number }[];
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
        {payload[0].value} calls
      </p>
    </div>
  );
}

export function CallsChart({ data }: CallsChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#71717a" }}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(161, 161, 170, 0.05)" }}
        />
        <Bar
          dataKey="calls"
          radius={[4, 4, 0, 0]}
          onMouseEnter={(_, index) => setActiveIndex(index)}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={activeIndex === index ? "#d4d4d8" : "#a1a1aa"}
              className="transition-colors duration-150"
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
