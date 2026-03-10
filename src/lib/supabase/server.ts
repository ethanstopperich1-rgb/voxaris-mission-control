import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for server-side usage (Server Components,
 * Route Handlers, Server Actions). Reads and writes cookies via the
 * Next.js `cookies()` API so auth state persists across requests.
 *
 * Falls back to a noop client when env vars are missing, identical to
 * the browser-side pattern.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[Supabase Server] Missing environment variables. Using noop client."
    );

    const handler: ProxyHandler<object> = {
      get(_target, prop) {
        if (prop === "from") {
          return () =>
            new Proxy(
              {},
              {
                get() {
                  return () =>
                    Promise.resolve({ data: [], error: null, count: 0 });
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
        return undefined;
      },
    };

    return new Proxy({}, handler) as ReturnType<typeof createServerClient>;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // `setAll` can fail when called from a Server Component.
          // This is safe to ignore if middleware is refreshing sessions.
        }
      },
    },
  });
}

/** Alias used by webhook handlers and API routes. */
export const createServerSupabase = createClient;
