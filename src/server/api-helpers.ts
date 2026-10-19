import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import type { ZodType } from "zod/v4";

/**
 * Standard JSON error response.
 */
export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wrap an API handler with standard error handling.
 * Supports both simple routes and dynamic routes with params.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiHandler<C = any>(
  handler: (req: Request, ctx: C) => Promise<NextResponse>,
): (req: Request, ctx: C) => Promise<NextResponse> {
  return async (req: Request, ctx: C) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof AuthError) {
        return errorResponse(err.message, err.status);
      }
      const message = err instanceof Error ? err.message : "Internal server error";
      console.error(`[API Error]`, message);
      return errorResponse(message, 500);
    }
  };
}

/**
 * Parse and validate request body against a Zod schema.
 */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Validation failed: ${issues}`);
  }
  return result.data;
}
