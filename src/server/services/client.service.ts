import { clientRepository } from "../repositories";
import { auditService } from "./audit.service";
import type { Client, SessionContext, ListParams, PaginatedResponse } from "@/lib/types";
import type { z } from "zod/v4";
import type { clientCreateSchema, clientUpdateSchema } from "@/lib/schemas";

export class ClientService {
  async list(
    session: SessionContext,
    params: ListParams = {},
  ): Promise<PaginatedResponse<Client>> {
    return clientRepository.list({
      ...params,
      filters: { organization_id: session.organizationId },
    });
  }

  async getById(id: string): Promise<Client | null> {
    return clientRepository.findById(id);
  }

  async getBySlug(slug: string): Promise<Client | null> {
    return clientRepository.findBySlug(slug);
  }

  async create(
    session: SessionContext,
    data: z.infer<typeof clientCreateSchema>,
  ): Promise<Client> {
    const client = await clientRepository.create(
      data as Partial<Client>,
      session.organizationId,
    );

    await auditService.logAction(session, "client.created", "client", client.id, {
      newData: data as Record<string, unknown>,
    });

    return client;
  }

  async update(
    session: SessionContext,
    id: string,
    data: z.infer<typeof clientUpdateSchema>,
  ): Promise<Client> {
    const old = await clientRepository.findById(id);
    const client = await clientRepository.update(id, data as Partial<Client>);

    await auditService.logAction(session, "client.updated", "client", id, {
      oldData: old as unknown as Record<string, unknown>,
      newData: data as Record<string, unknown>,
    });

    return client;
  }

  async delete(session: SessionContext, id: string): Promise<void> {
    const old = await clientRepository.findById(id);
    await clientRepository.delete(id);

    await auditService.logAction(session, "client.deleted", "client", id, {
      oldData: old as unknown as Record<string, unknown>,
    });
  }

  async listForDashboard(orgId: string): Promise<Client[]> {
    return clientRepository.listWithCounts(orgId);
  }
}

export const clientService = new ClientService();
