# OpenSEO capability map for Voxaris

**Audit snapshot:** OpenSEO `every-app/open-seo`, `main` at `0ffff93` (shallow clone, 2026-09-25). This classifies checked implementation, not just README claims. MCP tool coverage is distinct from UI coverage.

## Decision

Use OpenSEO as an external SEO observation and research provider behind a Voxaris adapter. Do not treat it as the Voxaris tenant/business state, workflow engine, approval system, content generator, deployment controller, or revenue database. The MCP interface is the cleanest integration boundary. Never make Voxaris decision logic depend on OpenSEO internals or on a particular decision-model vendor.

## Capability classification

| Capability | Status | Verified implementation and boundary |
|---|---|---|
| Keyword research and metrics | READY TO USE | DataForSEO-backed keyword research, metrics, suggestions, SERP tools; saved keywords and tags are project-scoped and exposed by MCP. Metered requests and credit estimates apply. |
| Rank tracking | READY WITH CONFIGURATION | Persistent project/domain configurations, keywords, snapshots, location/device/schedule, scheduled workflow checks, cost estimates and MCP management tools. Requires project, market/device/depth/schedule choices and budget guardrails. It is a ranking data collector, not an autonomous prioritizer. |
| Competitor intelligence | READY TO USE | Domain/keyword overview, SERP competitor discovery, SERP results, keyword/domain data and MCP tools. System One still must decide whether a detected domain/page/topic is a real competitor and material. |
| Backlinks | READY WITH CONFIGURATION | Backlink overview/profile and page-level views via DataForSEO; cached and metered. Configure domain scope, allowlisted prospect criteria, cost ceiling and human review for outreach. It does not earn links. |
| Technical site audits | READY WITH CONFIGURATION | Crawl and Lighthouse audit workflows, stored page/issue records, audit status/results, sitemap and page checks, MCP audit tools. Configure crawl limits, cadence and safe URL policy. Does not verify a future deployment unless Voxaris triggers a post-deploy audit. |
| AI search visibility | PARTIAL | UI has a Brand Lookup service using DataForSEO LLM Mentions for ChatGPT and Google AI Overview, competitor cross-aggregation, sampled prompts/cited sources and shaping. Cache TTL is 24h while upstream data is described in code as monthly-updated. Current MCP registry does not register this Brand Lookup. It is a sampled provider dataset, not live universal answer testing, factual consistency, citation completeness, or a canonical “AEO score.” |
| Google Search Console | READY WITH CONFIGURATION | OAuth-backed property performance and URL-inspection MCP tools plus persisted connection metadata. User must connect/authorize the right property; Google API permissions and limits apply. Search Console does not itself prove revenue. |
| Google Analytics 4 | READY WITH CONFIGURATION | OAuth-backed organic landing-page, page performance, key events, acquisition, measurement health and related MCP tools. Property, key events and attribution windows need configuration. |
| Google Business Profile/local | READY WITH CONFIGURATION | Local SERP/business discovery, profile, reviews, updates, categories, questions and grid-rank tools exist. Availability depends on the connected provider/account/data and request credits. Do not infer GBP access from ordinary DataForSEO availability. |
| PostHog / first-party behavior | NOT APPROPRIATE as a source of truth | Repo has PostHog product telemetry, not a client page-behavior/conversion data model for Voxaris. Keep PostHog/website events in Voxaris and join only through explicit, consented identifiers. |
| CRM leads, booked appointments, sales and revenue | NOT APPROPRIATE | OpenSEO does not own Voxaris/client operational outcomes. Keep them in CRM/revenue systems; link to page/session/campaign only where available and permitted. |
| Client/domain/service/location/competitor state | PARTIAL | OpenSEO projects store organization, name, domain, default locale; rank tracking stores its domain/market config and project context supports notes. This is not the normalized Voxaris client/service/location/CRM graph. |
| Scheduled/background work | PARTIAL | Cloudflare cron triggers every five minutes and daily; verified scheduled rank checks start durable Rank Check workflows. Site audits/rank runs are background workflows. The schedules are product-specific, not a configurable hourly/daily/weekly/monthly SEO policy engine for Voxaris. |
| Workflow orchestration and exception state | NEEDS ADAPTER | OpenSEO uses Cloudflare Workflows for its own audits/rank checks. Voxaris should retain its own workflow run, evidence, approval, retry, exception, and audit trail; call OpenSEO as a data provider. |
| System One decision registry / provider abstraction | MISSING | OpenSEO skills guide an agent through tasks; no typed, vendor-neutral policy/decision registry or Voxaris `decide(...)` interface exists. Build in Voxaris. |
| Content generation, editorial state and deployment | NOT APPROPRIATE | OpenSEO exposes research, MCP and skills; it is not a content CMS/release/approval system. Keep generated changes in Voxaris/site repos and require client policy review before publishing. |
| Post-deployment SEO QA against intended change | NEEDS ADAPTER | Site audit primitives exist, but no verified hook compares intended metadata/copy/schema against production after a Voxaris deploy. Voxaris must trigger a scoped crawl and compare before/after evidence. |
| Outcome/causal evaluation | MISSING | No joined SEO→visitor→lead→booking→sale model or causal attribution layer. Voxaris must preserve baselines, source windows and caveats; report correlation as correlation. |
| Self-hosting | READY WITH CONFIGURATION | Docker and Cloudflare paths documented. Docker sets `AUTH_MODE=local_noauth`; docs explicitly require a private/auth-protected network. Cloudflare provisioning includes D1/KV/R2 and Access, but requires Cloudflare/R2 setup and account-level configuration. |
| Authentication / tenant isolation | READY WITH CONFIGURATION | Hosted MCP supports OAuth and personal API keys with project/organization authorization; self-host adds auth modes, Access, and project/workspace sharing. Configure tenant IDs/scopes and isolate each client. API keys act as the user. Do not share one unrestricted key across clients. |
| Costs / metering | READY WITH CONFIGURATION | DataForSEO requests return billing metadata; hosted product has credit checks/estimates; rank tracker offers a pre-commit estimate; caching exists per workflow (e.g. keyword SERP 12h, domain pages/keywords 12h, backlink 6h, AI lookup 24h). Self-host pays DataForSEO directly. Run only approved/estimated research jobs and persist provider cost. |
| Extensibility | READY TO USE | TypeScript modules, tool definitions, MCP server, Zod input/output schemas, provider clients and workflow services are separable. Integrate via the MCP contract rather than importing OpenSEO application source into Mission Control. |

