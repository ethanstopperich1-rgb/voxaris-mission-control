import { leadRepository } from "../repositories";
import { auditService } from "./audit.service";
import type { Lead, SessionContext, ListParams, PaginatedResponse } from "@/lib/types";
import type { z } from "zod/v4";
import type { leadCreateSchema, leadUpdateSchema, leadIngestSchema } from "@/lib/schemas";

export class LeadService {
  async list(
    session: SessionContext,
    params: ListParams & { workspace_id?: string; client_id?: string; status?: string } = {},
  ): Promise<PaginatedResponse<Lead>> {
    const filters: Record<string, unknown> = {
      organization_id: session.organizationId,
    };
    if (params.workspace_id) filters.workspace_id = params.workspace_id;
    if (params.client_id) filters.client_id = params.client_id;
    if (params.status) filters.status = params.status;

    return leadRepository.list({ ...params, filters });
  }

  async getById(id: string): Promise<Lead | null> {
    return leadRepository.findById(id);
  }

  async create(
    session: SessionContext,
    data: z.infer<typeof leadCreateSchema>,
  ): Promise<Lead> {
    const lead = await leadRepository.create(
      data as Partial<Lead>,
      session.organizationId,
    );

    await auditService.logAction(session, "lead.created", "lead", lead.id, {
      newData: data as Record<string, unknown>,
    });

    return lead;
  }

  async update(
    session: SessionContext,
    id: string,
    data: z.infer<typeof leadUpdateSchema>,
  ): Promise<Lead> {
    const old = await leadRepository.findById(id);
    const lead = await leadRepository.update(id, data as Partial<Lead>);

    await auditService.logAction(session, "lead.updated", "lead", id, {
      oldData: old as unknown as Record<string, unknown>,
      newData: data as Record<string, unknown>,
    });

    return lead;
  }

  /**
   * Ingest a lead from an external source (webhook/API).
   * Deduplicates by phone/email/external_id before creating.
   */
  async ingest(
    orgId: string,
    data: z.infer<typeof leadIngestSchema>,
  ): Promise<{ lead: Lead; created: boolean }> {
    const payload: Partial<Lead> = {
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      company: data.company ?? null,
      external_id: data.external_id ?? null,
      source: data.source,
      metadata: data.metadata ?? {},
      status: "new",
    };

    const result = await leadRepository.upsert(orgId, payload);

    // Log via service client (no user session for webhooks)
    await auditService.logAction(
      { userId: "system", organizationId: orgId, role: "owner", email: "system@voxaris.io" },
      result.created ? "lead.ingested" : "lead.updated_via_ingest",
      "lead",
      result.lead.id,
      { newData: data as Record<string, unknown>, metadata: { source: data.source } },
    );

    return result;
  }

  async delete(session: SessionContext, id: string): Promise<void> {
    const old = await leadRepository.findById(id);
    await leadRepository.delete(id);

    await auditService.logAction(session, "lead.deleted", "lead", id, {
      oldData: old as unknown as Record<string, unknown>,
    });
  }

  // --- Dashboard helpers ---

  async countToday(orgId: string): Promise<number> {
    return leadRepository.countToday(orgId);
  }

  async countUncontacted(orgId: string): Promise<number> {
    return leadRepository.countUncontacted(orgId);
  }
}

export const leadService = new LeadService();
