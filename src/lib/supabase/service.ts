import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for server-only operations that
 * need to bypass RLS (e.g. webhook handlers writing call data).
 *
 * NEVER import this on the client side.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
