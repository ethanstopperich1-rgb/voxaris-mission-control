/** Deterministic observations and comparisons. Never route these through AI. */

export interface PageTechnicalObservation {
  readonly statusCode: number | null;
  readonly robotsNoindex: boolean | null;
  readonly robotsBlocked: boolean | null;
  readonly canonicalUrl: string | null;
  readonly requestedUrl: string;
  readonly inSitemap: boolean | null;
  readonly title: string | null;
  readonly metaDescription: string | null;
  readonly schemaTypes: readonly string[] | null;
  readonly internalLinks: number | null;
}

export interface TechnicalFact {
  readonly id: string;
  readonly value: boolean | number | string | null;
  readonly status: "pass" | "fail" | "unknown";
  readonly reason: string;
}

export function evaluatePageFacts(page: PageTechnicalObservation): readonly TechnicalFact[] {
  const canonicalMatches = page.canonicalUrl === null ? null : normalizeUrl(page.canonicalUrl) === normalizeUrl(page.requestedUrl);
  const hasSchema = page.schemaTypes === null ? null : page.schemaTypes.length > 0;
  const checks: readonly TechnicalFact[] = [
    { id: "seo.page.http_200", value: page.statusCode === null ? null : page.statusCode === 200, status: page.statusCode === null ? "unknown" : page.statusCode === 200 ? "pass" : "fail", reason: page.statusCode === null ? "HTTP status not observed" : `HTTP ${page.statusCode}` },
    { id: "seo.page.robots_indexable", value: page.robotsNoindex === null || page.robotsBlocked === null ? null : !page.robotsNoindex && !page.robotsBlocked, status: page.robotsNoindex === null || page.robotsBlocked === null ? "unknown" : !page.robotsNoindex && !page.robotsBlocked ? "pass" : "fail", reason: page.robotsNoindex === null || page.robotsBlocked === null ? "Robots signals incomplete" : page.robotsNoindex || page.robotsBlocked ? "Noindex or crawl block observed" : "No noindex or crawl block observed" },
    { id: "seo.page.canonical_matches", value: canonicalMatches, status: canonicalMatches === null ? "unknown" : canonicalMatches ? "pass" : "fail", reason: canonicalMatches === null ? "Canonical not observed" : canonicalMatches ? "Canonical matches requested URL" : "Canonical differs from requested URL" },
    { id: "seo.page.sitemap_included", value: page.inSitemap, status: page.inSitemap === null ? "unknown" : page.inSitemap ? "pass" : "fail", reason: page.inSitemap === null ? "Sitemap membership not observed" : page.inSitemap ? "URL appears in sitemap" : "URL absent from sitemap" },
    { id: "seo.page.title_present", value: page.title?.trim().length ? page.title.trim().length : page.title === null ? null : 0, status: page.title === null ? "unknown" : page.title.trim() ? "pass" : "fail", reason: page.title === null ? "Title not observed" : page.title.trim() ? "Title is present" : "Title is empty" },
    { id: "seo.page.description_present", value: page.metaDescription?.trim().length ? page.metaDescription.trim().length : page.metaDescription === null ? null : 0, status: page.metaDescription === null ? "unknown" : page.metaDescription.trim() ? "pass" : "fail", reason: page.metaDescription === null ? "Description not observed" : page.metaDescription.trim() ? "Description is present" : "Description is empty" },
    { id: "seo.page.schema_present", value: hasSchema, status: hasSchema === null ? "unknown" : hasSchema ? "pass" : "fail", reason: hasSchema === null ? "Schema not observed" : hasSchema ? "At least one schema type observed" : "No schema type observed" },
    { id: "seo.page.internal_link_count", value: page.internalLinks, status: page.internalLinks === null ? "unknown" : "pass", reason: page.internalLinks === null ? "Internal-link count not observed" : `${page.internalLinks} internal links observed` },
  ];
  return checks;
}

export function positionDelta(previous: number | null, current: number | null): number | null {
  return previous === null || current === null ? null : current - previous;
}

export function percentDelta(previous: number | null, current: number | null): number | null {
  if (previous === null || current === null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/$/, "")}`.toLowerCase();
  } catch {
    return value.trim().replace(/\/$/, "").toLowerCase();
  }
}
