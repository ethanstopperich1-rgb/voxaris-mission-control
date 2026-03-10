import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Creates a Supabase client for browser-side usage.
 *
 * Uses a Proxy pattern to provide graceful fallback when environment
 * variables are missing (e.g. during build or in preview deployments).
 * Every method call returns an empty result instead of throwing, so the
 * app can render a "not configured" state rather than crashing.
 */
function createNoopClient() {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "from") {
        return () =>
          new Proxy(
            {},
            {
              get() {
                return () => Promise.resolve({ data: [], error: null, count: 0 });
              },
            }
          );
      }
      if (prop === "auth") {
        return new Proxy(
          {},
          {
            get() {
              return () =>
                Promise.resolve({
                  data: { user: null, session: null },
                  error: null,
                });
            },
          }
        );
      }
      if (prop === "rpc") {
        return () => Promise.resolve({ data: null, error: null });
      }
      if (prop === "storage") {
        return new Proxy(
          {},
          {
            get() {
              return () =>
                new Proxy(
                  {},
                  {
                    get() {
                      return () => Promise.resolve({ data: null, error: null });
                    },
                  }
                );
            },
          }
        );
      }
      if (prop === "channel" || prop === "removeChannel") {
        return () => ({
          on: () => ({ subscribe: () => ({}) }),
          subscribe: () => ({}),
          unsubscribe: () => ({}),
        });
      }
      return undefined;
    },
  };

  return new Proxy({}, handler);
}

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== "undefined") {
      console.warn(
        "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
          "Using noop client — data features are disabled."
      );
    }
    return createNoopClient() as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
