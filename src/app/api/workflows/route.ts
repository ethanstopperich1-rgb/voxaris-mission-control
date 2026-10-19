import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/server/auth";
import { apiHandler, parseBody } from "@/server/api-helpers";
import { workflowService } from "@/server/services";
import { workflowCreateSchema } from "@/lib/schemas";

export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const pageSize = Number(url.searchParams.get("pageSize")) || 25;
  const search = url.searchParams.get("search") ?? undefined;

  const result = await workflowService.list(session, { page, pageSize, search });
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req) => {
  const session = await requireRole("operator");
  const body = await parseBody(req, workflowCreateSchema);
  const workflow = await workflowService.create(session, body);
  return NextResponse.json(workflow, { status: 201 });
});
