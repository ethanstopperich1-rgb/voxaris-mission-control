import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/server/auth";
import { apiHandler, parseBody } from "@/server/api-helpers";
import { workflowService } from "@/server/services";
import { workflowRunTriggerSchema } from "@/lib/schemas";
import { runWorkflow } from "@/server/orchestration";

export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const pageSize = Number(url.searchParams.get("pageSize")) || 25;
  const workflow_id = url.searchParams.get("workflow_id") ?? undefined;

  const result = await workflowService.listRuns(session, { page, pageSize, workflow_id });
  return NextResponse.json(result);
});

/** Trigger a manual workflow run and execute steps. */
export const POST = apiHandler(async (req) => {
  const session = await requireRole("operator");
  const body = await parseBody(req, workflowRunTriggerSchema);
  const run = await workflowService.triggerRun(session, body.workflow_id, body.input ?? {});

  // Execute the workflow steps (non-blocking for fast response)
  // In production, this should be a background job
  runWorkflow({
    workflowRunId: run.id,
    organizationId: session.organizationId,
    workspaceId: (run as unknown as Record<string, unknown>).workspace_id as string | undefined,
    leadId: (body.input?.lead_id as string) ?? undefined,
  }).catch((err) => {
    console.error(`[WorkflowRunner] Failed to run workflow ${run.id}:`, err);
  });

  return NextResponse.json(run, { status: 201 });
});
