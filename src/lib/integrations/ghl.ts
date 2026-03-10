// =============================================================================
// GoHighLevel (GHL) CRM Integration
// =============================================================================

const BASE_URL = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";

function getAccessToken(): string {
  const token = process.env.GHL_ACCESS_TOKEN;
  if (!token) throw new Error("GHL_ACCESS_TOKEN is not set");
  return token;
}

function getLocationId(): string {
  const id = process.env.GHL_LOCATION_ID;
  if (!id) throw new Error("GHL_LOCATION_ID is not set");
  return id;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    Version: API_VERSION,
    "Content-Type": "application/json",
  };
}

// -- Rate Limiting & Retry ----------------------------------------------------

const GHL_MAX_RETRIES = 3;
const GHL_MIN_DELAY_MS = 200;

let lastGhlCallAt = 0;

async function ghlRateLimit() {
  const now = Date.now();
  const elapsed = now - lastGhlCallAt;
  if (elapsed < GHL_MIN_DELAY_MS) {
    await new Promise((r) => setTimeout(r, GHL_MIN_DELAY_MS - elapsed));
  }
  lastGhlCallAt = Date.now();
}

async function ghlFetchWithRetry(
  url: string,
  init: RequestInit,
  retries = GHL_MAX_RETRIES
): Promise<Response> {
  await ghlRateLimit();
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 429 || res.status >= 500) {
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 500;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }
    return res;
  }
  return fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
}

// -- Types --------------------------------------------------------------------

