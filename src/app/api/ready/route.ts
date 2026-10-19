import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** Kubernetes-style readiness probe. Returns 200 only if the app can serve traffic. */
export async function GET() {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("mc_organizations").select("id").limit(1);
    if (error) {
      return NextResponse.json({ ready: false, error: error.message }, { status: 503 });
    }
    return NextResponse.json({ ready: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ready: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 503 },
    );
  }
}
