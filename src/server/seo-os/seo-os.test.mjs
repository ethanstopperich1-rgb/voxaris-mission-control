import assert from "node:assert/strict";
import test from "node:test";
import { authorizeSeoAction } from "./action-policy.ts";
import { decide } from "./decision-gateway.ts";
import { evaluatePageFacts, percentDelta, positionDelta } from "./facts.ts";
import { OpenSeoAdapter } from "./openseo-adapter.ts";
import { runSeoEvent } from "./orchestrator.ts";
import { validateObservation } from "./state.ts";

test("page facts preserve unknown observations and compute canonical mismatch deterministically", () => {
  const facts = evaluatePageFacts({ statusCode: 200, robotsNoindex: false, robotsBlocked: false,
    canonicalUrl: "https://example.com/canonical", requestedUrl: "https://example.com/page",
    inSitemap: null, title: "", metaDescription: null, schemaTypes: [], internalLinks: 0 });
  assert.equal(facts.find((f) => f.id === "seo.page.canonical_matches")?.status, "fail");
  assert.equal(facts.find((f) => f.id === "seo.page.sitemap_included")?.status, "unknown");
  assert.equal(facts.find((f) => f.id === "seo.page.title_present")?.status, "fail");
});

test("metric deltas handle missing and zero baselines without inventing values", () => {
  assert.equal(positionDelta(3, 11), 8);
  assert.equal(positionDelta(null, 11), null);
  assert.equal(percentDelta(0, 12), null);
  assert.equal(percentDelta(10, 8), -20);
});

test("decision gateway requires evidence and validates provider output", async () => {
  const provider = { name: "fake-system-one", version: "test", decide: async () => ({ value: { kind: "boolean", value: true }, confidence: 0.91 }) };
  const request = { decisionId: "seo.keyword.relevant", tenantId: "tenant-1", subject: { type: "keyword", id: "kw-1" }, input: {}, evidence: [{ id: "obs-1", source: "gsc", observedAt: "2026-09-25T00:00:00Z" }] };
  assert.equal((await decide(request, provider)).provider, "fake-system-one");
  await assert.rejects(() => decide({ ...request, evidence: [] }, provider), /evidence reference/);
  await assert.rejects(() => decide(request, { ...provider, decide: async () => ({ value: { kind: "boolean", value: true }, confidence: 2 }) }), /confidence/);
  await assert.rejects(() => decide(request, { ...provider, decide: async () => ({ value: { kind: "boolean", value: "maybe" }, confidence: 0.7 }) }), /true, false, or unknown/);
  await assert.rejects(() => decide({ ...request, decisionId: "seo.page.canonical_valid" }, provider), /must not be sent to a probabilistic provider/);
});

test("public, paid, tracking and destructive actions stay approval-gated", () => {
  assert.equal(authorizeSeoAction("record_observation").canAutoExecute, true);
  assert.equal(authorizeSeoAction("create_internal_draft").requiresHumanApproval, false);
  for (const kind of ["publish", "send_outreach", "purchase_link", "change_tracking_or_billing", "delete_or_redirect_page"]) {
    assert.equal(authorizeSeoAction(kind).requiresHumanApproval, true);
  }
});

test("OpenSEO adapter refuses tools not exposed by the connected MCP endpoint", async () => {
  const adapter = new OpenSeoAdapter({ listTools: async () => [{ name: "get_domain_overview" }], callTool: async () => ({ value: 4 }) });
  assert.equal((await adapter.observe("domain_overview", {})).source, "openseo_mcp");
  await assert.rejects(() => adapter.observe("keyword_research", {}), /does not expose research_keywords/);
  assert.throws(() => adapter.observeAiVisibility(), /not available through its audited MCP/);
});

test("event workflow persists approval and never executes publish before approval", async () => {
  const trace = [];
  let approved = false;
  const ports = {
    claim: async () => ({ runId: "run-1", acquired: true }),
    collect: async () => ({ evidence: [{ id: "ev-1", source: "gsc", observedAt: "2026-09-25T00:00:00Z" }], facts: [], context: {} }),
    buildDecisionRequests: async (_event, collected) => [{ decisionId: "seo.keyword.relevant", tenantId: "tenant-1", subject: { type: "keyword", id: "kw-1" }, input: {}, evidence: [collected.evidence[0]] }],
    chooseAction: async () => ({ id: "publish-1", kind: "publish", requiresGeneration: false, payload: {} }),
    requestApproval: async () => { trace.push("approval"); return "approval-1"; },
    isApproved: async () => approved,
    execute: async ({ idempotencyKey }) => { assert.equal(idempotencyKey, "run-1:publish-1"); trace.push("execute"); return { effectId: "effect-1" }; },
    verify: async () => ({ passed: true, evidence: { status: 200 } }),
    checkpoint: async (result) => { trace.push(result.status); },
  };
  const provider = { name: "stub", version: "1", decide: async () => ({ value: { kind: "boolean", value: true }, confidence: 0.9 }) };
  const event = { eventId: "event-1", tenantId: "tenant-1", subject: { type: "page", id: "page-1" }, kind: "manual_review", occurredAt: "2026-09-25T00:00:00Z" };
  const pending = await runSeoEvent(event, ports, provider);
  assert.equal(pending.status, "awaiting_approval");
  assert.equal(pending.decisionResults.length, 1);
  assert.deepEqual(trace, ["approval", "awaiting_approval"]);
  approved = true;
  assert.equal((await runSeoEvent(event, ports, provider)).status, "completed");
  assert.equal(trace.includes("execute"), true);
});

test("SEO state preserves unknowns and rejects cross-tenant observations", () => {
  const base = { id: "obs-1", tenantId: "tenant-1", entity: { tenantId: "tenant-1", id: "page-1", type: "page" }, kind: "gsc_clicks", source: "gsc", observedAt: "2026-09-25T00:00:00Z", period: null, freshness: "fresh", providerCostUsd: null, evidenceRef: "gsc-row-1", value: null };
  assert.doesNotThrow(() => validateObservation(base));
  assert.throws(() => validateObservation({ ...base, entity: { ...base.entity, tenantId: "tenant-2" } }), /same tenant/);
  assert.throws(() => validateObservation({ ...base, providerCostUsd: -1 }), /non-negative/);
});
