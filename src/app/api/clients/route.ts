import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientSchema } from "@/lib/schemas";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, slug, industry, status, monthly_retainer, website, notes } =
    parsed.data;

  const { data, error } = await supabase
    .from("mc_clients")
    .insert({
      name,
      slug,
      industry: industry ?? "other",
      status: status ?? "onboarding",
      monthly_retainer: monthly_retainer ?? 0,
      website: website || null,
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
