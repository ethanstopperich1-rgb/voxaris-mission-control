import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dealSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("mc_deals")
      .select(
        "*, contact:mc_contacts(id, first_name, last_name, company), client:mc_clients(id, name, slug)"
      )
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const parsed = dealSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      title,
      client_id,
      contact_id,
      stage,
      value,
      monthly_value,
      probability,
      expected_close,
      notes,
    } = parsed.data;

    const { data, error } = await supabase
      .from("mc_deals")
      .insert({
        title,
        client_id: client_id ?? null,
        contact_id: contact_id ?? null,
        stage: stage ?? "prospect",
        value: value ?? 0,
        monthly_value: monthly_value ?? 0,
        probability: probability ?? 0,
        expected_close: expected_close ?? null,
        notes: notes ?? null,
      })
      .select(
        "*, contact:mc_contacts(id, first_name, last_name, company), client:mc_clients(id, name, slug)"
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
