import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mc_clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
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

  const { name, slug, industry, status, monthly_retainer, website, notes } =
    body as {
      name?: string;
      slug?: string;
      industry?: string;
      status?: string;
      monthly_retainer?: number;
      website?: string;
      notes?: string;
    };

  if (!name || !slug) {
    return NextResponse.json(
      { error: "name and slug are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("mc_clients")
    .insert({
      name,
      slug,
      industry: industry ?? "other",
      status: status ?? "onboarding",
      monthly_retainer: monthly_retainer ?? 0,
      website: website ?? null,
      notes: notes ?? null,
      health_score: 50,
      onboarding_step: 1,
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
