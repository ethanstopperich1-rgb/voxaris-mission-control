import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/server/auth";
import { apiHandler, parseBody } from "@/server/api-helpers";
import { clientService } from "@/server/services";
import { clientCreateSchema } from "@/lib/schemas";

export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const pageSize = Number(url.searchParams.get("pageSize")) || 25;
  const search = url.searchParams.get("search") ?? undefined;
  const sortBy = url.searchParams.get("sortBy") ?? undefined;
  const sortDir = (url.searchParams.get("sortDir") as "asc" | "desc") ?? undefined;

  const result = await clientService.list(session, { page, pageSize, search, sortBy, sortDir });
  return NextResponse.json(result);
});

export const POST = apiHandler(async (req) => {
  const session = await requireRole("operator");
  const body = await parseBody(req, clientCreateSchema);
  const client = await clientService.create(session, body);
  return NextResponse.json(client, { status: 201 });
});
