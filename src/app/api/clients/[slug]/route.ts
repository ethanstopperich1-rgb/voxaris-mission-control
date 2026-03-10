import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from("mc_clients")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !client) {
    return NextResponse.json(
      { error: error?.message ?? "Client not found" },
      { status: error ? 500 : 404 }
    );
  }

  // Get agent count for this client
  const { count: agentCount } = await supabase
    .from("mc_agents")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id);

  return NextResponse.json({
    ...client,
    agent_count: agentCount ?? 0,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Only allow updating specific fields
  const allowedFields = [
    "name",
    "industry",
    "status",
    "monthly_retainer",
    "website",
    "notes",
    "health_score",
    "onboarding_step",
    "contract_start",
    "contract_end",
    "primary_color",
    "accent_color",
    "logo_url",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("mc_clients")
    .update(updates)
    .eq("slug", slug)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Client not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
