import {
  Building2,
  Bot,
  Phone,
  KanbanSquare,
  Users,
  DollarSign,
  Megaphone,
  Rocket,
  Settings,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Core",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Clients", href: "/clients", icon: Building2 },
      { label: "Agent Hub", href: "/agents", icon: Bot },
      { label: "Call Center", href: "/calls", icon: Phone },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
      { label: "Contacts", href: "/contacts", icon: Users },
      { label: "Finance", href: "/finance", icon: DollarSign },
      { label: "Marketing", href: "/marketing", icon: Megaphone },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Deployments", href: "/deployments", icon: Rocket },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
] as const;

/** Flat list of all nav items for search / command palette. */
export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

// ---------------------------------------------------------------------------
// Call statuses
// ---------------------------------------------------------------------------

export const CALL_STATUSES = [
  "queued",
  "ringing",
  "in_progress",
  "completed",
  "failed",
  "no_answer",
  "busy",
  "voicemail",
] as const;

export type CallStatus = (typeof CALL_STATUSES)[number];

export const CALL_STATUS_COLORS: Record<CallStatus, string> = {
  queued: "text-zinc-400 bg-zinc-400/10",
  ringing: "text-amber-400 bg-amber-400/10",
  in_progress: "text-blue-400 bg-blue-400/10",
  completed: "text-emerald-400 bg-emerald-400/10",
  failed: "text-red-400 bg-red-400/10",
  no_answer: "text-zinc-500 bg-zinc-500/10",
  busy: "text-orange-400 bg-orange-400/10",
  voicemail: "text-violet-400 bg-violet-400/10",
};

// ---------------------------------------------------------------------------
// Platform colours
// ---------------------------------------------------------------------------

export const PLATFORM_COLORS: Record<string, string> = {
  vapi: "text-teal-400 bg-teal-400/10",
  tavus: "text-violet-400 bg-violet-400/10",
};

export const PLATFORM_DOT_COLORS: Record<string, string> = {
  vapi: "bg-teal-400",
  tavus: "bg-violet-400",
};

// ---------------------------------------------------------------------------
// Client statuses
// ---------------------------------------------------------------------------

export const CLIENT_STATUSES = [
  "active",
  "onboarding",
  "paused",
  "churned",
] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  active: "text-emerald-400 bg-emerald-400/10",
  onboarding: "text-amber-400 bg-amber-400/10",
  paused: "text-zinc-400 bg-zinc-400/10",
  churned: "text-red-400 bg-red-400/10",
};

export const CLIENT_STATUS_DOT_COLORS: Record<ClientStatus, string> = {
  active: "bg-emerald-400",
  onboarding: "bg-amber-400",
  paused: "bg-zinc-400",
  churned: "bg-red-400",
};

// ---------------------------------------------------------------------------
// Agent statuses
// ---------------------------------------------------------------------------

export const AGENT_STATUSES = [
  "active",
  "inactive",
  "development",
  "retired",
] as const;

export type AgentStatus = (typeof AGENT_STATUSES)[number];

export const AGENT_STATUS_COLORS: Record<AgentStatus, string> = {
  active: "text-emerald-400 bg-emerald-400/10",
  inactive: "text-zinc-400 bg-zinc-400/10",
  development: "text-amber-400 bg-amber-400/10",
  retired: "text-red-400 bg-red-400/10",
};

// ---------------------------------------------------------------------------
// Deal stages
// ---------------------------------------------------------------------------

export const DEAL_STAGES = [
  "prospect",
  "contacted",
  "demo",
  "proposal",
  "closed_won",
  "closed_lost",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  prospect: "Prospect",
  contacted: "Contacted",
  demo: "Demo",
  proposal: "Proposal",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export const DEAL_STAGE_COLORS: Record<DealStage, string> = {
  prospect: "text-zinc-400 bg-zinc-400/10",
  contacted: "text-blue-400 bg-blue-400/10",
  demo: "text-amber-400 bg-amber-400/10",
  proposal: "text-violet-400 bg-violet-400/10",
  closed_won: "text-emerald-400 bg-emerald-400/10",
  closed_lost: "text-red-400 bg-red-400/10",
};

// ---------------------------------------------------------------------------
// Invoice statuses
// ---------------------------------------------------------------------------

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: "text-zinc-400 bg-zinc-400/10",
  sent: "text-blue-400 bg-blue-400/10",
  paid: "text-emerald-400 bg-emerald-400/10",
  overdue: "text-red-400 bg-red-400/10",
  cancelled: "text-zinc-500 bg-zinc-500/10",
};

// ---------------------------------------------------------------------------
// Content statuses
// ---------------------------------------------------------------------------

export const CONTENT_STATUSES = [
  "draft",
  "scheduled",
  "published",
  "archived",
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_STATUS_COLORS: Record<ContentStatus, string> = {
  draft: "text-zinc-400 bg-zinc-400/10",
  scheduled: "text-amber-400 bg-amber-400/10",
  published: "text-emerald-400 bg-emerald-400/10",
  archived: "text-zinc-500 bg-zinc-500/10",
};

// ---------------------------------------------------------------------------
// Activity sources
// ---------------------------------------------------------------------------

export const ACTIVITY_SOURCE_COLORS: Record<string, string> = {
  vapi: "text-teal-400",
  tavus: "text-violet-400",
  apollo: "text-orange-400",
  ghl: "text-green-400",
  vercel: "text-zinc-300",
  manual: "text-zinc-500",
  system: "text-zinc-500",
  supabase: "text-emerald-400",
};

// ---------------------------------------------------------------------------
// Deployment statuses
// ---------------------------------------------------------------------------

export const DEPLOYMENT_STATUS_COLORS: Record<string, string> = {
  ready: "text-emerald-400 bg-emerald-400/10",
  building: "text-amber-400 bg-amber-400/10",
  error: "text-red-400 bg-red-400/10",
  queued: "text-zinc-400 bg-zinc-400/10",
  canceled: "text-zinc-500 bg-zinc-500/10",
};

// ---------------------------------------------------------------------------
// Sentiment
// ---------------------------------------------------------------------------

export const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-emerald-400",
  neutral: "text-zinc-400",
  negative: "text-red-400",
};

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/** Default page size for paginated lists. */
export const DEFAULT_PAGE_SIZE = 25;

/** Voxaris brand colours, matching the design system. */
export const BRAND = {
  gold: "#d4a843",
  void: "#07080a",
  emerald: "#34d399",
  rose: "#fb7185",
} as const;
