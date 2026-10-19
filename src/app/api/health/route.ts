import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("mc_organizations").select("id").limit(1);
    checks.supabase = error ? `error: ${error.message}` : "ok";
    if (error) healthy = false;
  } catch {
    checks.supabase = "unreachable";
    healthy = false;
  }

  checks.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing";
  checks.supabase_anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "missing";
  checks.supabase_service = process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "missing";

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    healthy = false;
  }

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      checks,
    },
    { status: healthy ? 200 : 503 },
  );
}
