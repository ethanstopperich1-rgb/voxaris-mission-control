import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface VapiAssistant {
  id: string;
  name: string;
  voice?: {
    voiceId?: string;
  };
  model?: {
    model?: string;
  };
  [key: string]: unknown;
}

export async function POST() {
  const apiKey = process.env.VAPI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "VAPI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  // Fetch assistants from VAPI API
  let vapiAssistants: VapiAssistant[];
  try {
    const response = await fetch("https://api.vapi.ai/assistant", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `VAPI API error: ${response.status} - ${errorText}` },
        { status: 502 }
      );
    }

    vapiAssistants = await response.json();
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch from VAPI: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  if (!Array.isArray(vapiAssistants)) {
    return NextResponse.json(
      { error: "Unexpected response format from VAPI API" },
      { status: 502 }
    );
  }

  const supabase = await createClient();
  let syncedCount = 0;
  const errors: string[] = [];

  for (const assistant of vapiAssistants) {
    const agentData = {
      platform: "vapi" as const,
      platform_agent_id: assistant.id,
      name: assistant.name || `VAPI Assistant ${assistant.id.slice(-6)}`,
      voice_id: assistant.voice?.voiceId ?? null,
      llm_id: assistant.model?.model ?? null,
      status: "active" as const,
      updated_at: new Date().toISOString(),
    };

    // Upsert by platform + platform_agent_id
    const { error } = await supabase
      .from("mc_agents")
      .upsert(agentData, {
        onConflict: "platform,platform_agent_id",
      });

    if (error) {
      errors.push(`${assistant.id}: ${error.message}`);
    } else {
      syncedCount++;
    }
  }

  return NextResponse.json({
    synced: syncedCount,
    total: vapiAssistants.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