## Audit evidence and limitations

- Read repository `README.md`, `AGENTS.md`, `CLAUDE.md`, Docker and Cloudflare self-hosting docs, MCP docs, and inspected the MCP server/tool registration, DataForSEO client and AI adapter, rank-tracking scheduler/workflows, cache services, project/audit schema, and SEO skill inventory.
- MCP has tools for keyword/SERP/domain/backlink/local/GBP/rank tracking, site audits, GSC, GA4 and reports. The server description and registered tool list were inspected; AI Brand Lookup is implemented in the UI service but was not in the MCP registration list at this snapshot.
- Agent instructions were read. SEO workflow skills are present in `.agents/skills/` and mirrored under `plugins/openseo/skills/`; there is no `.claude/skills/` directory in the audited checkout.
- A README feature label is not evidence of broad platform coverage. In particular, AI search sampling is not a guaranteed or continuous crawl of ChatGPT/Gemini/Perplexity answers. OpenSEO’s observed implementation uses DataForSEO's LLM Mentions endpoints for ChatGPT and Google AI Overview; provider coverage and freshness constrain conclusions.
- No live provider connection, paid query, tenant setup, deployment, or production change was performed as part of this source audit.

## Source pointers

- Upstream: <https://github.com/every-app/open-seo> (audited local HEAD `0ffff93`)
- MCP docs: <https://github.com/every-app/open-seo/blob/main/web/content/docs/mcp.md>
- Source paths: `src/server/mcp/server.ts`, `src/server/mcp/tools/`, `src/server/lib/dataforseo/`, `src/server/features/ai-search/services/brandLookup.ts`, `src/server/features/rank-tracking/services/scheduledRankChecks.ts`, `src/server/workflows/`, `src/db/app.schema.ts`, `src/server/lib/r2-cache.ts`
