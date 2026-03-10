import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { agentSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const platform = searchParams.get("platform");
  const status = searchParams.get("status");
  const clientId = searchParams.get("client_id");

  // Pagination params
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    200,
    Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10))
  );
  const offset = (page - 1) * limit;

  let query = supabase
    .from("mc_agents")
    .select("*, client:mc_clients(id, name, slug)", { count: "exact" })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (platform && platform !== "all") {
    query = query.eq("platform", platform);
  }
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (clientId) {
    query = query.eq("client_id", clientId);
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
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = agentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const {
    client_id,
    name,
    platform,
    platform_agent_id,
    agent_type,
    phone_number,
    voice_id,
    voice_name,
    llm_id,
    status,
  } = parsed.data;

  const { data, error } = await supabase
    .from("mc_agents")
    .insert({
      client_id: client_id ?? null,
      name,
      platform,
      platform_agent_id,
      agent_type: agent_type ?? "inbound",
      phone_number: phone_number ?? null,
      voice_id: voice_id ?? null,
      voice_name: voice_name ?? null,
      llm_id: llm_id ?? null,
      status: status ?? "active",
      prompt_version: 1,
      config: null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
