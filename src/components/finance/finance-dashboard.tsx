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
// Types
// ---------------------------------------------------------------------------

interface InvoiceRow {
  id: string;
  invoice_number: string;
  client_name: string;
  amount: number;
  status: string;
  due_date: string;
}

interface RevenueByClient {
  name: string;
  revenue: number;
  color: string;
}

interface CostByPlatform {
  name: string;
  value: number;
  color: string;
}

interface FinanceDashboardProps {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  avgRevenuePerClient: number;
  revenueByClient: RevenueByClient[];
  costBreakdown: CostByPlatform[];
  invoices: InvoiceRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const invoiceStatusStyle: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-400",
  sent: "bg-blue-500/15 text-blue-400",
  overdue: "bg-red-500/15 text-red-400",
  draft: "bg-zinc-500/15 text-zinc-400",
  cancelled: "bg-zinc-500/15 text-zinc-500",
};

const platformColors: Record<string, string> = {
  vapi: "#14b8a6",
  tavus: "#8b5cf6",
  vercel: "#6b7280",
  supabase: "#22c55e",
  other: "#f59e0b",
};

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
// Component
// ---------------------------------------------------------------------------

export function FinanceDashboard({
  totalRevenue,
  totalCosts,
  netProfit,
  avgRevenuePerClient,
  revenueByClient,
  costBreakdown,
  invoices,
}: FinanceDashboardProps) {
  const financeKpis = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-zinc-200",
      bg: "bg-zinc-200/10",
      border: "border-zinc-300/20",
      glow: true,
    },
    {
      label: "Total Costs",
      value: formatCurrency(totalCosts),
      icon: TrendingDown,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      label: "Net Profit",
      value: formatCurrency(netProfit),
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      glow: true,
    },
    {
      label: "Avg Revenue/Client",
      value: formatCurrency(avgRevenuePerClient),
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
  ];

  return (
    <>
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {financeKpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} delay={i * 80} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Client */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-6 transition-colors duration-200 hover:border-zinc-700">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Revenue by Client
          </h3>
          <div className="h-64">
            {revenueByClient.length > 0 ? (
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
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                No revenue data
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-6 transition-colors duration-200 hover:border-zinc-700">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Cost Breakdown by Platform
          </h3>
          <div className="h-64">
            {costBreakdown.length > 0 ? (
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
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                No cost data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice table */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Invoices
        </h3>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80">
              <tr>
                {["Invoice", "Client", "Amount", "Status", "Due Date"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="transition-colors duration-150 hover:bg-zinc-900/40">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400 whitespace-nowrap">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">{inv.client_name}</td>
                    <td className="px-4 py-3 font-medium text-zinc-200">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          invoiceStatusStyle[inv.status] ?? "bg-zinc-500/15 text-zinc-400"
                        )}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                      {new Date(inv.due_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
