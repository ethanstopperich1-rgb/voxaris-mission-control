// =============================================================================
// VAPI Voice AI Integration
// =============================================================================

const BASE_URL = "https://api.vapi.ai";

function getApiKey(): string {
  const key = process.env.VAPI_API_KEY;
  if (!key) throw new Error("VAPI_API_KEY is not set");
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

// -- Types --------------------------------------------------------------------

export interface VapiCall {
  id: string;
  assistantId: string;
  phoneNumberId?: string;
  type: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  endedReason?: string;
  transcript?: string;
  recordingUrl?: string;
  cost?: number;
  customer?: { number?: string };
  analysis?: {
    summary?: string;
    structuredData?: Record<string, unknown>;
  };
}

export interface VapiAssistant {
  id: string;
  name: string;
  model: { provider: string; model: string };
  voice?: { provider: string; voiceId: string };
  firstMessage?: string;
}

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// -- API Functions ------------------------------------------------------------

export async function listCalls(params?: {
  assistantId?: string;
  limit?: number;
}): Promise<Result<VapiCall[]>> {
  try {
    const sp = new URLSearchParams();
    if (params?.assistantId) sp.set("assistantId", params.assistantId);
    if (params?.limit) sp.set("limit", String(params.limit));

    const res = await fetch(`${BASE_URL}/call?${sp}`, {
      headers: headers(),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `VAPI list calls failed (${res.status}): ${text}` };
    }

    const calls: VapiCall[] = await res.json();
    return { success: true, data: calls };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function listAssistants(): Promise<Result<VapiAssistant[]>> {
  try {
    const res = await fetch(`${BASE_URL}/assistant`, {
      headers: headers(),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `VAPI list assistants failed (${res.status}): ${text}` };
    }

    const assistants: VapiAssistant[] = await res.json();
    return { success: true, data: assistants };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function triggerOutboundCall(params: {
  assistantId: string;
  phoneNumberId: string;
  customerNumber: string;
}): Promise<Result<VapiCall>> {
  try {
    const res = await fetch(`${BASE_URL}/call/phone`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        assistantId: params.assistantId,
        phoneNumberId: params.phoneNumberId,
        customer: { number: params.customerNumber },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `VAPI create call failed (${res.status}): ${text}` };
    }

    const data: VapiCall = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getCall(callId: string): Promise<Result<VapiCall>> {
  try {
    const res = await fetch(`${BASE_URL}/call/${callId}`, {
      headers: headers(),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `VAPI get call failed (${res.status}): ${text}` };
    }

    const data: VapiCall = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
