import { createClient } from "@/lib/supabase/server";
import { SettingsPanel } from "@/components/settings/settings-panel";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

interface TeamMember {
  name: string;
  email: string;
  role: string;
  status: "active" | "pending";
}

async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("mc_users")
    .select("full_name, email, role, status")
    .order("full_name", { ascending: true });

  if (!data || data.length === 0) {
    // Fallback if mc_users table is empty or doesn't exist yet
    return [
      { name: "Admin", email: "admin@voxaris.io", role: "Owner", status: "active" },
      { name: "Operations", email: "ops@voxaris.io", role: "Admin", status: "active" },
    ];
  }

  return data.map((u: { full_name: string; email: string; role: string; status: string }) => ({
    name: u.full_name ?? "Unknown",
    email: u.email ?? "",
    role: u.role ?? "Member",
    status: (u.status === "active" ? "active" : "pending") as "active" | "pending",
  }));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SettingsPage() {
  const teamMembers = await getTeamMembers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Team management, API keys, and integration configuration.
        </p>
      </div>

      <SettingsPanel teamMembers={teamMembers} />
    </div>
  );
}
