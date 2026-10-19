import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/server/auth";
import { apiHandler, parseBody } from "@/server/api-helpers";
import { workspaceService } from "@/server/services";
import { workspaceCreateSchema } from "@/lib/schemas";

export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const url = new URL(req.url);
  const clientId = url.searchParams.get("client_id") ?? undefined;
  const page = Number(url.searchParams.get("page")) || 1;
  const pageSize = Number(url.searchParams.get("pageSize")) || 25;
  const search = url.searchParams.get("search") ?? undefined;

  if (clientId) {
    const workspaces = await workspaceService.listByClient(clientId);
    return NextResponse.json({ data: workspaces, count: workspaces.length, page: 1, pageSize: workspaces.length, totalPages: 1 });
  }

  const result = await workspaceService.list(session, { page, pageSize, search });
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req) => {
  const session = await requireRole("operator");
  const body = await parseBody(req, workspaceCreateSchema);
  const workspace = await workspaceService.create(session, body);
  return NextResponse.json(workspace, { status: 201 });
});
