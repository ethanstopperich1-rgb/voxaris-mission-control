import { workspaceRepository } from "../repositories";
import { auditService } from "./audit.service";
import type { Workspace, SessionContext, ListParams, PaginatedResponse } from "@/lib/types";
import type { z } from "zod/v4";
import type { workspaceCreateSchema, workspaceUpdateSchema } from "@/lib/schemas";

export class WorkspaceService {
  async list(
    session: SessionContext,
    params: ListParams = {},
  ): Promise<PaginatedResponse<Workspace>> {
    return workspaceRepository.list({
      ...params,
      filters: { organization_id: session.organizationId },
    });
  }

  async getById(id: string): Promise<Workspace | null> {
    return workspaceRepository.findById(id);
  }

  async listByClient(clientId: string): Promise<Workspace[]> {
    return workspaceRepository.listByClient(clientId);
  }

  async create(
    session: SessionContext,
    data: z.infer<typeof workspaceCreateSchema>,
  ): Promise<Workspace> {
    const workspace = await workspaceRepository.create(
      data as Partial<Workspace>,
      session.organizationId,
    );

    await auditService.logAction(session, "workspace.created", "workspace", workspace.id, {
      newData: data as Record<string, unknown>,
    });

    return workspace;
  }

  async update(
    session: SessionContext,
    id: string,
    data: z.infer<typeof workspaceUpdateSchema>,
  ): Promise<Workspace> {
    const old = await workspaceRepository.findById(id);
    const workspace = await workspaceRepository.update(id, data as Partial<Workspace>);

    await auditService.logAction(session, "workspace.updated", "workspace", id, {
      oldData: old as unknown as Record<string, unknown>,
      newData: data as Record<string, unknown>,
    });

    return workspace;
  }

  async delete(session: SessionContext, id: string): Promise<void> {
    const old = await workspaceRepository.findById(id);
    await workspaceRepository.delete(id);

    await auditService.logAction(session, "workspace.deleted", "workspace", id, {
      oldData: old as unknown as Record<string, unknown>,
    });
  }
}

export const workspaceService = new WorkspaceService();
