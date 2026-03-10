// =============================================================================
// Tavus Video AI Integration
// =============================================================================

const BASE_URL = "https://tavusapi.com/v2";

function getApiKey(): string {
  const key = process.env.TAVUS_API_KEY;
  if (!key) throw new Error("TAVUS_API_KEY is not set");
  return key;
}

function headers(): Record<string, string> {
  return {
    "x-api-key": getApiKey(),
    "Content-Type": "application/json",
  };
}

// -- Types --------------------------------------------------------------------

export interface TavusVideo {
  video_id: string;
  video_name: string;
  status: "queued" | "generating" | "ready" | "failed" | string;
  download_url?: string;
  hosted_url?: string;
  stream_url?: string;
  replica_id: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface GenerateVideoParams {
  /** The replica (digital twin) to use for the video */
  replicaId: string;
  /** The script the replica will speak */
  script: string;
  /** A human-readable name for the video */
  videoName: string;
  /** Optional dynamic variables for template personalization */
  variables?: Record<string, string>;
}

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// -- API Functions ------------------------------------------------------------

/**
 * Create a new Tavus video using a replica and script.
 * The video is generated asynchronously -- poll `getVideoStatus()` to track progress.
 */
export async function generateStaticVideo(
  params: GenerateVideoParams
): Promise<Result<TavusVideo>> {
  try {
    const payload: Record<string, unknown> = {
      replica_id: params.replicaId,
      script: params.script,
      video_name: params.videoName,
    };

    if (params.variables && Object.keys(params.variables).length > 0) {
      payload.variables = params.variables;
    }

    const res = await fetch(`${BASE_URL}/videos`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Tavus create video failed (${res.status}): ${text}` };
    }

    const data: TavusVideo = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * List all generated Tavus videos for this account.
 */
export async function listVideos(): Promise<Result<TavusVideo[]>> {
  try {
    const res = await fetch(`${BASE_URL}/videos`, {
      method: "GET",
      headers: headers(),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Tavus list videos failed (${res.status}): ${text}` };
    }

    const data = await res.json();
    const videos: TavusVideo[] = Array.isArray(data) ? data : data.data ?? data.videos ?? [];
    return { success: true, data: videos };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Check the generation status of a specific Tavus video.
 */
export async function getVideoStatus(videoId: string): Promise<Result<TavusVideo>> {
  try {
    const res = await fetch(`${BASE_URL}/videos/${encodeURIComponent(videoId)}`, {
      method: "GET",
      headers: headers(),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Tavus get video failed (${res.status}): ${text}` };
    }

    const data: TavusVideo = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
