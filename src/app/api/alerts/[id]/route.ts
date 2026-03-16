import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/server/auth";
import { apiHandler, parseBody, errorResponse } from "@/server/api-helpers";
import { alertService } from "@/server/services";
import { z } from "zod/v4";

type Ctx = { params: Promise<{ id: string }> };

const alertActionSchema = z.object({
  action: z.enum(["acknowledge", "resolve", "snooze"]),
});

export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  await requireSession();
  const { id } = await params;
  const alert = await alertService.getById(id);
  if (!alert) return errorResponse("Alert not found", 404);
  return NextResponse.json(alert);
});

export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  await requireRole("operator");
  const { id } = await params;
  const body = await parseBody(req, alertActionSchema);

  switch (body.action) {
    case "acknowledge":
      await alertService.acknowledge(id);
      break;
    case "resolve":
      await alertService.resolve(id);
      break;
    case "snooze":
      await alertService.snooze(id);
      break;
  }

  const updated = await alertService.getById(id);
  if (!updated) return errorResponse("Alert not found", 404);
  return NextResponse.json(updated);
});
