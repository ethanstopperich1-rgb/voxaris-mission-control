import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/server/auth";
import { apiHandler, parseBody, errorResponse } from "@/server/api-helpers";
import { leadService } from "@/server/services";
import { leadUpdateSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  await requireSession();
  const { id } = await params;
  const lead = await leadService.getById(id);
  if (!lead) return errorResponse("Lead not found", 404);
  return NextResponse.json(lead);
});

export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  const session = await requireRole("sales");
  const { id } = await params;
  const body = await parseBody(req, leadUpdateSchema);
  const lead = await leadService.update(session, id, body);
  return NextResponse.json(lead);
});

export const DELETE = apiHandler<Ctx>(async (_req, { params }) => {
  const session = await requireRole("admin");
  const { id } = await params;
  await leadService.delete(session, id);
  return NextResponse.json({ deleted: true });
});
