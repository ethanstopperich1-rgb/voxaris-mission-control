/** Tenant-scoped Voxaris state contracts. Persist normalized entities; observations are append-only snapshots. */

export type SeoSource = "openseo_mcp" | "gsc" | "ga4" | "posthog" | "crm" | "website_crawl" | "deployment" | "human_review";

export interface SeoEntityRef {
  readonly tenantId: string;
  readonly id: string;
  readonly type: "domain" | "market" | "service" | "location" | "keyword" | "page" | "competitor" | "backlink" | "lead" | "appointment" | "sale";
}

export interface SeoDomainState {
  readonly tenantId: string;
  readonly domainId: string;
  readonly clientId: string;
  readonly hostname: string;
  readonly marketIds: readonly string[];
  readonly serviceIds: readonly string[];
  readonly competitorIds: readonly string[];
  readonly active: boolean;
}

export interface SeoPageState {
  readonly tenantId: string;
  readonly pageId: string;
  readonly domainId: string;
  readonly url: string;
  readonly pageType: "home" | "service" | "location" | "article" | "other";
  readonly serviceId: string | null;
  readonly locationId: string | null;
  readonly targetKeywordIds: readonly string[];
  readonly lastMaterialChangeAt: string | null;
  readonly deploymentId: string | null;
}

export interface SeoObservation<T = unknown> {
  readonly id: string;
  readonly tenantId: string;
  readonly entity: SeoEntityRef;
  readonly kind: string;
  readonly source: SeoSource;
  readonly observedAt: string;
  readonly period: { readonly start: string; readonly end: string } | null;
  readonly freshness: "fresh" | "stale" | "missing" | "error";
  readonly providerCostUsd: number | null;
  readonly evidenceRef: string;
  /** Null remains unknown; it must not be coerced to zero or a negative result. */
  readonly value: T | null;
}

export interface SeoChangeRecord {
  readonly tenantId: string;
  readonly pageId: string;
  readonly changeId: string;
  readonly changedAt: string;
  readonly source: "human" | "agent" | "cms";
  readonly deploymentId: string | null;
  readonly beforeEvidenceRef: string | null;
  readonly afterEvidenceRef: string | null;
}

/** Link only using observed first-party IDs; do not copy customer PII into SEO state. */
export interface SeoBusinessOutcome {
  readonly tenantId: string;
  readonly outcomeId: string;
  readonly source: "crm" | "analytics" | "billing";
  readonly sourceRecordId: string;
  readonly pageId: string | null;
  readonly sessionId: string | null;
  readonly keywordId: string | null;
  readonly outcomeType: "lead" | "booked_appointment" | "sale" | "revenue";
  readonly occurredAt: string;
  readonly amount: number | null;
  readonly currency: string | null;
  readonly attributionEvidenceRef: string | null;
}

export function validateObservation(observation: SeoObservation): void {
  if (!observation.id.trim() || !observation.tenantId.trim() || !observation.evidenceRef.trim()) {
    throw new Error("Observation ID, tenant ID, and evidence reference are required");
  }
  if (observation.entity.tenantId !== observation.tenantId) {
    throw new Error("Observation and referenced entity must belong to the same tenant");
  }
  if (!observation.entity.id.trim() || !Number.isFinite(Date.parse(observation.observedAt))) {
    throw new Error("Observation entity ID and valid observation timestamp are required");
  }
  if (observation.providerCostUsd !== null && (!Number.isFinite(observation.providerCostUsd) || observation.providerCostUsd < 0)) {
    throw new Error("Provider cost must be null or a non-negative finite number");
  }
  if (observation.period) {
    const start = Date.parse(observation.period.start);
    const end = Date.parse(observation.period.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
      throw new Error("Observation period must contain valid timestamps with start not after end");
    }
  }
}
