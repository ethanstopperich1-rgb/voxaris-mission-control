// =============================================================================
// Retell AI API Integration
// =============================================================================

const BASE_URL = "https://api.retellai.com";

function getApiKey(): string {
  const key = process.env.RETELL_API_KEY;
  if (!key) throw new Error("RETELL_API_KEY is not set");
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

export interface RetellAgent {
  agent_id: string;
  agent_name: string;
  voice_id: string;
  llm_websocket_url?: string;
  webhook_url?: string;
  last_modification_timestamp?: number;
}

export interface RetellCall {
  call_id: string;
  agent_id: string;
  call_type: string;
  from_number?: string;
  to_number?: string;
  direction?: string;
  call_status: string;
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  transcript?: string;
  recording_url?: string;
  call_analysis?: Record<string, unknown>;
}

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function listAgents(): Promise<Result<RetellAgent[]>> {
  try {
    const res = await fetch(`${BASE_URL}/list-agents`, {
      headers: headers(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { success: false, error: `Retell API error: ${res.status}` };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function listCalls(params?: {
  agent_id?: string;
  limit?: number;
  sort_order?: "ascending" | "descending";
}): Promise<Result<RetellCall[]>> {
  try {
    const res = await fetch(`${BASE_URL}/list-calls`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        filter_criteria: params?.agent_id ? { agent_id: [params.agent_id] } : {},
        limit: params?.limit ?? 50,
        sort_order: params?.sort_order ?? "descending",
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return { success: false, error: `Retell API error: ${res.status}` };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getCall(callId: string): Promise<Result<RetellCall>> {
  try {
    const res = await fetch(`${BASE_URL}/get-call/${callId}`, {
      headers: headers(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { success: false, error: `Retell API error: ${res.status}` };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function createCall(params: {
  from_number: string;
  to_number: string;
  agent_id: string;
}): Promise<Result<RetellCall>> {
  try {
    const res = await fetch(`${BASE_URL}/create-phone-call`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        from_number: params.from_number,
        to_number: params.to_number,
        override_agent_id: params.agent_id,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return { success: false, error: `Retell API error: ${res.status}` };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
