import { NextResponse } from "next/server";
import { requireSession, requireRole } from "@/server/auth";
import { apiHandler, parseBody } from "@/server/api-helpers";
import { paperclipTaskService } from "@/server/services";
import { z } from "zod/v4";

const taskCreateSchema = z.object({
  workspace_id: z.uuid().optional(),
  worker_id: z.uuid().optional(),
  title: z.string().min(1).max(500),
  goal: z.string().min(1),
  input: z.record(z.string(), z.unknown()).optional(),
  requires_approval: z.boolean().optional(),
  budget: z.number().min(0).optional(),
});

export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");
  const limit = Math.min(100, Number(searchParams.get("limit")) || 20);

  const tasks = workspaceId
    ? await paperclipTaskService.listByWorkspace(session.organizationId, workspaceId)
    : await paperclipTaskService.listRecent(session.organizationId, limit);

  return NextResponse.json({ data: tasks });
});

export const POST = apiHandler(async (req) => {
  const session = await requireRole("operator");
  const body = await parseBody(req, taskCreateSchema);

  const task = await paperclipTaskService.createTask(session, {
    workspaceId: body.workspace_id,
    workerId: body.worker_id,
    title: body.title,
    goal: body.goal,
    input: body.input ?? {},
    requiresApproval: body.requires_approval,
    budget: body.budget,
  });

  return NextResponse.json(task, { status: 201 });
});
