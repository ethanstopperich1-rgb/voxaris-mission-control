// =============================================================================
// GoHighLevel Integration — Workspace-Level Service
// =============================================================================

const BASE_URL = "https://services.leadconnectorhq.com";
const GHL_MAX_RETRIES = 3;
const GHL_MIN_DELAY_MS = 200;

let lastGhlCallAt = 0;

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastGhlCallAt;
  if (elapsed < GHL_MIN_DELAY_MS) {
    await new Promise((r) => setTimeout(r, GHL_MIN_DELAY_MS - elapsed));
  }
  lastGhlCallAt = Date.now();
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = GHL_MAX_RETRIES,
): Promise<Response> {
  await rateLimit();
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
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

// -- Types ------------------------------------------------------------------

export interface GHLConfig {
  locationId: string;
  accessToken: string;
  apiVersion?: string;
}

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

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// -- GHL Client (workspace-scoped) ------------------------------------------

export class GHLClient {
  private locationId: string;
  private accessToken: string;
  private apiVersion: string;

  constructor(config: GHLConfig) {
    this.locationId = config.locationId;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion ?? "2021-07-28";
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      Version: this.apiVersion,
      "Content-Type": "application/json",
    };
  }

  async validateConfig(): Promise<Result<boolean>> {
    try {
      const res = await fetchWithRetry(
        `${BASE_URL}/contacts/?locationId=${this.locationId}&limit=1`,
        { method: "GET", headers: this.headers() },
      );
      if (!res.ok) {
        return { success: false, error: `Validation failed (${res.status}): ${await res.text()}` };
      }
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async findContact(phone: string): Promise<Result<GHLContact | null>> {
    try {
      const url = new URL(`${BASE_URL}/contacts/`);
      url.searchParams.set("locationId", this.locationId);
      url.searchParams.set("query", phone);
      url.searchParams.set("limit", "1");
      const res = await fetchWithRetry(url.toString(), { method: "GET", headers: this.headers() });
      if (!res.ok) return { success: false, error: `findContact failed (${res.status})` };
      const data = await res.json();
      return { success: true, data: data.contacts?.[0] ?? null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async upsertContact(params: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    source?: string;
    tags?: string[];
  }): Promise<Result<GHLContact>> {
    try {
      const payload: Record<string, unknown> = {
        locationId: this.locationId,
        firstName: params.firstName,
        lastName: params.lastName,
        phone: params.phone,
      };
      if (params.email) payload.email = params.email;
      if (params.source) payload.source = params.source;
      if (params.tags) payload.tags = params.tags;

      const res = await fetchWithRetry(`${BASE_URL}/contacts/upsert`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) return { success: false, error: `upsertContact failed (${res.status})` };
      const result = await res.json();
      return { success: true, data: result.contact ?? result };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async createOpportunity(params: {
    contactId: string;
    name: string;
    pipelineId: string;
    stageId: string;
    monetaryValue?: number;
  }): Promise<Result<GHLOpportunity>> {
    try {
      const payload: Record<string, unknown> = {
        pipelineId: params.pipelineId,
        locationId: this.locationId,
        contactId: params.contactId,
        stageId: params.stageId,
        name: params.name,
        status: "open",
      };
      if (params.monetaryValue !== undefined) payload.monetaryValue = params.monetaryValue;
      const res = await fetchWithRetry(`${BASE_URL}/opportunities/`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) return { success: false, error: `createOpportunity failed (${res.status})` };
      const result = await res.json();
      return { success: true, data: result.opportunity ?? result };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async addNote(contactId: string, body: string): Promise<Result<GHLNote>> {
    try {
      const res = await fetchWithRetry(
        `${BASE_URL}/contacts/${encodeURIComponent(contactId)}/notes`,
        { method: "POST", headers: this.headers(), body: JSON.stringify({ body, userId: null }) },
      );
      if (!res.ok) return { success: false, error: `addNote failed (${res.status})` };
      const result = await res.json();
      return { success: true, data: result.note ?? result };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async addTags(contactId: string, tags: string[]): Promise<Result<unknown>> {
    try {
      const res = await fetchWithRetry(
        `${BASE_URL}/contacts/${encodeURIComponent(contactId)}/tags`,
        { method: "POST", headers: this.headers(), body: JSON.stringify({ tags }) },
      );
      if (!res.ok) return { success: false, error: `addTags failed (${res.status})` };
      return { success: true, data: await res.json() };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async fetchContact(contactId: string): Promise<Result<GHLContact>> {
    try {
      const res = await fetchWithRetry(
        `${BASE_URL}/contacts/${encodeURIComponent(contactId)}`,
        { method: "GET", headers: this.headers() },
      );
      if (!res.ok) return { success: false, error: `fetchContact failed (${res.status})` };
      const result = await res.json();
      return { success: true, data: result.contact ?? result };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }
}

// -- Webhook Parsing --------------------------------------------------------

export interface GHLWebhookEvent {
  type: string;
  locationId: string;
  contactId?: string;
  opportunityId?: string;
  payload: Record<string, unknown>;
  raw: unknown;
}

export function parseGHLWebhook(body: unknown): GHLWebhookEvent | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Record<string, unknown>;
  const type = (raw.type ?? raw.event ?? raw.eventType ?? "") as string;
  const locationId = (raw.locationId ?? raw.location_id ?? "") as string;
  const contactId = (raw.contactId ?? raw.contact_id) as string | undefined;
  const opportunityId = (raw.opportunityId ?? raw.opportunity_id) as string | undefined;
  if (!type) return null;
  return { type, locationId, contactId: contactId || undefined, opportunityId: opportunityId || undefined, payload: raw, raw: body };
}
