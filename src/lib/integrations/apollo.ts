// =============================================================================
// Apollo.io Contact Intelligence Integration
// =============================================================================

const BASE_URL = "https://api.apollo.io/api/v1";
const HEALTH_URL = "https://api.apollo.io/v1/auth/health";

function getApiKey(): string {
  const key = process.env.APOLLO_API_KEY;
  if (!key) throw new Error("APOLLO_API_KEY is not set");
  return key;
}

function headers(): Record<string, string> {
  return {
    "x-api-key": getApiKey(),
    "Content-Type": "application/json",
  };
}

// -- Types --------------------------------------------------------------------

export interface ApolloOrganization {
  id?: string;
  name?: string;
  website_url?: string;
  primary_domain?: string;
  industry?: string;
  estimated_num_employees?: number;
  annual_revenue_printed?: string;
  city?: string;
  state?: string;
  country?: string;
  linkedin_url?: string;
  [key: string]: unknown;
}

export interface ApolloPerson {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string;
  email_status?: string;
  phone_numbers?: Array<{ sanitized_number?: string; type?: string }>;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
  organization?: ApolloOrganization;
  [key: string]: unknown;
}

export interface SearchPeopleParams {
  /** Job titles to search for, e.g. ["General Manager", "Owner"] */
  titles: string[];
  /** Locations, e.g. ["Orlando, Florida, United States"] */
  locations: string[];
  /** Industry filter, e.g. ["automotive"] */
  industries?: string[];
  /** Employee count ranges, e.g. ["1,50"] */
  employeesRange?: string[];
  /** Keyword query string */
  keywords?: string;
  /** Results per page (max 100, default 25) */
  perPage?: number;
  /** Page number (default 1) */
  page?: number;
}

export interface SearchPeopleResult {
  people: ApolloPerson[];
  totalEntries: number;
  page: number;
}

export interface EnrichContactParams {
  firstName: string;
  lastName: string;
  domain: string;
  /** Optional: organization name for better matching */
  organizationName?: string;
  /** Optional: email to match on directly */
  email?: string;
  /** Optional: Apollo person ID from a prior search */
  apolloId?: string;
}

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// -- API Functions ------------------------------------------------------------

/**
 * Search Apollo's 220M+ contact database.
 * Returns results WITHOUT names/emails -- use `enrichContact()` to reveal PII.
 */
export async function searchPeople(
  params: SearchPeopleParams
): Promise<Result<SearchPeopleResult>> {
  try {
    const payload: Record<string, unknown> = {
      per_page: params.perPage ?? 25,
      page: params.page ?? 1,
    };

    if (params.titles.length > 0) {
      payload.person_titles = params.titles;
    }
    if (params.locations.length > 0) {
      payload.person_locations = params.locations;
    }
    if (params.industries && params.industries.length > 0) {
      payload.organization_industries = params.industries;
    }
    if (params.employeesRange && params.employeesRange.length > 0) {
      payload.organization_num_employees_ranges = params.employeesRange;
    }
    if (params.keywords) {
      payload.q_keywords = params.keywords;
    }

    const res = await fetch(`${BASE_URL}/mixed_people/api_search`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Apollo search failed (${res.status}): ${text}` };
    }

    const data = await res.json();
    const people: ApolloPerson[] = data.people ?? [];
    const totalEntries: number = data.total_entries ?? 0;

    return {
      success: true,
      data: {
        people,
        totalEntries,
        page: params.page ?? 1,
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Enrich a contact with full profile data (email, phone, LinkedIn).
 * Costs 1 credit per email reveal, 8 credits per mobile number.
 */
export async function enrichContact(
  params: EnrichContactParams
): Promise<Result<ApolloPerson>> {
  try {
    const payload: Record<string, unknown> = {};

    if (params.apolloId) payload.id = params.apolloId;
    if (params.firstName) payload.first_name = params.firstName;
    if (params.lastName) payload.last_name = params.lastName;
    if (params.email) payload.email = params.email;
    if (params.organizationName) payload.organization_name = params.organizationName;
    if (params.domain) payload.domain = params.domain;

    const res = await fetch(`${BASE_URL}/people/match`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Apollo enrich failed (${res.status}): ${text}` };
    }

    const data = await res.json();
    const person: ApolloPerson | null = data.person ?? null;

    if (!person) {
      return { success: false, error: "No matching person found" };
    }

    return { success: true, data: person };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Get full company data from a domain (industry, employees, revenue, location).
 */
export async function enrichOrganization(
  domain: string
): Promise<Result<ApolloOrganization>> {
  try {
    const res = await fetch(`${BASE_URL}/organizations/enrich`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ domain }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Apollo org enrich failed (${res.status}): ${text}` };
    }

    const data = await res.json();
    const org: ApolloOrganization | null = data.organization ?? null;

    if (!org) {
      return { success: false, error: "No matching organization found" };
    }

    return { success: true, data: org };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Verify the Apollo API key is valid and the account is active.
 */
export async function healthCheck(): Promise<
  Result<{ healthy: boolean; isLoggedIn: boolean }>
> {
  try {
    const res = await fetch(HEALTH_URL, {
      method: "GET",
      headers: headers(),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return { success: false, error: `Apollo health check failed (${res.status})` };
    }

    const data = await res.json();
    return {
      success: true,
      data: {
        healthy: data.healthy ?? false,
        isLoggedIn: data.is_logged_in ?? false,
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
