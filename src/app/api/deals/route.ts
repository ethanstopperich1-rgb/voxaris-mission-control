import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
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
    } = body as {
      title?: string;
      client_id?: string;
      contact_id?: string;
      stage?: string;
      value?: number;
      monthly_value?: number;
      probability?: number;
      expected_close?: string;
      notes?: string;
    };

    if (!title || !client_id) {
      return NextResponse.json(
        { error: "title and client_id are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("mc_deals")
      .insert({
        title,
        client_id,
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
