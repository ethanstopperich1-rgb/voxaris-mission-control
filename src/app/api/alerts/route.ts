import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth";
import { apiHandler } from "@/server/api-helpers";
import { alertService } from "@/server/services";

export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Number(searchParams.get("limit")) || 20);

  const alerts = await alertService.listRecent(session.organizationId, limit);
  const counts = await alertService.countOpen(session.organizationId);

  return NextResponse.json({ data: alerts, openCounts: counts });
});
