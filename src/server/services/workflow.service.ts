import { workflowRepository, workflowRunRepository } from "../repositories";
import { auditService } from "./audit.service";
import type {
  Workflow,
  WorkflowRun,
  SessionContext,
  ListParams,
  PaginatedResponse,
} from "@/lib/types";
import type { z } from "zod/v4";
import type { workflowCreateSchema, workflowUpdateSchema } from "@/lib/schemas";

export class WorkflowService {
  async list(
    session: SessionContext,
    params: ListParams = {},
  ): Promise<PaginatedResponse<Workflow>> {
    return workflowRepository.list({
      ...params,
      filters: { organization_id: session.organizationId },
    });
  }

  async getById(id: string): Promise<Workflow | null> {
    return workflowRepository.findById(id);
  }

  async create(
    session: SessionContext,
    data: z.infer<typeof workflowCreateSchema>,
  ): Promise<Workflow> {
    const workflow = await workflowRepository.create(
      { ...data, created_by: session.userId } as Partial<Workflow>,
      session.organizationId,
    );

    await auditService.logAction(session, "workflow.created", "workflow", workflow.id, {
      newData: data as Record<string, unknown>,
    });

    return workflow;
  }

  async update(
    session: SessionContext,
    id: string,
    data: z.infer<typeof workflowUpdateSchema>,
  ): Promise<Workflow> {
    const old = await workflowRepository.findById(id);
    const workflow = await workflowRepository.update(id, data as Partial<Workflow>);

    await auditService.logAction(session, "workflow.updated", "workflow", id, {
      oldData: old as unknown as Record<string, unknown>,
      newData: data as Record<string, unknown>,
    });

    return workflow;
  }

  async delete(session: SessionContext, id: string): Promise<void> {
    await workflowRepository.delete(id);
    await auditService.logAction(session, "workflow.deleted", "workflow", id);
  }

  // --- Workflow Runs ---

  async triggerRun(
    session: SessionContext,
    workflowId: string,
    input: Record<string, unknown> = {},
  ): Promise<WorkflowRun> {
    const workflow = await workflowRepository.findById(workflowId);
    if (!workflow) throw new Error("Workflow not found");

    const stepsTotal = (workflow.steps ?? []).length;

    const run = await workflowRunRepository.create(
      {
        workflow_id: workflowId,
        status: "pending",
        trigger_type: "manual",
        triggered_by: session.userId,
        input,
        output: {},
        steps_completed: 0,
        steps_total: stepsTotal,
      } as Partial<WorkflowRun>,
      session.organizationId,
    );

    await auditService.logAction(session, "workflow_run.triggered", "workflow_run", run.id, {
      metadata: { workflow_id: workflowId, trigger: "manual" },
    });

    return run;
  }

  async listRuns(
    session: SessionContext,
    params: ListParams & { workflow_id?: string } = {},
  ): Promise<PaginatedResponse<WorkflowRun>> {
    const filters: Record<string, unknown> = {
      organization_id: session.organizationId,
    };
    if (params.workflow_id) filters.workflow_id = params.workflow_id;
    return workflowRunRepository.list({ ...params, filters });
  }

  async getRunById(id: string): Promise<WorkflowRun | null> {
    return workflowRunRepository.findById(id);
  }

  async updateRunStatus(
    runId: string,
    status: WorkflowRun["status"],
    output?: Record<string, unknown>,
    error?: string,
  ): Promise<WorkflowRun> {
    const updates: Partial<WorkflowRun> = { status };
    if (output) updates.output = output;
    if (error) updates.error = error;
    if (status === "running") updates.started_at = new Date().toISOString();
    if (status === "completed" || status === "failed" || status === "cancelled") {
      updates.completed_at = new Date().toISOString();
    }
    return workflowRunRepository.update(runId, updates);
  }

  async countFailed(orgId: string): Promise<number> {
    return workflowRunRepository.countFailed(orgId);
  }
}

export const workflowService = new WorkflowService();
