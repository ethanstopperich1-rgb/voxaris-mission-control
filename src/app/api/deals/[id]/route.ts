import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("mc_deals")
      .select(
        "*, contact:mc_contacts(id, first_name, last_name, email, phone, company), client:mc_clients(id, name, slug)"
      )
      .eq("id", id)
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return NextResponse.json(
        { error: status === 404 ? "Deal not found" : error.message },
        { status }
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const allowedFields = [
      "title",
      "contact_id",
      "client_id",
      "stage",
      "value",
      "monthly_value",
      "probability",
      "expected_close",
      "notes",
      "closed_at",
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

    // Auto-set closed_at when stage changes to a closed state
    if (
      updates.stage === "closed_won" ||
      updates.stage === "closed_lost"
    ) {
      if (!updates.closed_at) {
        updates.closed_at = new Date().toISOString();
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("mc_deals")
      .update(updates)
      .eq("id", id)
      .select(
        "*, contact:mc_contacts(id, first_name, last_name, company), client:mc_clients(id, name, slug)"
      )
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return NextResponse.json(
        { error: status === 404 ? "Deal not found" : error.message },
        { status }
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
