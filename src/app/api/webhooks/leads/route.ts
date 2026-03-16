import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { leadService } from "@/server/services";
import { leadIngestSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

/**
 * Generic Lead Ingest Webhook
 * POST /api/webhooks/leads?org_id=<uuid>
 *
 * Accepts lead data from any external source (forms, ad platforms, partners).
 * Deduplicates by email, phone, or external_id within the org.
 * Stores raw payload for debugging/replay.
 *
 * Auth: optional LEADS_WEBHOOK_SECRET env var checked against x-webhook-secret header.
 * Org routing: org_id query param, or resolved from workspace_slug/client_slug in body.
 */
export async function POST(req: Request) {
  // --- Authenticate ---
  const webhookSecret = process.env.LEADS_WEBHOOK_SECRET;
  if (webhookSecret) {
    const provided = req.headers.get("x-webhook-secret");
    if (provided !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // --- Parse body ---
  let rawPayload: unknown;
  try {
    rawPayload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = leadIngestSchema.safeParse(rawPayload);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return NextResponse.json({ error: `Validation: ${issues}` }, { status: 422 });
  }

  const data = parsed.data;
  const supabase = createServiceClient();

  // --- Resolve org ---
  const url = new URL(req.url);
  let orgId: string | null = url.searchParams.get("org_id");

  if (!orgId) {
    // Try resolving from client_slug or workspace_slug in body
    if (data.client_slug) {
      const { data: client } = await supabase
        .from("mc_clients")
        .select("organization_id")
        .eq("slug", data.client_slug)
        .limit(1)
        .single();
      orgId = client?.organization_id ?? null;
    } else if (data.workspace_slug) {
      const { data: ws } = await supabase
        .from("mc_workspaces")
        .select("organization_id")
        .eq("slug", data.workspace_slug)
        .limit(1)
        .single();
      orgId = ws?.organization_id ?? null;
    }
  }

  if (!orgId) {
    return NextResponse.json(
      {
        error:
          "Cannot resolve organization. Provide org_id query param or valid client_slug/workspace_slug in body.",
      },
      { status: 400 },
    );
  }

  // --- Store raw payload ---
  await supabase.from("mc_webhook_payloads").insert({
    provider: "leads",
    event_type: "lead.ingest",
    payload: rawPayload,
    headers: Object.fromEntries(req.headers.entries()),
    status: "received",
  });

  // --- Ingest via service (handles dedup + audit) ---
  try {
    const result = await leadService.ingest(orgId, data);
    return NextResponse.json(
      { received: true, created: result.created, lead_id: result.lead.id },
      { status: result.created ? 201 : 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    console.error("[Leads Webhook] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
