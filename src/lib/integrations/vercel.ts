// =============================================================================
// Vercel Platform API Integration
// =============================================================================

const BASE_URL = "https://api.vercel.com";

function getToken(): string {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error("VERCEL_TOKEN is not set");
  return token;
}

function getTeamId(): string {
  return process.env.VERCEL_TEAM_ID ?? "";
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

function teamQuery(): string {
  const teamId = getTeamId();
  return teamId ? `?teamId=${teamId}` : "";
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  latestDeployments?: VercelDeployment[];
  targets?: Record<string, { alias?: string[] }>;
  link?: { type: string; repo: string };
  updatedAt: number;
  createdAt: number;
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: string;
  created: number;
  ready?: number;
  source?: string;
  meta?: Record<string, string>;
}

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function listProjects(): Promise<Result<VercelProject[]>> {
  try {
    const res = await fetch(`${BASE_URL}/v9/projects${teamQuery()}`, {
      headers: headers(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { success: false, error: `Vercel API error: ${res.status}` };
    }
    const data = await res.json();
    return { success: true, data: data.projects ?? [] };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function listDeployments(projectId: string, limit = 10): Promise<Result<VercelDeployment[]>> {
  try {
    const q = teamQuery();
    const sep = q ? "&" : "?";
    const res = await fetch(
      `${BASE_URL}/v6/deployments${q}${sep}projectId=${projectId}&limit=${limit}`,
      { headers: headers(), signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) {
      return { success: false, error: `Vercel API error: ${res.status}` };
    }
    const data = await res.json();
    return { success: true, data: data.deployments ?? [] };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function triggerRedeploy(deploymentId: string): Promise<Result<VercelDeployment>> {
  try {
    const q = teamQuery();
    const sep = q ? "&" : "?";
    const res = await fetch(
      `${BASE_URL}/v13/deployments${q}${sep}forceNew=1`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ deploymentId }),
        signal: AbortSignal.timeout(15_000),
      }
    );
    if (!res.ok) {
      return { success: false, error: `Vercel API error: ${res.status}` };
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
