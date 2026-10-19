// =============================================================================
// Paperclip API Client — thin wrapper, failure-tolerant
// =============================================================================

import type {
  PaperclipConfig,
  PaperclipProject,
  PaperclipTask,
  PaperclipTaskCreateParams,
  PaperclipWorker,
  PaperclipResult,
} from "./types";

const DEFAULT_TIMEOUT_MS = 10_000;

export class PaperclipClient {
  private baseUrl: string;
  private apiKey?: string;
  readonly companyId?: string;

  constructor(config: PaperclipConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.companyId = config.companyId;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) h["Authorization"] = `Bearer ${this.apiKey}`;
    return h;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<PaperclipResult<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { ...this.headers(), ...init.headers },
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: `Paperclip ${res.status}: ${text}` };
      }

      const data = await res.json();
      return { success: true, data: data as T };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const isTimeout = message.includes("timeout") || message.includes("aborted");
      return {
        success: false,
        error: `Paperclip unavailable: ${message}`,
        degraded: isTimeout,
      };
    }
  }

  /** Health check — is Paperclip reachable? */
  async healthCheck(): Promise<PaperclipResult<boolean>> {
    const result = await this.request<{ status: string }>("/health");
    if (result.success) return { success: true, data: true };
    return { success: false, error: result.error, degraded: true };
  }

  /** Get or create a project for a workspace. */
  async ensureProject(projectName: string): Promise<PaperclipResult<PaperclipProject>> {
    return this.request<PaperclipProject>("/projects", {
      method: "POST",
      body: JSON.stringify({ name: projectName }),
    });
  }

  async getProject(projectId: string): Promise<PaperclipResult<PaperclipProject>> {
    return this.request<PaperclipProject>(`/projects/${projectId}`);
  }

  async listWorkers(projectId: string): Promise<PaperclipResult<PaperclipWorker[]>> {
    return this.request<PaperclipWorker[]>(`/projects/${projectId}/workers`);
  }

  async createTask(params: PaperclipTaskCreateParams): Promise<PaperclipResult<PaperclipTask>> {
    return this.request<PaperclipTask>("/tasks", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getTask(taskId: string): Promise<PaperclipResult<PaperclipTask>> {
    return this.request<PaperclipTask>(`/tasks/${taskId}`);
  }

  async cancelTask(taskId: string): Promise<PaperclipResult<PaperclipTask>> {
    return this.request<PaperclipTask>(`/tasks/${taskId}/cancel`, { method: "POST" });
  }
}

/** Create a Paperclip client from env vars. Returns null if not configured. */
export function createPaperclipClient(): PaperclipClient | null {
  const baseUrl = process.env.PAPERCLIP_BASE_URL;
  if (!baseUrl) return null;
  return new PaperclipClient({
    baseUrl,
    apiKey: process.env.PAPERCLIP_API_KEY || undefined,
    companyId: process.env.PAPERCLIP_COMPANY_ID || undefined,
  });
}
