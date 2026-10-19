import { createClient } from "@/lib/supabase/server";
import type { SessionContext, UserRole } from "@/lib/types";

const ROLE_LEVELS: Record<UserRole, number> = {
  owner: 50,
  admin: 40,
  operator: 30,
  sales: 20,
  viewer: 10,
};

/**
 * Get the current session context from cookies (server-side only).
 * Returns null if not authenticated or profile not found.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("mc_profiles")
    .select("organization_id, role, email")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    organizationId: profile.organization_id,
    role: profile.role as UserRole,
    email: profile.email,
  };
}

/**
 * Get session context or throw 401 — use in API routes.
 */
export async function requireSession(): Promise<SessionContext> {
  const session = await getSessionContext();
  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }
  return session;
}

/**
 * Require a minimum role level or throw 403.
 */
export async function requireRole(minRole: UserRole): Promise<SessionContext> {
  const session = await requireSession();
  if (!hasRole(session.role, minRole)) {
    throw new AuthError("Forbidden: insufficient role", 403);
  }
  return session;
}

/**
 * Check if a user role meets a minimum role requirement.
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_LEVELS[userRole] ?? 0) >= (ROLE_LEVELS[requiredRole] ?? 100);
}

/**
 * Custom error class for auth failures — carries HTTP status.
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
