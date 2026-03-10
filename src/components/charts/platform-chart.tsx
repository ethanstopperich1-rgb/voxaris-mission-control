"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface PlatformChartProps {
  data: { platform: string; count: number }[];
}

const PLATFORM_COLORS: Record<string, string> = {
  vapi: "#14b8a6",
  tavus: "#a78bfa",
};

export function PlatformChart({ data }: PlatformChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="relative mx-auto" style={{ width: 150, height: 150 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="platform"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={65}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell
                key={entry.platform}
                fill={PLATFORM_COLORS[entry.platform] ?? "#71717a"}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-zinc-100">{total}</span>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          calls
        </span>
      </div>
      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-4">
        {data.map((entry) => (
          <div key={entry.platform} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  PLATFORM_COLORS[entry.platform] ?? "#71717a",
              }}
            />
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              {entry.platform}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
