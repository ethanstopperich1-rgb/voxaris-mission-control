import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createServerSupabase();
    const messageType = body.message?.type ?? "";
    const call = body.message?.call ?? {};
    const callId = call.id ?? "";

    if (messageType === "end-of-call-report") {
      const durationSec = Math.floor((call.duration ?? 0));
      const costUsd = call.cost ?? (durationSec / 60) * 0.15;

      // Find matching agent
      const assistantId = call.assistantId ?? "";
      const { data: agent } = await supabase
        .from("mc_agents")
        .select("id, client_id")
        .eq("platform_agent_id", assistantId)
        .single();

      // Build transcript from messages
      const messages = body.message?.messages ?? [];
      const transcript = messages
        .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
        .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
        .join("\n");

      await supabase.from("mc_calls").upsert(
        {
          platform: "vapi",
          platform_call_id: callId,
          client_id: agent?.client_id ?? null,
          agent_id: agent?.id ?? null,
          direction: call.type === "outboundPhoneCall" ? "outbound" : "inbound",
          caller_number: call.customer?.number ?? null,
          callee_number: call.phoneNumber?.number ?? null,
          status: "completed",
          outcome: body.message?.analysis?.successEvaluation ?? null,
          duration_seconds: durationSec,
          cost_usd: costUsd,
          transcript: transcript || null,
          recording_url: body.message?.recordingUrl ?? null,
          summary: body.message?.analysis?.summary ?? null,
          started_at: call.startedAt ?? null,
          ended_at: call.endedAt ?? null,
          metadata: { ended_reason: call.endedReason },
        },
        { onConflict: "platform_call_id" }
      );

      await supabase.from("mc_activity").insert({
        action: "call_completed",
        details: `VAPI call ${callId} completed (${durationSec}s)`,
        entity_type: "call",
        source: "webhook",
      });
    }

    if (messageType === "status-update") {
      const status = body.message?.status ?? "";
      if (status === "in-progress") {
        const assistantId = call.assistantId ?? "";
        const { data: agent } = await supabase
          .from("mc_agents")
          .select("id, client_id")
          .eq("platform_agent_id", assistantId)
          .single();

        await supabase.from("mc_calls").upsert(
          {
            platform: "vapi",
            platform_call_id: callId,
            client_id: agent?.client_id ?? null,
            agent_id: agent?.id ?? null,
            direction: call.type === "outboundPhoneCall" ? "outbound" : "inbound",
            caller_number: call.customer?.number ?? null,
            status: "in-progress",
            started_at: call.startedAt ?? new Date().toISOString(),
          },
          { onConflict: "platform_call_id" }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
