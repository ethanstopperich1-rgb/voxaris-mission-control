import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { parseGHLWebhook } from "@/lib/integrations/ghl";

export const dynamic = "force-dynamic";

/**
 * GHL Webhook Receiver — idempotent, stores raw payload, normalizes event.
 * POST /api/webhooks/ghl
 */
export async function POST(req: Request) {
  const supabase = createServiceClient();
  let rawPayload: unknown;

  try {
    rawPayload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = parseGHLWebhook(rawPayload);
  if (!event) {
    return NextResponse.json({ error: "Unrecognized webhook format" }, { status: 400 });
  }

  // Store raw webhook payload for debugging/replay
  const { error: rawError } = await supabase.from("mc_webhook_payloads").insert({
    provider: "ghl",
    event_type: event.type,
    payload: rawPayload,
    headers: Object.fromEntries(req.headers.entries()),
    status: "received",
  });

  // If the raw payload table doesn't exist yet (pre-migration), log but continue
  if (rawError) {
    console.warn("[GHL Webhook] Could not store raw payload:", rawError.message);
  }

  // Find workspace by GHL location ID
  const { data: credentials } = await supabase
    .from("mc_ghl_credentials")
    .select("organization_id, workspace_id")
    .eq("location_id", event.locationId)
    .limit(1)
    .single();

  const orgId = credentials?.organization_id;
  const workspaceId = credentials?.workspace_id;

  // Process based on event type
  try {
    switch (event.type) {
      case "ContactCreate":
      case "ContactUpdate":
      case "contact.create":
      case "contact.update": {
        if (!orgId) break;
        const contact = event.payload.contact ?? event.payload;
        const c = contact as Record<string, unknown>;
        const ghlContactId = (event.contactId ?? c.id) as string | undefined;
        const firstName = (c.firstName ?? c.first_name ?? null) as string | null;
        const lastName = (c.lastName ?? c.last_name ?? null) as string | null;
        const email = (c.email ?? null) as string | null;
        const phone = (c.phone ?? null) as string | null;
        const company = (c.companyName ?? c.company ?? null) as string | null;
        const tags = Array.isArray(c.tags) ? (c.tags as string[]) : [];

        // Upsert lead
        const { data: existingLead } = await supabase
          .from("mc_leads")
          .select("id, metadata")
          .eq("organization_id", orgId)
          .eq("ghl_contact_id", ghlContactId ?? "")
          .limit(1)
          .single();

        if (existingLead) {
          await supabase
            .from("mc_leads")
            .update({
              first_name: firstName,
              last_name: lastName,
              email,
              phone,
              company,
              tags: tags.length > 0 ? tags : undefined,
              metadata: { ...(existingLead.metadata ?? {}), ghl_synced: true, ghl_event: event.type },
            })
            .eq("id", existingLead.id);
        } else {
          await supabase.from("mc_leads").insert({
            organization_id: orgId,
            workspace_id: workspaceId,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            company,
            tags,
            ghl_contact_id: ghlContactId,
            source: "ghl_webhook",
            status: "new",
            metadata: { ghl_synced: true, ghl_event: event.type },
          });
        }

        // Sync to mc_contacts (CRM layer)
        if (ghlContactId) {
          const { data: existingContact } = await supabase
            .from("mc_contacts")
            .select("id")
            .eq("ghl_contact_id", ghlContactId)
            .limit(1)
            .single();

          if (existingContact) {
            await supabase
              .from("mc_contacts")
              .update({ first_name: firstName, last_name: lastName, email, phone, company, tags })
              .eq("id", existingContact.id);
          } else {
            await supabase.from("mc_contacts").insert({
              organization_id: orgId,
              first_name: firstName,
              last_name: lastName,
              email,
              phone,
              company,
              source: "ghl",
              tags,
              ghl_contact_id: ghlContactId,
              metadata: { ghl_synced: true, ghl_event: event.type },
            });
          }
        }
        break;
      }

      case "OpportunityCreate":
      case "OpportunityUpdate":
      case "opportunity.create":
      case "opportunity.update": {
        // Store GHL opportunity ID on the lead if we can find the contact
        if (!orgId || !event.contactId) break;
        const { data: lead } = await supabase
          .from("mc_leads")
          .select("id")
          .eq("organization_id", orgId)
          .eq("ghl_contact_id", event.contactId)
          .limit(1)
          .single();

        if (lead && event.opportunityId) {
          await supabase
            .from("mc_leads")
            .update({
              metadata: { ghl_opportunity_id: event.opportunityId, ghl_event: event.type },
            })
            .eq("id", lead.id);
        }
        break;
      }

      default:
        // Log unhandled event types for observability
        console.log(`[GHL Webhook] Unhandled event type: ${event.type}`);
    }

    // Log to activity
    if (orgId) {
      await supabase.from("mc_audit_logs").insert({
        organization_id: orgId,
        actor_id: null,
        action: `ghl.webhook.${event.type}`,
        entity_type: "lead",
        entity_id: null,
        metadata: {
          provider: "ghl",
          event_type: event.type,
          location_id: event.locationId,
          contact_id: event.contactId,
        },
      });
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (err) {
    console.error("[GHL Webhook] Processing error:", err);

    // Create alert for webhook failures
    if (orgId) {
      await supabase.from("mc_audit_logs").insert({
        organization_id: orgId,
        actor_id: null,
        action: "ghl.webhook.error",
        entity_type: "integration",
        metadata: {
          provider: "ghl",
          event_type: event.type,
          error: err instanceof Error ? err.message : "Unknown",
        },
      });
    }

    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
