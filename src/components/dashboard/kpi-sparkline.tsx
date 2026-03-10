"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

export function KpiSparkline({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const chartData = data.map((value, i) => ({ value, i }));
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.1}
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
