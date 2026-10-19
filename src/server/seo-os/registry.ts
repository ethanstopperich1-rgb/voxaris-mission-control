/** Vendor-neutral, typed decision catalog. Facts belong in code, not this registry. */

export type DecisionLayer = "deterministic" | "system_one" | "frontier" | "human";
export type DecisionOutputKind = "boolean" | "choice" | "score" | "ranked_actions";
export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational" | "local" | "unknown";
export type DecisionValueFor<K extends DecisionOutputKind> =
  K extends "boolean" ? { readonly kind: "boolean"; readonly value: boolean | "unknown" }
    : K extends "choice" ? { readonly kind: "choice"; readonly value: SearchIntent }
      : K extends "score" ? { readonly kind: "score"; readonly value: number | null }
        : { readonly kind: "ranked_actions"; readonly value: readonly { id: string; score: number }[] };

export interface DecisionDefinition {
  readonly layer: DecisionLayer;
  readonly output: DecisionOutputKind;
  readonly frontierMayBeNeeded: boolean;
  readonly humanReview: "never" | "when_material" | "always";
}

const decisionNames = [
  "seo.page.indexable",
  "seo.page.canonical_valid",
  "seo.page.schema_valid",
  "seo.page.internal_links_adequate",
  "seo.page.title_needs_change",
  "seo.page.description_needs_change",
  "seo.page.content_stale",
  "seo.page.performance_problem_material",
  "seo.page.has_cannibalization_risk",
  "seo.keyword.relevant",
  "seo.keyword.commercially_relevant",
  "seo.keyword.service_fit",
  "seo.keyword.location_fit",
  "seo.keyword.worth_targeting",
  "seo.keyword.requires_new_page",
  "seo.keyword.belongs_on_existing_page",
  "seo.keyword.intent_type",
  "seo.content.needs_refresh",
  "seo.content.missing_topic",
  "seo.content.supports_search_intent",
  "seo.content.too_thin",
  "seo.content.has_local_relevance",
  "seo.content.has_duplicate_intent",
  "seo.content.needs_human_review",
  "seo.competitor.true_competitor",
  "seo.competitor.page_outperforming_us",
  "seo.competitor.topic_gap_material",
  "seo.competitor.backlink_gap_material",
  "seo.competitor.strategy_relevant",
  "seo.location.page_needed",
  "seo.location.page_underperforming",
  "seo.location.service_gap",
  "seo.location.local_intent_material",
  "seo.backlink.opportunity_relevant",
  "seo.backlink.domain_relevant",
  "seo.backlink.suspicious",
  "seo.backlink.gap_material",
  "seo.ai.visibility_gap",
  "seo.ai.answer_mentions_competitor",
  "seo.ai.entity_underrepresented",
  "seo.ai.content_missing_answer",
  "seo.ai.page_needs_structured_answer",
  "seo.opportunity.likely_business_value",
  "seo.opportunity.priority",
  "seo.opportunity.ranked_actions",
  "seo.change.requires_frontier_model",
  "seo.change.requires_human",
  "seo.change.safe_to_auto_execute",
] as const;

const deterministicDecisions = new Set<DecisionId>([
  "seo.page.indexable",
  "seo.page.canonical_valid",
  "seo.page.schema_valid",
  "seo.change.requires_human",
  "seo.change.safe_to_auto_execute",
]);

export type DecisionId = (typeof decisionNames)[number];

function definitionFor(id: DecisionId): DecisionDefinition {
  const output: DecisionOutputKind = id.endsWith(".intent_type") ? "choice"
    : id === "seo.opportunity.priority" || id === "seo.opportunity.likely_business_value" ? "score"
      : id === "seo.opportunity.ranked_actions" ? "ranked_actions"
        : "boolean";
  const alwaysHuman = id === "seo.change.requires_human" || id === "seo.content.needs_human_review";
  return {
    layer: deterministicDecisions.has(id) ? "deterministic" : "system_one",
    output,
    frontierMayBeNeeded: id === "seo.change.requires_frontier_model" || id.startsWith("seo.content."),
    humanReview: alwaysHuman ? "always" : "when_material",
  };
}

export const decisionRegistry: Readonly<Record<DecisionId, DecisionDefinition>> =
  Object.freeze(Object.fromEntries(decisionNames.map((id) => [id, definitionFor(id)])) as Record<DecisionId, DecisionDefinition>);

export type TypedDecisionValue =
  | { readonly kind: "boolean"; readonly value: boolean | "unknown" }
  | { readonly kind: "choice"; readonly value: SearchIntent }
  | { readonly kind: "score"; readonly value: number | null }
  | { readonly kind: "ranked_actions"; readonly value: readonly { id: string; score: number }[] };

export interface DecisionRequest {
  readonly decisionId: DecisionId;
  readonly tenantId: string;
  readonly subject: { readonly type: string; readonly id: string };
  readonly evidence: readonly { readonly id: string; readonly source: string; readonly observedAt: string }[];
  readonly input: Readonly<Record<string, unknown>>;
}

export interface DecisionResult {
  readonly decisionId: DecisionId;
  readonly registryVersion: 1;
  readonly provider: string;
  readonly providerVersion: string;
  readonly value: TypedDecisionValue;
  readonly confidence: number | null;
  readonly evidenceIds: readonly string[];
  readonly evaluatedAt: string;
}

export interface DecisionProvider {
  readonly name: string;
  readonly version: string;
  decide(request: DecisionRequest, definition: DecisionDefinition): Promise<{
    readonly value: unknown;
    readonly confidence: unknown;
  }>;
}

export function isDecisionId(value: string): value is DecisionId {
  return Object.hasOwn(decisionRegistry, value);
}

export function validateDecisionValue(value: unknown, expected: DecisionOutputKind): asserts value is TypedDecisionValue {
  if (typeof value !== "object" || value === null || !("kind" in value) || !("value" in value)) {
    throw new Error("Decision provider returned a malformed value");
  }
  const candidate = value as { kind: unknown; value: unknown };
  if (candidate.kind !== expected) throw new Error(`Decision output kind mismatch: expected ${expected}, received ${String(candidate.kind)}`);
  if (expected === "boolean" && candidate.value !== true && candidate.value !== false && candidate.value !== "unknown") {
    throw new Error("Boolean decisions must return true, false, or unknown");
  }
  if (expected === "choice" && !["informational", "commercial", "transactional", "navigational", "local", "unknown"].includes(String(candidate.value))) {
    throw new Error("Search intent must be one of the registered choices");
  }
  if (expected === "score" && candidate.value !== null && (typeof candidate.value !== "number" || !Number.isFinite(candidate.value) || candidate.value < 0 || candidate.value > 1)) {
    throw new Error("Decision score must be null or a number between 0 and 1");
  }
  if (expected === "ranked_actions") {
    if (!Array.isArray(candidate.value) || candidate.value.some((item) => typeof item !== "object" || item === null || !("id" in item) || typeof item.id !== "string" || !item.id.trim() || !("score" in item) || typeof item.score !== "number" || !Number.isFinite(item.score) || item.score < 0 || item.score > 1)) {
      throw new Error("Ranked actions must contain action IDs and scores between 0 and 1");
    }
  }
}
