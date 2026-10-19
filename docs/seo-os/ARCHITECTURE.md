# Voxaris SEO Operating System — v1 boundary

## Ownership

OpenSEO is the replaceable external research/observation adapter for DataForSEO-backed keywords, SERPs, rankings, competitor discovery, backlink data and site audits. GSC/GA4 data can also be read through its MCP tools when the right property is connected. Its AI-search Brand Lookup is an optional sampled signal; at the audited revision it is not available through MCP.

Voxaris owns the canonical multi-client SEO state, first-party measurement, decision registry, provider selection, event/workflow state, idempotency, action policy, approvals, deployment verification and outcome history. Client content lives in the client CMS/repository. CRM and revenue events remain in the client’s source system. Copy observations into Voxaris only with explicit tenant ownership, source, timestamp, retention and permissions.

The app calls `decide(request, provider)` through a stable typed contract. A Jev, CLM or other System One provider can be swapped behind `DecisionProvider`; neither workflows nor registry entries know vendor API details. Deterministic facts are computed in normal code and never sent to AI for re-answering.

## Canonical SEO state

Keep entities normalized and tenant-scoped: `client → domain → market → service/location → keyword → page`; observations attach to stable IDs and include `source`, `observedAt`, `period`, freshness, `evidenceRef`, and `providerCost`. Store ranked snapshots and SERP features as time series; content/page metadata and change/deployment events as versioned records; leads/bookings/sales as first-party outcome records linked only where a trustworthy page/session/keyword join exists. Competitors and backlinks are observations, not trusted truth. Never collapse unknown/missing data into zero. `state.ts` defines the initial typed contracts; persistence must enforce tenant foreign keys/RLS in the database adapter.

Minimum observation groups:

- Search: query, locale/device, impressions, clicks, CTR, position, SERP result/features, ranking source and observation window.
- Page: canonical/indexability/status/robots/schema/links/performance, page type, service/location, material content-change version and deployment.
- Business: session/landing page, consented campaign attribution, conversion/key event, lead, booked appointment, sale/revenue and their source IDs.
- AI visibility: platform, query/prompt, locale, response/mention/citation evidence and sampled-at date. Keep provider outputs distinct; never synthesize a single ungrounded score.

## Decision registry and execution layers

Registry entries declare stable ID/version, narrow question, evidence contract, output schema, layer, owner/provider, confidence policy, missing-evidence behavior, action policy and audit fields. The initial decision families are page index/canonical/schema/link/content issues; keyword relevance/intent/service/location fit; material content decay/topic gap/duplication; competitor/page/topic/backlink relevance; local service×market opportunity; AI entity/answer/citation gaps; commercial priority; model escalation and human approval. Objective page indexability, canonical validity, schema checks and execution policy are registered deterministic rules; the gateway rejects them if sent to a probabilistic provider. Each remains a small decision rather than an all-purpose “SEO agent.”

| Layer | Responsibilities | Example |
|---|---|---|
| Deterministic code | Compute measured facts and thresholds, validate schema, compare baselines, enforce policy | status, noindex, canonical mismatch, position delta, impressions/clicks, page age, known cost |
| System One | Return typed Boolean/choice/score/ranked actions with cited evidence for interpretation | roofing relevance, material decline vs noise, real competitor, intent duplication |
| Frontier model | Generate/research/code only after an eligible decision escalates | grounded brief, content draft, complex diagnosis, structured patch |
| Human | Set strategy and approve material, public, costly, sensitive or irreversible work | publish, outreach send, paid link, major site-wide change |

`UNKNOWN` is a first-class outcome. Provider errors, stale observations, weak evidence or conflicting signals do not become a positive decision. Every probabilistic result stores provider/model version, registry ID/version, typed result, confidence, evidence IDs, prompt/input hash, time and raw-response reference subject to privacy rules.

## Workflow event and action lifecycle

`event → source collection → deterministic checks → dedupe/threshold → typed System One decisions → action eligibility → generation only if needed → deterministic + semantic QA → approval when policy says so → execute → verify → measure 7/14/30-day outcome → evaluate policy`.

Keep workflow runs resumable and idempotent. Every action is linked to its triggering evidence, registry version, decision, generated artifact, exact approved action payload, source/deployment commit and post-action verification. Approval lookup must match the exact action payload and artifact/version, not merely a repeated action name. External execution adapters enforce the run/action idempotency key. Exceptions carry severity, owner, deadline, retry policy and terminal outcome. Auto-execution is initially limited to reversible internal bookkeeping and safe deterministic fixes with strong regression tests. Publication, outbound outreach, purchases, credential/billing/tracking changes and destructive edits always stay approval-gated.

## Job cadence

- Hourly/event-triggered: availability/DNS/SSL/sitemap/robots and SEO-critical deploy QA; deterministic first; page the owner only for verified critical regressions. OpenSEO’s cron is not the Voxaris scheduler.
- Daily: pull due rank/GSC/GA4/first-party snapshots; compute changes and stale-data state; filter low-signal noise before System One. No rule that editing is required just because a page is old.
- Weekly: material opportunities, competitor/keyword gaps, content refresh eligibility, local service×market gaps and top few evidence-backed actions. Generate briefs/assets only after eligibility.
- Monthly: roll up baselines/outcomes, anomalies and unresolved actions; create an evidence-cited draft report. State causal limitations. Monthly is a reporting trigger, not a quota to publish.

## V1 implementation boundary

The checked-in initial implementation provides the typed decision registry, provider-neutral `decide`, deterministic fact helpers, an OpenSEO MCP port (injected transport, no private OpenSEO imports), approval-safe action policy, and an injected event-orchestrator shell with idempotent claim, evidence, decision, generation/QA, approval, execute, verify and checkpoint ports. The existing Mission Control workflow/approval store is the orchestration surface to bind to those ports. This initial integration does not configure credentials, call paid endpoints, start schedules, deploy, or publish. Adapters for Jev/CLM, GSC/GA4/PostHog/CRM and the production OpenSEO MCP client must be configured and verified separately.

## Measurement and safety invariants

- Persist observation window and source; never compare partial windows as if complete.
- Separate fact, interpretation, recommendation, action and measured outcome.
- Use explicit attribution evidence and avoid causal claims from a simple before/after correlation.
- Store unknown, API failure and cached stale separately from zero/no mention.
- Apply per-tenant OpenSEO project/auth scope and request-cost ceilings; preflight paid rank-tracking changes.
- Content must map to query/intent, service, market, parent page, differentiated value and a measurement plan; reject thin location-page matrices.
- An OpenSEO recommendation alone never publishes or sends a message.