export interface GHLContact {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GHLOpportunity {
  id?: string;
  name: string;
  contactId: string;
  pipelineId: string;
  stageId: string;
  status?: "open" | "won" | "lost" | "abandoned";
  monetaryValue?: number;
  [key: string]: unknown;
}

export interface GHLNote {
  id?: string;
  body: string;
  contactId?: string;
  [key: string]: unknown;
}

export interface CreateOrUpdateContactParams {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  /** Source tag, e.g. "voxaris-bot", "apollo-enrichment" */
  source?: string;
}

export interface CreateOpportunityParams {
  contactId: string;
  name: string;
  pipelineId: string;
  stageId: string;
  monetaryValue?: number;
}

export interface MariaCallOutcome {
  callId: string;
  outcome: string;
  duration: number;
  transcript: string;
  recordingUrl?: string;
  summary?: string;
  source?: string;
  appointmentBooked?: boolean;
  appointmentDate?: string;
  appointmentTime?: string;
}

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// -- API Functions ------------------------------------------------------------

/**
 * Search for a GHL contact by phone number.
 * Returns the first matching contact or null inside a success result.
 */
export async function findContact(phone: string): Promise<Result<GHLContact | null>> {
  try {
    const locationId = getLocationId();
    const url = new URL(`${BASE_URL}/contacts/`);
    url.searchParams.set("locationId", locationId);
    url.searchParams.set("query", phone);
    url.searchParams.set("limit", "1");

    const res = await ghlFetchWithRetry(url.toString(), {
      method: "GET",
      headers: headers(),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `GHL findContact failed (${res.status}): ${text}` };
    }

    const data = await res.json();
    const contact: GHLContact | null = data.contacts?.[0] ?? null;
    return { success: true, data: contact };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Upsert a GHL contact. Uses POST /contacts/upsert which finds by phone
 * and creates or updates atomically.
 */
export async function createOrUpdateContact(
  data: CreateOrUpdateContactParams
): Promise<Result<GHLContact>> {
  try {
    const locationId = getLocationId();

    const payload: Record<string, unknown> = {
      locationId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    };
    if (data.email) payload.email = data.email;
    if (data.source) payload.source = data.source;

    const res = await ghlFetchWithRetry(`${BASE_URL}/contacts/upsert`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `GHL upsert contact failed (${res.status}): ${text}` };
    }

    const result = await res.json();
    return { success: true, data: result.contact ?? result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Create a new opportunity (deal) in a GHL pipeline.
 */
export async function createOpportunity(
  data: CreateOpportunityParams
): Promise<Result<GHLOpportunity>> {
  try {
    const locationId = getLocationId();

    const payload: Record<string, unknown> = {
      pipelineId: data.pipelineId,
      locationId,
      contactId: data.contactId,
      stageId: data.stageId,
      name: data.name,
      status: "open",
    };

    if (data.monetaryValue !== undefined) {
      payload.monetaryValue = data.monetaryValue;
    }

    const res = await ghlFetchWithRetry(`${BASE_URL}/opportunities/`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `GHL create opportunity failed (${res.status}): ${text}` };
    }

    const result = await res.json();
    return { success: true, data: result.opportunity ?? result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Write Maria's call outcome data to GHL contact custom fields.
 * Finds contact by phone, then updates all relevant fields.
 */
export async function updateContactWithCallOutcome(
  phone: string,
  data: MariaCallOutcome
): Promise<Result<GHLContact>> {
  try {
    const existing = await findContact(phone);
    const contact = existing.success ? existing.data : null;

    if (!contact?.id) {
      return { success: false, error: `Contact not found for phone: ${phone}` };
    }

    const leadScore =
      data.outcome === "DEMO BOOKED" ? "hot" :
      data.outcome === "TALKED" || data.outcome === "CALLBACK" ? "warm" : "cold";

    const customFields: Record<string, unknown>[] = [
      { key: "contact.ai_outcome", field_value: data.outcome },
      { key: "contact.ai_call_summary", field_value: data.summary || `${data.outcome} — ${data.duration}s call` },
      { key: "contact.ai_duration_seconds", field_value: String(data.duration) },
      { key: "contact.ai_conversation_date", field_value: new Date().toISOString().split("T")[0] },
      { key: "contact.ai_conversation_id", field_value: data.callId },
      { key: "contact.ai_conversation_type", field_value: "maria_outbound" },
      { key: "contact.transcript_summary", field_value: (data.transcript || "").slice(0, 500) },
      { key: "contact.call_outcome", field_value: `Maria called — ${data.outcome}. Duration: ${Math.floor(data.duration / 60)}:${String(data.duration % 60).padStart(2, "0")}` },
      { key: "contact.industry", field_value: "roofing" },
      { key: "contact.lead_score", field_value: leadScore },
      { key: "contact.lead_source", field_value: data.source || "meta_ad" },
      { key: "contact.appointment_booked", field_value: data.appointmentBooked ? "yes" : "no" },
    ];

    if (data.recordingUrl) {
      customFields.push({ key: "contact.recording_url", field_value: data.recordingUrl });
    }
    if (data.appointmentDate) {
      customFields.push({ key: "contact.appointment_date", field_value: data.appointmentDate });
    }
    if (data.appointmentTime) {
      customFields.push({ key: "contact.appointment_time", field_value: data.appointmentTime });
    }

    const res = await ghlFetchWithRetry(`${BASE_URL}/contacts/${contact.id}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ customFields }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `GHL update failed (${res.status}): ${text}` };
    }

    // Also add tags
    await ghlFetchWithRetry(`${BASE_URL}/contacts/${contact.id}/tags`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        tags: [
          "maria-called",
          `outcome-${data.outcome.toLowerCase().replace(/\s+/g, "-")}`,
          `score-${leadScore}`,
        ],
      }),
    });

    const result = await res.json();
    return { success: true, data: result.contact ?? result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Add a note to an existing GHL contact.
 */
export async function addNote(
  contactId: string,
  body: string
): Promise<Result<GHLNote>> {
  try {
    const res = await ghlFetchWithRetry(`${BASE_URL}/contacts/${encodeURIComponent(contactId)}/notes`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        body,
        userId: null,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `GHL addNote failed (${res.status}): ${text}` };
    }

    const result = await res.json();
    return { success: true, data: result.note ?? result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
