import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createServerSupabase();
    const eventType = body.event_type ?? body.type ?? "";
    const conversationId = body.conversation_id ?? "";

    if (eventType === "conversation_ended" || eventType === "conversation.ended") {
      const durationSec = body.duration_seconds ?? 0;
      // Tavus pricing $0.37/min
      const costUsd = (durationSec / 60) * 0.37;

      // Find matching agent by persona
      const personaId = body.persona_id ?? "";
      const { data: agent } = await supabase
        .from("mc_agents")
        .select("id, client_id")
        .eq("platform_agent_id", personaId)
        .single();

      await supabase.from("mc_calls").upsert(
        {
          platform: "tavus",
          platform_call_id: conversationId,
          client_id: agent?.client_id ?? null,
          agent_id: agent?.id ?? null,
          direction: "video",
          status: "completed",
          duration_seconds: durationSec,
          cost_usd: costUsd,
          metadata: { event_type: eventType, persona_id: personaId },
          ended_at: new Date().toISOString(),
        },
        { onConflict: "platform_call_id" }
      );

      await supabase.from("mc_activity").insert({
        action: "video_conversation_completed",
        details: `Tavus conversation ${conversationId} completed (${durationSec}s)`,
        entity_type: "call",
        source: "webhook",
      });
    }

    if (eventType === "conversation_started" || eventType === "conversation.started") {
      const personaId = body.persona_id ?? "";
      const { data: agent } = await supabase
        .from("mc_agents")
        .select("id, client_id")
        .eq("platform_agent_id", personaId)
        .single();

      await supabase.from("mc_calls").insert({
        platform: "tavus",
        platform_call_id: conversationId,
        client_id: agent?.client_id ?? null,
        agent_id: agent?.id ?? null,
        direction: "video",
        status: "in-progress",
        started_at: new Date().toISOString(),
        metadata: { persona_id: personaId },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
