import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/server/auth";
import { apiHandler, parseBody, errorResponse } from "@/server/api-helpers";
import { workspaceService } from "@/server/services";
import { workspaceUpdateSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  await requireSession();
  const { id } = await params;
  const workspace = await workspaceService.getById(id);
  if (!workspace) return errorResponse("Workspace not found", 404);
  return NextResponse.json(workspace);
});

export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  const session = await requireRole("operator");
  const { id } = await params;
  const body = await parseBody(req, workspaceUpdateSchema);
  const workspace = await workspaceService.update(session, id, body);
  return NextResponse.json(workspace);
});

export const DELETE = apiHandler<Ctx>(async (_req, { params }) => {
  const session = await requireRole("admin");
  const { id } = await params;
  await workspaceService.delete(session, id);
  return NextResponse.json({ deleted: true });
});
