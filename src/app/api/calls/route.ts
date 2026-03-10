import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const platform = searchParams.get("platform");
    const clientId = searchParams.get("client_id");
    const agentId = searchParams.get("agent_id");
    const status = searchParams.get("status");

    // Pagination params
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10))
    );
    const offset = (page - 1) * limit;

    let query = supabase
      .from("mc_calls")
      .select(
        "*, agent:mc_agents(id, name, platform), client:mc_clients(id, name, slug)",
        { count: "exact" }
      )
      .order("started_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (platform && platform !== "all") {
      query = query.eq("platform", platform);
    }
    if (clientId) {
      query = query.eq("client_id", clientId);
    }
    if (agentId) {
      query = query.eq("agent_id", agentId);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        total_pages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
