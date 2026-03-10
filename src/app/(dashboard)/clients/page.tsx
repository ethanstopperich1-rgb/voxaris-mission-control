"use client";

import { UserPlus } from "lucide-react";
import { ClientCard } from "@/components/clients/client-card";
import type { Client } from "@/lib/types";

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const clients: Client[] = [
  {
    id: "1",
    slug: "suncoast-sports",
    name: "Suncoast Sports",
    industry: "automotive",
    logo_url: null,
    primary_color: "#1e40af",
    accent_color: "#fbbf24",
    website: "https://suncoastsports.com",
    status: "active",
    onboarding_step: 5,
    health_score: 92,
    contract_start: "2025-09-01",
    contract_end: "2026-08-31",
    monthly_retainer: 5000,
    notes: "Flagship automotive client. 2 VAPI agents deployed.",
    created_at: "2025-09-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    agent_count: 2,
    call_count_30d: 487,
  },
  {
    id: "2",
    slug: "orlando-art-of-surgery",
    name: "Orlando Art of Surgery",
    industry: "medical",
    logo_url: null,
    primary_color: "#be185d",
    accent_color: "#f9a8d4",
    website: "https://orlandoartofsurgery.com",
    status: "active",
    onboarding_step: 5,
    health_score: 88,
    contract_start: "2025-10-01",
    contract_end: "2026-09-30",
    monthly_retainer: 4500,
    notes: "Medical practice. 1 VAPI voice + 1 Tavus video agent.",
    created_at: "2025-10-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    agent_count: 2,
    call_count_30d: 312,
  },
  {
    id: "3",
    slug: "porsche-jackson",
    name: "Porsche Jackson",
    industry: "automotive",
    logo_url: null,
    primary_color: "#000000",
    accent_color: "#e4e4e7",
    website: "https://porschejackson.com",
    status: "active",
    onboarding_step: 5,
    health_score: 76,
    contract_start: "2025-11-15",
    contract_end: "2026-11-14",
    monthly_retainer: 5000,
    notes: "Premium automotive. Tavus video agent for virtual showroom.",
    created_at: "2025-11-15T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    agent_count: 1,
    call_count_30d: 198,
  },
  {
    id: "4",
    slug: "arrivia",
    name: "Arrivia",
    industry: "travel",
    logo_url: null,
    primary_color: "#d97706",
    accent_color: "#fde68a",
    website: "https://arrivia.com",
    status: "active",
    onboarding_step: 5,
    health_score: 85,
    contract_start: "2025-12-01",
    contract_end: "2026-11-30",
    monthly_retainer: 4000,
    notes: "Travel/membership. VAPI agents for support and USAA demos.",
    created_at: "2025-12-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    agent_count: 5,
    call_count_30d: 250,
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Clients</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your client portfolio and monitor account health.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-zinc-200/20 transition-all hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/50"
        >
          <UserPlus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Client Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>
    </div>
  );
}
