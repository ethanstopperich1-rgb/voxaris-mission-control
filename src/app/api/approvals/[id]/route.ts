import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/server/auth";
import { apiHandler, parseBody, errorResponse } from "@/server/api-helpers";
import { approvalService } from "@/server/services";
import { z } from "zod/v4";

type Ctx = { params: Promise<{ id: string }> };

const decisionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  await requireSession();
  const { id } = await params;
  const approval = await approvalService.getById(id);
  if (!approval) return errorResponse("Approval not found", 404);
  return NextResponse.json(approval);
});

export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  const session = await requireRole("operator");
  const { id } = await params;
  const body = await parseBody(req, decisionSchema);

  const result = body.action === "approve"
    ? await approvalService.approve(session, id, body.reason)
    : await approvalService.reject(session, id, body.reason);

  return NextResponse.json(result);
});
