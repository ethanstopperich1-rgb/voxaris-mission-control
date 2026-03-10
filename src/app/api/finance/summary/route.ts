import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Current month boundaries in ISO format
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    // Total revenue this month: sum of paid invoices where period overlaps current month
    const { data: paidInvoices, error: invoiceError } = await supabase
      .from("mc_invoices")
      .select("amount, client_id")
      .eq("status", "paid")
      .gte("paid_date", monthStart)
      .lte("paid_date", monthEnd);

    if (invoiceError) {
      return NextResponse.json(
        { error: invoiceError.message },
        { status: 500 }
      );
    }

    const totalRevenue = (paidInvoices ?? []).reduce(
      (sum: number, inv: { amount: number | null; client_id: string | null }) =>
        sum + (inv.amount ?? 0),
      0
    );

    // Revenue grouped by client_id
    const revenueByClient: Record<string, number> = {};
    for (const inv of paidInvoices ?? []) {
      const cid = inv.client_id ?? "unknown";
      revenueByClient[cid] = (revenueByClient[cid] ?? 0) + (inv.amount ?? 0);
    }

    // Total costs this month
    const { data: costs, error: costsError } = await supabase
      .from("mc_costs")
      .select("amount")
      .eq("period_month", `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

    if (costsError) {
      return NextResponse.json(
        { error: costsError.message },
        { status: 500 }
      );
    }

    const totalCosts = (costs ?? []).reduce(
      (sum: number, c: { amount: number | null }) => sum + (c.amount ?? 0),
      0
    );

    // Outstanding (unpaid) invoices count
    const { count: invoicesOutstanding, error: outstandingError } =
      await supabase
        .from("mc_invoices")
        .select("id", { count: "exact", head: true })
        .in("status", ["sent", "overdue"]);

    if (outstandingError) {
      return NextResponse.json(
        { error: outstandingError.message },
        { status: 500 }
      );
    }

    // Enrich revenue_by_client with client names
    const clientIds = Object.keys(revenueByClient).filter(
      (id) => id !== "unknown"
    );
    let revenueByClientEnriched: Array<{
      client_id: string;
      client_name: string;
      revenue: number;
    }> = [];

    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from("mc_clients")
        .select("id, name")
        .in("id", clientIds);

      const clientMap = new Map<string, string>(
        (clients ?? []).map((c: { id: string; name: string }) => [c.id, c.name])
      );

      revenueByClientEnriched = Object.entries(revenueByClient).map(
        ([clientId, revenue]) => ({
          client_id: clientId,
          client_name: clientMap.get(clientId) ?? "Unknown",
          revenue,
        })
      );
    }

    return NextResponse.json({
      total_revenue: totalRevenue,
      total_costs: totalCosts,
      net_margin: totalRevenue - totalCosts,
      invoices_outstanding: invoicesOutstanding ?? 0,
      revenue_by_client: revenueByClientEnriched,
      period: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        start: monthStart,
        end: monthEnd,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
