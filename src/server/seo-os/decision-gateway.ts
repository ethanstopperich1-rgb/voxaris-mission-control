import { decisionRegistry, validateDecisionValue, type DecisionProvider, type DecisionRequest, type DecisionResult } from "./registry.ts";

/** Route one narrow interpretation to the replaceable System One provider. */
export async function decide(request: DecisionRequest, provider: DecisionProvider): Promise<DecisionResult> {
  if (!request.tenantId.trim() || !request.subject.id.trim()) throw new Error("Tenant and subject IDs are required");
  if (request.evidence.length === 0) throw new Error("System One decisions require at least one evidence reference");
  const evidenceIds = new Set(request.evidence.map((item) => item.id));
  if ([...evidenceIds].some((id) => !id.trim())) throw new Error("Evidence references require non-empty IDs");

  const definition = decisionRegistry[request.decisionId];
  if (definition.layer !== "system_one") {
    throw new Error(`${request.decisionId} is a ${definition.layer} rule and must not be sent to a probabilistic provider`);
  }
  const providerResult = await provider.decide(request, definition);
  const value = providerResult.value;
  const confidence = providerResult.confidence;
  validateDecisionValue(value, definition.output);
  if (confidence !== null && (typeof confidence !== "number" || !Number.isFinite(confidence) || confidence < 0 || confidence > 1)) {
    throw new Error("Decision confidence must be null or a number between 0 and 1");
  }
  return {
    decisionId: request.decisionId,
    registryVersion: 1,
    provider: provider.name,
    providerVersion: provider.version,
    value,
    // The gateway validates but does not manufacture confidence.
    confidence,
    evidenceIds: [...evidenceIds],
    evaluatedAt: new Date().toISOString(),
  };
}
