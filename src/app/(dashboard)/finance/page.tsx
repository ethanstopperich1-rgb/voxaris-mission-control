import { createClient } from "@/lib/supabase/server";
import { FinanceDashboard } from "@/components/finance/finance-dashboard";

// ---------------------------------------------------------------------------
// Chart color palette for clients
// ---------------------------------------------------------------------------

const clientColors = [
  "#3b82f6", "#ec4899", "#e4e4e7", "#f59e0b",
  "#14b8a6", "#8b5cf6", "#ef4444", "#22c55e",
];

const platformColors: Record<string, string> = {
  vapi: "#14b8a6",
  tavus: "#8b5cf6",
  vercel: "#6b7280",
  supabase: "#22c55e",
  other: "#f59e0b",
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getFinanceData() {
  const supabase = await createClient();

  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const [clientsRes, invoicesRes, costsRes] = await Promise.all([
    supabase
      .from("mc_clients")
      .select("id, name, monthly_retainer, status")
      .order("name", { ascending: true }),
    supabase
      .from("mc_invoices")
      .select("*, mc_clients(name)")
      .order("due_date", { ascending: false })
      .limit(50),
    supabase
      .from("mc_costs")
      .select("platform, amount")
      .eq("period_month", currentMonth),
  ]);

  const clients = (clientsRes.data ?? []) as Array<{
    id: string;
    name: string;
    monthly_retainer: number;
    status: string;
  }>;

  const rawInvoices = (invoicesRes.data ?? []) as Array<{
    id: string;
    invoice_number: string;
    amount: number;
    status: string;
    due_date: string;
    mc_clients?: { name: string } | null;
  }>;

  const costs = (costsRes.data ?? []) as Array<{
    platform: string;
    amount: number;
  }>;

  // Revenue: sum of active client retainers
  const activeClients = clients.filter((c) => c.status === "active");
  const totalRevenue = activeClients.reduce((sum, c) => sum + c.monthly_retainer, 0);

  // Costs: sum from mc_costs for current month
  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);

  const netProfit = totalRevenue - totalCosts;
  const avgRevenuePerClient =
    activeClients.length > 0 ? Math.round(totalRevenue / activeClients.length) : 0;

  // Revenue by client chart data
  const revenueByClient = activeClients.map((c, i) => ({
    name: c.name.length > 15 ? c.name.slice(0, 15) + "..." : c.name,
    revenue: c.monthly_retainer,
    color: clientColors[i % clientColors.length],
  }));

  // Cost breakdown by platform
  const costByPlatform: Record<string, number> = {};
  for (const cost of costs) {
    const key = cost.platform ?? "other";
    costByPlatform[key] = (costByPlatform[key] ?? 0) + cost.amount;
  }
  const costBreakdown = Object.entries(costByPlatform).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: platformColors[name] ?? platformColors.other,
  }));

  // Invoice rows
  const invoices = rawInvoices.map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    client_name: inv.mc_clients?.name ?? "Unknown",
    amount: inv.amount,
    status: inv.status,
    due_date: inv.due_date,
  }));

  return {
    totalRevenue,
    totalCosts,
    netProfit,
    avgRevenuePerClient,
    revenueByClient,
    costBreakdown,
    invoices,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function FinancePage() {
  const data = await getFinanceData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Finance</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Revenue, costs, and profitability tracking.
        </p>
      </div>

      <FinanceDashboard {...data} />
    </div>
  );
}
