"use client";

import {
  Users,
  Key,
  Puzzle,
  Plus,
  ExternalLink,
  Shield,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface TeamMember {
  name: string;
  email: string;
  role: string;
  status: "active" | "pending";
}

interface SettingsPanelProps {
  teamMembers: TeamMember[];
}

/* -------------------------------------------------------------------------- */
/*  Static data (API keys & integrations are config, not DB-driven)           */
/* -------------------------------------------------------------------------- */

const API_KEYS = [
  {
    name: "VAPI",
    envVar: "VAPI_API_KEY",
    connected: true,
    maskedKey: "vapi_****...9d1c",
  },
  {
    name: "Tavus",
    envVar: "TAVUS_API_KEY",
    connected: true,
    maskedKey: "tvs_****...2e8b",
  },
  {
    name: "Supabase",
    envVar: "NEXT_PUBLIC_SUPABASE_URL",
    connected: true,
    maskedKey: "https://****...supabase.co",
  },
  {
    name: "Vercel",
    envVar: "VERCEL_TOKEN",
    connected: false,
    maskedKey: null,
  },
];

const INTEGRATIONS = [
  {
    name: "Apollo.io",
    description: "Lead enrichment and contact discovery",
    status: "connected" as const,
    category: "Data",
  },
  {
    name: "GoHighLevel",
    description: "CRM and marketing automation",
    status: "connected" as const,
    category: "CRM",
  },
  {
    name: "Vercel",
    description: "Deployment and hosting platform",
    status: "disconnected" as const,
    category: "DevOps",
  },
  {
    name: "Twilio",
    description: "SMS and voice communications",
    status: "connected" as const,
    category: "Comms",
  },
  {
    name: "Stripe",
    description: "Payment processing and billing",
    status: "disconnected" as const,
    category: "Finance",
  },
  {
    name: "Slack",
    description: "Team notifications and alerts",
    status: "connected" as const,
    category: "Comms",
  },
];

/* -------------------------------------------------------------------------- */
/*  Status dot component                                                      */
/* -------------------------------------------------------------------------- */

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
          active ? "bg-emerald-400" : "bg-zinc-600"
        }`}
      />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function SettingsPanel({ teamMembers }: SettingsPanelProps) {
  return (
    <Tabs defaultValue="team" className="space-y-6">
      <TabsList className="w-full overflow-x-auto bg-zinc-900/60 border border-zinc-800 sm:w-auto">
        <TabsTrigger
          value="team"
          className="gap-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50"
        >
          <Users size={14} />
          Team
        </TabsTrigger>
        <TabsTrigger
          value="api-keys"
          className="gap-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50"
        >
          <Key size={14} />
          API Keys
        </TabsTrigger>
        <TabsTrigger
          value="integrations"
          className="gap-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50"
        >
          <Puzzle size={14} />
          Integrations
        </TabsTrigger>
      </TabsList>

      {/* ---------------------------------------------------------------- */}
      {/*  TEAM TAB                                                        */}
      {/* ---------------------------------------------------------------- */}
      <TabsContent value="team" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">
              Team Members
            </h2>
            <p className="text-xs text-zinc-500">
              Manage who has access to Mission Control.
            </p>
          </div>
          <Button size="sm" className="gap-1.5">
            <Plus size={14} />
            Invite
          </Button>
        </div>

        <Card className="border-zinc-800 bg-zinc-950/60">
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800/60">
              {teamMembers.map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between px-4 py-4 sm:px-5 transition-colors duration-150 hover:bg-zinc-900/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar placeholder */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 ml-3">
                    <Badge
                      variant={
                        member.status === "active" ? "secondary" : "outline"
                      }
                      className={
                        member.status === "pending"
                          ? "border-zinc-700 text-zinc-500"
                          : ""
                      }
                    >
                      {member.status === "active" ? member.role : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ---------------------------------------------------------------- */}
      {/*  API KEYS TAB                                                    */}
      {/* ---------------------------------------------------------------- */}
      <TabsContent value="api-keys" className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">
            API Keys &amp; Credentials
          </h2>
          <p className="text-xs text-zinc-500">
            Environment variables powering your integrations. Keys are stored
            securely and never exposed in the browser.
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-950/60">
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800/60">
              {API_KEYS.map((key) => (
                <div
                  key={key.envVar}
                  className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 transition-colors duration-150 hover:bg-zinc-900/30"
                >
                  <div className="flex items-center gap-3">
                    <StatusDot active={key.connected} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200">
                        {key.name}
                      </p>
                      <p className="truncate font-mono text-[11px] text-zinc-600">
                        {key.envVar}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-5 sm:pl-0">
                    {key.maskedKey ? (
                      <code className="truncate rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 font-mono text-[11px] text-zinc-400">
                        {key.maskedKey}
                      </code>
                    ) : (
                      <span className="text-xs text-zinc-600">
                        Not configured
                      </span>
                    )}

                    {key.connected ? (
                      <Badge variant="secondary" className="shrink-0 text-emerald-400">
                        Connected
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-zinc-700 text-zinc-500"
                      >
                        Missing
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-4 py-3">
          <Shield size={14} className="shrink-0 text-zinc-400" />
          <p className="text-xs text-zinc-500">
            API keys are managed via environment variables in your Vercel
            project settings. They are never stored in the database or exposed
            to the client.
          </p>
        </div>
      </TabsContent>

      {/* ---------------------------------------------------------------- */}
      {/*  INTEGRATIONS TAB                                                */}
      {/* ---------------------------------------------------------------- */}
      <TabsContent value="integrations" className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">
            Connected Services
          </h2>
          <p className="text-xs text-zinc-500">
            Third-party platforms integrated with Mission Control.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((integration) => (
            <Card
              key={integration.name}
              className="border-zinc-800 bg-zinc-950/60 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-950/80 hover:shadow-lg hover:shadow-black/20"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-zinc-200">
                    {integration.name}
                  </CardTitle>
                  <StatusDot
                    active={integration.status === "connected"}
                  />
                </div>
                <CardDescription className="text-xs">
                  {integration.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className="text-[10px] uppercase tracking-wide"
                  >
                    {integration.category}
                  </Badge>
                  {integration.status === "connected" ? (
                    <span className="text-xs font-medium text-emerald-400">
                      Active
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Connect
                      <ExternalLink size={12} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
