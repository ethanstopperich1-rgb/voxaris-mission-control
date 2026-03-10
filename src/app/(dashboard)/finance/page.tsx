"use client";

import { cn, formatCurrency } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------

const financeKpis = [
  {
    label: "Total Revenue",
    value: "$18,500",
    icon: DollarSign,
    color: "text-zinc-200",
    bg: "bg-zinc-200/10",
    border: "border-zinc-300/20",
    glow: true,
  },
  {
    label: "Total Costs",
    value: "$3,420",
    icon: TrendingDown,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  {
    label: "Net Profit",
    value: "$15,080",
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: true,
  },
  {
    label: "Avg Revenue/Client",
    value: "$4,625",
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
];

const revenueByClient = [
  { name: "Suncoast Sports", revenue: 5000, color: "#3b82f6" },
  { name: "Orlando Art", revenue: 4500, color: "#ec4899" },
  { name: "Porsche Jackson", revenue: 5000, color: "#e4e4e7" },
  { name: "Arrivia", revenue: 4000, color: "#f59e0b" },
];

const costBreakdown = [
  { name: "VAPI", value: 2470, color: "#14b8a6" },
  { name: "Tavus", value: 450, color: "#8b5cf6" },
  { name: "Vercel", value: 280, color: "#6b7280" },
  { name: "Supabase", value: 220, color: "#22c55e" },
];

const invoices = [
  {
    id: "inv-001",
    client: "Suncoast Sports",
    amount: 5000,
    status: "paid",
    dueDate: "2026-03-01",
  },
  {
    id: "inv-002",
    client: "Orlando Art of Surgery",
    amount: 4500,
    status: "paid",
    dueDate: "2026-03-01",
  },
  {
    id: "inv-003",
    client: "Porsche Jackson",
    amount: 5000,
    status: "sent",
    dueDate: "2026-03-15",
  },
  {
    id: "inv-004",
    client: "Arrivia",
    amount: 4000,
    status: "sent",
    dueDate: "2026-03-15",
  },
];

const invoiceStatusStyle: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-400",
  sent: "bg-blue-500/15 text-blue-400",
  overdue: "bg-red-500/15 text-red-400",
  draft: "bg-zinc-500/15 text-zinc-400",
};

// ---------------------------------------------------------------------------
// Custom tooltip for charts
// ---------------------------------------------------------------------------

function ChartTooltip({
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
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-zinc-200">{label}</p>
      <p className="text-zinc-200">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FinancePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Finance</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Revenue, costs, and profitability tracking.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {financeKpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} delay={i * 80} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Client */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Revenue by Client
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByClient} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {revenueByClient.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Cost Breakdown by Platform
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                >
                  {costBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#d4d4d8" }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-zinc-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Invoice table */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Invoices
        </h3>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                {["Invoice", "Client", "Amount", "Status", "Due Date"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {invoices.map((inv) => (
                <tr key={inv.id} className="transition-colors hover:bg-zinc-900/30">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                    {inv.id}
                  </td>
                  <td className="px-4 py-3 text-zinc-200">{inv.client}</td>
                  <td className="px-4 py-3 font-medium text-zinc-200">
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        invoiceStatusStyle[inv.status]
                      )}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(inv.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
