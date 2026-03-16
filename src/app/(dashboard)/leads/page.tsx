import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserPlus, Search, Filter } from "lucide-react";

const statusColors: Record<string, string> = {
  new: "text-blue-400 bg-blue-400/10",
  contacted: "text-amber-400 bg-amber-400/10",
  qualified: "text-emerald-400 bg-emerald-400/10",
  nurturing: "text-violet-400 bg-violet-400/10",
  converted: "text-emerald-500 bg-emerald-500/10",
  lost: "text-red-400 bg-red-400/10",
  disqualified: "text-zinc-400 bg-zinc-400/10",
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface LeadsPageProps {
  searchParams: Promise<{ status?: string; source?: string; page?: string }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const params = await searchParams;
  const supabase = await createClient();
  const page = Number(params.page) || 1;
  const pageSize = 25;
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("mc_leads")
    .select("*", { count: "exact" })
    .eq("organization_id", session.organizationId)
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (params.status) query = query.eq("status", params.status);
  if (params.source) query = query.eq("source", params.source);

  const { data: leads, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Leads</h1>
          <p className="text-sm text-zinc-500">{count ?? 0} total leads</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
            <Search size={14} className="text-zinc-500" />
            <span className="text-xs text-zinc-500">Search leads...</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
            <Filter size={14} className="text-zinc-500" />
            <span className="text-xs text-zinc-500">Filter</span>
          </div>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {["all", "new", "contacted", "qualified", "nurturing", "converted", "lost"].map((s) => {
          const isActive = s === "all" ? !params.status : params.status === s;
          const href = s === "all" ? "/leads" : `/leads?status=${s}`;
          return (
            <Link
              key={s}
              href={href}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "bg-zinc-200 text-zinc-900"
                  : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300",
              )}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          );
        })}
      </div>

      {/* Leads Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
        {!leads || leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserPlus size={32} className="mb-3 text-zinc-600" />
            <p className="text-sm text-zinc-400">No leads found</p>
            <p className="mt-1 text-xs text-zinc-600">
              Ingest leads via POST /api/webhooks/leads or create manually
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Name</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Contact</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Source</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Score</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">GHL</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {leads.map((lead: Record<string, unknown>) => (
                <tr key={lead.id as string} className="row-hover cursor-pointer" onClick={() => window.location.href = `/leads/${lead.id as string}`}>
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id as string}`} className="font-medium text-zinc-200 hover:text-white">
                      {(lead.first_name as string) ?? ""} {(lead.last_name as string) ?? ""}
                    </Link>
                    {typeof lead.company === "string" && lead.company && (
                      <span className="ml-2 text-xs text-zinc-500">{lead.company}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {(lead.email as string) ?? (lead.phone as string) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {(lead.source as string) ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusColors[(lead.status as string) ?? "new"])}>
                      {(lead.status as string) ?? "new"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {(lead.score as number) ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    {lead.ghl_contact_id ? (
                      <span className="rounded-full bg-green-400/10 px-2 py-0.5 text-[10px] font-medium text-green-400">synced</span>
                    ) : (
                      <span className="text-[10px] text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {timeAgo(lead.created_at as string)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/leads?page=${p}${params.status ? `&status=${params.status}` : ""}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                p === page ? "bg-zinc-200 text-zinc-900" : "text-zinc-400 hover:bg-zinc-800",
              )}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
