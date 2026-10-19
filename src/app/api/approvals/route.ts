import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth";
import { apiHandler, parseBody, errorResponse } from "@/server/api-helpers";
import { approvalService } from "@/server/services";
import { z } from "zod/v4";

const approvalRequestSchema = z.object({
  workspace_id: z.uuid().optional(),
  related_type: z.string().min(1),
  related_id: z.string().min(1),
  approval_type: z.string().min(1),
  requested_by_type: z.enum(["user", "agent", "system"]).optional(),
  reason: z.string().optional(),
  expires_in_minutes: z.number().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const workspaceId = searchParams.get("workspace_id") ?? undefined;
  const limit = Math.min(100, Number(searchParams.get("limit")) || 25);

  const approvals = await approvalService.list(
    session.organizationId,
    { status, workspaceId },
    limit,
  );

  return NextResponse.json({ data: approvals });
});

export const POST = apiHandler(async (req) => {
  const session = await requireSession();
  const body = await parseBody(req, approvalRequestSchema);

  const approval = await approvalService.request(session, {
    workspaceId: body.workspace_id,
    relatedType: body.related_type,
    relatedId: body.related_id,
    approvalType: body.approval_type,
    requestedByType: body.requested_by_type ?? "user",
    reason: body.reason,
    expiresInMinutes: body.expires_in_minutes,
    metadata: body.metadata,
  });

  return NextResponse.json(approval, { status: 201 });
});
