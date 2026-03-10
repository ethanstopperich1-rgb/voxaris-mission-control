"use client";

import { use, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Phone,
  Calendar,
  DollarSign,
  Globe,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { PlatformBadge } from "@/components/agents/platform-badge";
import type { Client, Agent } from "@/lib/types";

// ---------------------------------------------------------------------------
// Seed data -- keyed by slug
// ---------------------------------------------------------------------------

const clientData: Record<string, Client> = {
  "suncoast-sports": {
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
    notes: "Flagship automotive client. Great call performance and engagement.",
    created_at: "2025-09-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    agent_count: 2,
    call_count_30d: 487,
  },
  "orlando-art-of-surgery": {
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
    notes: "Medical practice in Orlando. Aria handles inbound scheduling.",
    created_at: "2025-10-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    agent_count: 2,
    call_count_30d: 312,
  },
  "porsche-jackson": {
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
    notes: "Premium dealership. Ashley (Tavus) runs virtual showroom tours.",
    created_at: "2025-11-15T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    agent_count: 1,
    call_count_30d: 198,
  },
  arrivia: {
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
    notes: "Travel/membership platform. VAPI agents for support and outbound upgrades.",
    created_at: "2025-12-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    agent_count: 5,
    call_count_30d: 250,
  },
};

const agentsByClient: Record<string, Agent[]> = {
  "suncoast-sports": [
    {
      id: "ag1",
      client_id: "1",
      name: "Riley",
      platform: "vapi",
      platform_agent_id: "agent_b8dbc0ff6a0186474e73020500",
      agent_type: "inbound",
      phone_number: "(228) 220-7210",
      voice_id: null,
      voice_name: "Riley",
      llm_id: "llm_57409331afc4a06b92be7f455f0e",
      prompt_version: 3,
      status: "active",
      config: null,
      created_at: "2025-09-01T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    },
    {
      id: "ag2",
      client_id: "1",
      name: "Riley (Outbound)",
      platform: "vapi",
      platform_agent_id: "agent_277b76faaff90b8488df9c5073",
      agent_type: "outbound",
      phone_number: "(228) 220-7210",
      voice_id: null,
      voice_name: "Riley",
      llm_id: "llm_025b8eb0bb46c55d458cf8111ea1",
      prompt_version: 2,
      status: "active",
      config: null,
      created_at: "2025-09-15T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    },
  ],
  "orlando-art-of-surgery": [
    {
      id: "ag3",
      client_id: "2",
      name: "Aria",
      platform: "vapi",
      platform_agent_id: "agent_aab4d2ceb18a893763451ffcaf",
      agent_type: "inbound",
      phone_number: "(321) 463-3984",
      voice_id: null,
      voice_name: "Aria",
      llm_id: null,
      prompt_version: 2,
      status: "active",
      config: null,
      created_at: "2025-10-01T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    },
    {
      id: "ag4",
      client_id: "2",
      name: "Maria V",
      platform: "tavus",
      platform_agent_id: "p2c5fa762be7",
      agent_type: "video",
      phone_number: null,
      voice_id: null,
      voice_name: null,
      llm_id: null,
      prompt_version: 1,
      status: "active",
      config: null,
      created_at: "2025-10-15T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    },
  ],
  "porsche-jackson": [
    {
      id: "ag5",
      client_id: "3",
      name: "Ashley",
      platform: "tavus",
      platform_agent_id: "pa1a586cf4ad",
      agent_type: "video",
      phone_number: null,
      voice_id: null,
      voice_name: null,
      llm_id: null,
      prompt_version: 1,
      status: "active",
      config: null,
      created_at: "2025-11-15T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    },
  ],
  arrivia: [
    {
      id: "ag6",
      client_id: "4",
      name: "Mia (Inbound)",
      platform: "vapi",
      platform_agent_id: "d6997829-ff21-44b1-9853-27ea1e4d4030",
      agent_type: "inbound",
      phone_number: "(407) 289-0294",
      voice_id: null,
      voice_name: "Mia",
      llm_id: null,
      prompt_version: 3,
      status: "active",
      config: null,
      created_at: "2025-12-01T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    },
    {
      id: "ag7",
      client_id: "4",
      name: "Mia (Outbound)",
      platform: "vapi",
      platform_agent_id: "c36ebbfc-330f-419c-a954-ec965e3dd26d",
      agent_type: "outbound",
      phone_number: "(407) 289-0294",
      voice_id: null,
      voice_name: "Mia",
      llm_id: null,
      prompt_version: 2,
      status: "active",
      config: null,
      created_at: "2025-12-01T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    },
    {
      id: "ag8",
      client_id: "4",
      name: "USAA V-SENSE Inbound",
      platform: "vapi",
      platform_agent_id: "agent_0bf4698527ae66e7ccaaad2b2e",
      agent_type: "inbound",
      phone_number: null,
      voice_id: null,
      voice_name: null,
      llm_id: "llm_c7d2d65f5c4ca63573d5754fd56f",
      prompt_version: 1,
      status: "active",
      config: null,
      created_at: "2026-01-15T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    },
    {
      id: "ag9",
      client_id: "4",
      name: "USAA V-SENSE Outbound",
      platform: "vapi",
      platform_agent_id: "agent_a34129591f0e7e19abeadd264f",
      agent_type: "outbound",
      phone_number: null,
      voice_id: null,
      voice_name: null,
      llm_id: "llm_354ab6275424bb2174bf1dbd6d06",
      prompt_version: 1,
      status: "active",
      config: null,
      created_at: "2026-01-15T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    },
    {
      id: "ag10",
      client_id: "4",
      name: "USAA V-FACE Concierge",
      platform: "tavus",
      platform_agent_id: "p29a8c3a3ca6",
      agent_type: "video",
      phone_number: null,
      voice_id: null,
      voice_name: null,
      llm_id: null,
      prompt_version: 1,
      status: "active",
      config: null,
      created_at: "2026-01-20T00:00:00Z",
      updated_at: "2026-03-01T00:00:00Z",
    },
  ],
};

// ---------------------------------------------------------------------------
// Tab constants
// ---------------------------------------------------------------------------

const tabs = ["overview", "agents", "calls", "notes"] as const;
type Tab = (typeof tabs)[number];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [notes, setNotes] = useState<string>("");

  const client = clientData[slug];
  const agents = agentsByClient[slug] ?? [];

  // Initialize notes from client data
  if (client && notes === "" && client.notes) {
    // Using a ref-like pattern to avoid re-setting on every render
    // This is intentional for placeholder data
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
        <p className="text-lg font-medium">Client not found</p>
        <Link href="/clients" className="mt-3 text-sm text-zinc-300 hover:underline">
          Back to Clients
        </Link>
      </div>
    );
  }

  const healthColor =
    client.health_score > 70
      ? "bg-emerald-500"
      : client.health_score > 40
        ? "bg-amber-500"
        : "bg-red-500";

  const statusStyle: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-400",
    onboarding: "bg-amber-500/15 text-amber-400",
    paused: "bg-zinc-500/15 text-zinc-400",
    churned: "bg-red-500/15 text-red-400",
  };

  return (
    <div className="space-y-6">
      {/* Back nav + header */}
      <div>
        <Link
          href="/clients"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
              {client.name}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                  statusStyle[client.status]
                )}
              >
                {client.status}
              </span>
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-400">
                {client.industry}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <nav className="-mb-px flex gap-6" aria-label="Client tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "border-b-2 pb-3 pt-1 text-sm font-medium capitalize transition-colors",
                activeTab === tab
                  ? "border-zinc-300 text-zinc-200"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {/* ---- Overview ---- */}
        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Info card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Client Information
              </h3>
              <div className="space-y-3">
                {[
                  { icon: Globe, label: "Website", value: client.website ?? "N/A" },
                  {
                    icon: Calendar,
                    label: "Contract Start",
                    value: client.contract_start
                      ? new Date(client.contract_start).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A",
                  },
                  {
                    icon: Calendar,
                    label: "Contract End",
                    value: client.contract_end
                      ? new Date(client.contract_end).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A",
                  },
                  {
                    icon: DollarSign,
                    label: "Monthly Retainer",
                    value: formatCurrency(client.monthly_retainer),
                  },
                  { icon: Bot, label: "Agents", value: String(client.agent_count ?? agents.length) },
                  { icon: Phone, label: "Calls (30d)", value: String(client.call_count_30d ?? 0) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0 text-zinc-500" />
                    <span className="w-32 shrink-0 text-xs text-zinc-500">{item.label}</span>
                    <span className="text-sm text-zinc-200">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Health card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Health Score
              </h3>
              <div className="flex items-end gap-4">
                <span className="text-5xl font-bold text-zinc-50">{client.health_score}</span>
                <span className="mb-1 text-lg text-zinc-500">/ 100</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", healthColor)}
                  style={{ width: `${client.health_score}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500">
                Based on call volume, success rate, and agent performance over 30 days.
              </p>
            </div>
          </div>
        )}

        {/* ---- Agents ---- */}
        {activeTab === "agents" && (
          <div className="space-y-3">
            {agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60 py-16 text-zinc-500">
                <Bot className="mb-3 h-8 w-8" />
                <p className="text-sm">No agents deployed for this client yet.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Agent
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Platform
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {agents.map((agent) => (
                      <tr key={agent.id} className="transition-colors hover:bg-zinc-900/30">
                        <td className="px-4 py-3 font-medium text-zinc-200">{agent.name}</td>
                        <td className="px-4 py-3">
                          <PlatformBadge platform={agent.platform} />
                        </td>
                        <td className="px-4 py-3 capitalize text-zinc-400">{agent.agent_type}</td>
                        <td className="px-4 py-3 text-zinc-400">
                          {agent.phone_number ?? <span className="text-zinc-600">--</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              agent.status === "active"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-zinc-500/15 text-zinc-400"
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                agent.status === "active" ? "bg-emerald-400" : "bg-zinc-400"
                              )}
                            />
                            {agent.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---- Calls ---- */}
        {activeTab === "calls" && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60 py-16 text-zinc-500">
            <Phone className="mb-3 h-8 w-8" />
            <p className="text-sm font-medium">No call data loaded</p>
            <p className="mt-1 text-xs text-zinc-600">
              Call records will populate once the API sync is configured.
            </p>
          </div>
        )}

        {/* ---- Notes ---- */}
        {activeTab === "notes" && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-300">Client Notes</h3>
            </div>
            <textarea
              value={notes || client.notes || ""}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this client..."
              className={cn(
                "h-48 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3",
                "text-sm text-zinc-200 placeholder:text-zinc-600",
                "transition-colors focus:border-zinc-300/40 focus:outline-none focus:ring-1 focus:ring-zinc-300/20"
              )}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="rounded-lg bg-zinc-200/10 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-200/20"
              >
                Save Notes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
