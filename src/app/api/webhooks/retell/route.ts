import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createServerSupabase();
    const event = body.event;
    const callId = body.call?.call_id ?? body.data?.call_id ?? "";

    if (event === "call_ended" || event === "call_analyzed") {
      const call = body.call ?? body.data ?? {};
      const durationMs = call.duration_ms ?? 0;
      const durationSec = Math.floor(durationMs / 1000);
      // Retell pricing ~$0.07/min
      const costUsd = (durationSec / 60) * 0.07;

      // Find matching agent
      const { data: agent } = await supabase
        .from("mc_agents")
        .select("id, client_id")
        .eq("platform_agent_id", call.agent_id ?? "")
        .single();

      await supabase.from("mc_calls").upsert(
        {
          platform: "retell",
          platform_call_id: callId,
          client_id: agent?.client_id ?? null,
          agent_id: agent?.id ?? null,
          direction: call.direction ?? "inbound",
          caller_number: call.from_number,
          callee_number: call.to_number,
          status: "completed",
          outcome: call.call_analysis?.call_summary ?? null,
          duration_seconds: durationSec,
          cost_usd: costUsd,
          transcript: call.transcript ?? null,
          recording_url: call.recording_url ?? null,
          summary: call.call_analysis?.call_summary ?? null,
          started_at: call.start_timestamp ? new Date(call.start_timestamp).toISOString() : null,
          ended_at: call.end_timestamp ? new Date(call.end_timestamp).toISOString() : null,
          metadata: { raw_event: event },
        },
        { onConflict: "platform_call_id" }
      );

      await supabase.from("mc_activity").insert({
        action: "call_completed",
        details: `Retell call ${callId} completed (${durationSec}s)`,
        entity_type: "call",
        source: "webhook",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
