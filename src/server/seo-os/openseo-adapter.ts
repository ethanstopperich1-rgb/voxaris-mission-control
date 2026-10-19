/** Minimal port for an injected OpenSEO MCP client; this module has no vendor SDK dependency. */

export interface McpToolSummary { readonly name: string; }
export interface OpenSeoMcpClient {
  listTools(): Promise<readonly McpToolSummary[]>;
  callTool(name: string, args: Readonly<Record<string, unknown>>): Promise<unknown>;
}

export type SeoObservationKind =
  | "keyword_research" | "domain_overview" | "serp_results" | "rank_tracker"
  | "ranked_keywords" | "backlink_profile" | "site_audit" | "search_console"
  | "analytics_landing_pages" | "local_business_profile";

const TOOL_FOR_OBSERVATION: Readonly<Record<SeoObservationKind, string>> = {
  keyword_research: "research_keywords",
  domain_overview: "get_domain_overview",
  serp_results: "get_serp_results",
  rank_tracker: "get_rank_tracker",
  ranked_keywords: "get_ranked_keywords",
  backlink_profile: "get_backlinks_profile",
  site_audit: "run_site_audit",
  search_console: "get_search_console_performance",
  analytics_landing_pages: "get_google_analytics_organic_landing_pages",
  local_business_profile: "get_business_profile",
};

export interface OpenSeoObservation {
  readonly source: "openseo_mcp";
  readonly kind: SeoObservationKind;
  readonly toolName: string;
  readonly observedAt: string;
  readonly data: unknown;
}

export class OpenSeoAdapter {
  private readonly client: OpenSeoMcpClient;

  constructor(client: OpenSeoMcpClient) {
    this.client = client;
  }

  async observe(kind: SeoObservationKind, args: Readonly<Record<string, unknown>>): Promise<OpenSeoObservation> {
    const toolName = TOOL_FOR_OBSERVATION[kind];
    const tools = await this.client.listTools();
    if (!tools.some((tool) => tool.name === toolName)) {
      throw new Error(`OpenSEO MCP does not expose ${toolName}; refusing to substitute another signal`);
    }
    const data = await this.client.callTool(toolName, args);
    return { source: "openseo_mcp", kind, toolName, observedAt: new Date().toISOString(), data };
  }

  /** AI Brand Lookup exists in OpenSEO's UI, but was not registered as an MCP tool at audited revision. */
  observeAiVisibility(): never {
    throw new Error("OpenSEO AI Brand Lookup is not available through its audited MCP tool registry");
  }
}
