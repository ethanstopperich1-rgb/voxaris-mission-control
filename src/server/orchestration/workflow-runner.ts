// =============================================================================
// WorkflowRunner — executes a workflow run step by step
// =============================================================================

import { createServiceClient } from "@/lib/supabase/service";
import { executeStep, type StepDefinition } from "./step-executor";

interface WorkflowRunContext {
  workflowRunId: string;
  organizationId: string;
  workspaceId?: string;
  leadId?: string;
}

/**
 * Execute a workflow run step-by-step.
 * Records each step run in mc_workflow_step_runs.
 * Pauses if a step returns 'paused' (e.g., awaiting approval).
 */
export async function runWorkflow(
  context: WorkflowRunContext,
): Promise<{ status: "completed" | "failed" | "paused"; error?: string }> {
  const service = createServiceClient();

  // Fetch the workflow run
  const { data: run } = await service
    .from("mc_workflow_runs")
    .select("*, mc_workflows(steps)")
    .eq("id", context.workflowRunId)
    .single();

  if (!run) return { status: "failed", error: "Workflow run not found" };

  const steps = (run.mc_workflows?.steps ?? run.steps ?? []) as StepDefinition[];
  if (steps.length === 0) {
    await service
      .from("mc_workflow_runs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", context.workflowRunId);
    return { status: "completed" };
  }

  // Mark run as running
  await service
    .from("mc_workflow_runs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", context.workflowRunId);

  // Find already-completed steps to resume from
  const { data: existingStepRuns } = await service
    .from("mc_workflow_step_runs")
    .select("step_key, status")
    .eq("workflow_run_id", context.workflowRunId)
    .order("created_at", { ascending: true });

  const completedSteps = new Set(
    (existingStepRuns ?? [])
      .filter((sr: Record<string, unknown>) => sr.status === "completed")
      .map((sr: Record<string, unknown>) => sr.step_key),
  );

  let currentInput = (run.input as Record<string, unknown>) ?? {};
  let stepsCompleted = completedSteps.size;

  for (const step of steps) {
    // Skip already completed steps (resume support)
    if (completedSteps.has(step.key)) continue;

    const stepStartedAt = new Date().toISOString();

    // Create step run record
    const { data: stepRun } = await service
      .from("mc_workflow_step_runs")
      .insert({
        organization_id: context.organizationId,
        workflow_run_id: context.workflowRunId,
        step_key: step.key,
        step_type: step.type,
        status: "running",
        input: currentInput,
        started_at: stepStartedAt,
      })
      .select("id")
      .single();

    // Execute the step
    const result = await executeStep(step, currentInput, {
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      workflowRunId: context.workflowRunId,
      leadId: context.leadId,
    });

    const completedAt = new Date().toISOString();

    // Update step run
    if (stepRun) {
      await service
        .from("mc_workflow_step_runs")
        .update({
          status: result.status,
          output: result.output,
          error: result.error ?? null,
          completed_at: completedAt,
        })
        .eq("id", stepRun.id);
    }

    if (result.status === "failed") {
      // Mark the workflow run as failed
      await service
        .from("mc_workflow_runs")
        .update({
          status: "failed",
          error: result.error ?? `Step ${step.key} failed`,
          steps_completed: stepsCompleted,
          completed_at: completedAt,
        })
        .eq("id", context.workflowRunId);

      return { status: "failed", error: result.error };
    }

    if (result.status === "paused") {
      // Mark the workflow run as paused (e.g., awaiting approval)
      await service
        .from("mc_workflow_runs")
        .update({
          status: "pending",
          steps_completed: stepsCompleted,
          output: { paused_at_step: step.key, ...result.output },
        })
        .eq("id", context.workflowRunId);

      return { status: "paused" };
    }

    // Step completed — carry output forward
    currentInput = result.output;
    stepsCompleted++;

    // Update run progress
    await service
      .from("mc_workflow_runs")
      .update({ steps_completed: stepsCompleted })
      .eq("id", context.workflowRunId);
  }

  // All steps completed
  await service
    .from("mc_workflow_runs")
    .update({
      status: "completed",
      output: currentInput,
      steps_completed: stepsCompleted,
      completed_at: new Date().toISOString(),
    })
    .eq("id", context.workflowRunId);

  return { status: "completed" };
}

/**
 * Resume a paused workflow run (e.g., after approval).
 */
export async function resumeWorkflow(workflowRunId: string): Promise<{
  status: "completed" | "failed" | "paused";
  error?: string;
}> {
  const service = createServiceClient();

  const { data: run } = await service
    .from("mc_workflow_runs")
    .select("*")
    .eq("id", workflowRunId)
    .single();

  if (!run) return { status: "failed", error: "Workflow run not found" };
  if (run.status !== "pending") {
    return { status: "failed", error: `Cannot resume: run is ${run.status}` };
  }

  return runWorkflow({
    workflowRunId,
    organizationId: run.organization_id,
    workspaceId: run.workspace_id ?? undefined,
    leadId: (run.input as Record<string, unknown>)?.lead_id as string | undefined,
  });
}
