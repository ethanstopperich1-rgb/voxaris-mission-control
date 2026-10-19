import { authorizeSeoAction, type SeoAction } from "./action-policy.ts";
import { decide } from "./decision-gateway.ts";
import type { DecisionProvider, DecisionRequest, DecisionResult } from "./registry.ts";

export interface SeoEvent {
  readonly eventId: string;
  readonly tenantId: string;
  readonly subject: { readonly type: string; readonly id: string };
  readonly kind: "schedule" | "deployment" | "provider_alert" | "manual_review";
  readonly occurredAt: string;
}

export interface SeoEvidence {
  readonly id: string;
  readonly source: string;
  readonly observedAt: string;
}

export interface SeoCollectedObservations {
  readonly evidence: readonly SeoEvidence[];
  readonly facts: readonly Readonly<Record<string, unknown>>[];
  readonly context: Readonly<Record<string, unknown>>;
}

export interface SeoCandidateAction {
  readonly id: string;
  readonly kind: SeoAction["kind"];
  readonly requiresGeneration: boolean;
  readonly payload: Readonly<Record<string, unknown>>;
}

export type SeoWorkflowStatus = "duplicate" | "no_action" | "blocked" | "awaiting_approval" | "verification_failed" | "completed";

export interface SeoWorkflowResult {
  readonly runId: string;
  readonly status: SeoWorkflowStatus;
  readonly reason?: string;
  readonly decisionResults: readonly DecisionResult[];
  readonly actionId?: string;
  readonly artifactId?: string;
  readonly approvalId?: string;
  readonly verification?: Readonly<Record<string, unknown>>;
}

export interface SeoWorkflowPorts {
  /** Atomically create or resume a pending run for eventId; completed/in-flight duplicates return acquired=false. */
  claim(event: SeoEvent): Promise<{ runId: string; acquired: boolean }>;
  collect(event: SeoEvent): Promise<SeoCollectedObservations>;
  buildDecisionRequests(event: SeoEvent, collected: SeoCollectedObservations): Promise<readonly DecisionRequest[]>;
  chooseAction(input: { event: SeoEvent; facts: readonly Readonly<Record<string, unknown>>[]; decisions: readonly DecisionResult[] }): Promise<SeoCandidateAction | null>;
  /** Must be idempotent for the runId/actionId pair. */
  generate?(input: { runId: string; action: SeoCandidateAction; context: Readonly<Record<string, unknown>> }): Promise<{ artifactId: string; content: unknown }>;
  qa?(action: SeoCandidateAction, artifact: { artifactId: string; content: unknown }, evidence: readonly SeoEvidence[]): Promise<"pass" | "fail" | "needs_human">;
  /** Persist the exact action payload/artifact/version in the approval record. */
  requestApproval(input: { runId: string; event: SeoEvent; action: SeoCandidateAction; artifactId?: string; reason: string }): Promise<string>;
  /** Approval must match this exact action payload and generated artifact, not only an action name. */
  isApproved(input: { runId: string; action: SeoCandidateAction; artifactId?: string }): Promise<boolean>;
  /** Must enforce idempotencyKey at the external side-effect boundary. */
  execute(input: { idempotencyKey: string; event: SeoEvent; action: SeoCandidateAction; artifact?: { artifactId: string; content: unknown } }): Promise<{ effectId: string }>;
  verify(input: { event: SeoEvent; action: SeoCandidateAction; effectId: string }): Promise<{ passed: boolean; evidence: Readonly<Record<string, unknown>> }>;
  checkpoint(result: SeoWorkflowResult): Promise<void>;
}

/** Resumable-by-event orchestration shell; persistence and integrations remain injected ports. */
export async function runSeoEvent(
  event: SeoEvent,
  ports: SeoWorkflowPorts,
  decisionProvider: DecisionProvider,
): Promise<SeoWorkflowResult> {
  const claim = await ports.claim(event);
  if (!claim.acquired) return { runId: claim.runId, status: "duplicate", decisionResults: [] };
  const save = async (result: SeoWorkflowResult) => { await ports.checkpoint(result); return result; };

  const collected = await ports.collect(event);
  if (collected.evidence.length === 0) return save({ runId: claim.runId, status: "blocked", reason: "No source evidence collected", decisionResults: [] });

  const requests = await ports.buildDecisionRequests(event, collected);
  const decisions: DecisionResult[] = [];
  const allowedEvidenceIds = new Set(collected.evidence.map((item) => item.id));
  for (const request of requests) {
    if (request.tenantId !== event.tenantId) return save({ runId: claim.runId, status: "blocked", reason: "Decision tenant does not match event tenant", decisionResults: decisions });
    if (request.evidence.some((item) => !allowedEvidenceIds.has(item.id))) return save({ runId: claim.runId, status: "blocked", reason: "Decision references evidence not collected for this workflow", decisionResults: decisions });
    decisions.push(await decide(request, decisionProvider));
  }

  const action = await ports.chooseAction({ event, facts: collected.facts, decisions });
  if (!action) return save({ runId: claim.runId, status: "no_action", decisionResults: decisions });
  const authorization = authorizeSeoAction(action.kind);
  let artifact: { artifactId: string; content: unknown } | undefined;

  if (action.requiresGeneration) {
    if (!ports.generate) return save({ runId: claim.runId, status: "blocked", reason: "Generation required but no frontier-model adapter is configured", decisionResults: decisions, actionId: action.id });
    artifact = await ports.generate({ runId: claim.runId, action, context: collected.context });
    if (!ports.qa) return save({ runId: claim.runId, status: "blocked", reason: "Generated artifact has no QA adapter", decisionResults: decisions, actionId: action.id, artifactId: artifact.artifactId });
    const qa = await ports.qa(action, artifact, collected.evidence);
    if (qa === "fail") return save({ runId: claim.runId, status: "blocked", reason: "Generated artifact failed QA", decisionResults: decisions, actionId: action.id, artifactId: artifact.artifactId });
    if (qa === "needs_human" && !(await ports.isApproved({ runId: claim.runId, action, artifactId: artifact.artifactId }))) {
      const approvalId = await ports.requestApproval({ runId: claim.runId, event, action, artifactId: artifact.artifactId, reason: "QA requires human review" });
      return save({ runId: claim.runId, status: "awaiting_approval", reason: "QA requires human review", decisionResults: decisions, actionId: action.id, artifactId: artifact.artifactId, approvalId });
    }
  }

  if (!authorization.canAutoExecute && !(await ports.isApproved({ runId: claim.runId, action, artifactId: artifact?.artifactId }))) {
    const approvalId = await ports.requestApproval({ runId: claim.runId, event, action, artifactId: artifact?.artifactId, reason: authorization.reason });
    return save({ runId: claim.runId, status: "awaiting_approval", reason: authorization.reason, decisionResults: decisions, actionId: action.id, artifactId: artifact?.artifactId, approvalId });
  }

  const effect = await ports.execute({ idempotencyKey: `${claim.runId}:${action.id}`, event, action, artifact });
  const verification = await ports.verify({ event, action, effectId: effect.effectId });
  if (!verification.passed) return save({ runId: claim.runId, status: "verification_failed", reason: "Action ran but post-action verification did not pass", decisionResults: decisions, actionId: action.id, artifactId: artifact?.artifactId, verification: verification.evidence });
  return save({ runId: claim.runId, status: "completed", decisionResults: decisions, actionId: action.id, artifactId: artifact?.artifactId, verification: verification.evidence });
}
