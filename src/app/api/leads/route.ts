import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/server/auth";
import { apiHandler, parseBody } from "@/server/api-helpers";
import { leadService } from "@/server/services";
import { leadCreateSchema } from "@/lib/schemas";

export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const pageSize = Number(url.searchParams.get("pageSize")) || 25;
  const search = url.searchParams.get("search") ?? undefined;
  const workspace_id = url.searchParams.get("workspace_id") ?? undefined;
  const client_id = url.searchParams.get("client_id") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const sortBy = url.searchParams.get("sortBy") ?? undefined;
  const sortDir = (url.searchParams.get("sortDir") as "asc" | "desc") ?? undefined;

  const result = await leadService.list(session, {
    page, pageSize, search, sortBy, sortDir, workspace_id, client_id, status,
  });
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req) => {
  const session = await requireRole("sales");
  const body = await parseBody(req, leadCreateSchema);
  const lead = await leadService.create(session, body);
  return NextResponse.json(lead, { status: 201 });
});
