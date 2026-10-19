import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/server/auth";
import { apiHandler, parseBody, errorResponse } from "@/server/api-helpers";
import { clientService } from "@/server/services";
import { clientUpdateSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ slug: string }> };

export const GET = apiHandler<Ctx>(async (_req, ctx) => {
  await requireSession();
  const { slug } = await ctx.params;
  const client = await clientService.getBySlug(slug);
  if (!client) return errorResponse("Client not found", 404);
  return NextResponse.json(client);
});

export const PATCH = apiHandler<Ctx>(async (req, ctx) => {
  const session = await requireRole("operator");
  const { slug } = await ctx.params;
  const client = await clientService.getBySlug(slug);
  if (!client) return errorResponse("Client not found", 404);
  const body = await parseBody(req, clientUpdateSchema);
  const updated = await clientService.update(session, client.id, body);
  return NextResponse.json(updated);
});

export const DELETE = apiHandler<Ctx>(async (_req, ctx) => {
  const session = await requireRole("admin");
  const { slug } = await ctx.params;
  const client = await clientService.getBySlug(slug);
  if (!client) return errorResponse("Client not found", 404);
  await clientService.delete(session, client.id);
  return NextResponse.json({ deleted: true });
});
