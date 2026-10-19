import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListParams, PaginatedResponse } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 25;

/**
 * Base repository providing common CRUD operations against a Supabase table.
 * All queries are scoped to the user's organization via RLS.
 */
export class BaseRepository<T extends { id: string }> {
  constructor(protected tableName: string) {}

  protected async getClient(): Promise<SupabaseClient> {
    return createClient();
  }

  /** Bypass RLS — only for webhooks / service-level operations. */
  protected getServiceClient(): SupabaseClient {
    return createServiceClient();
  }

  async findById(id: string, select = "*"): Promise<T | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select(select)
      .eq("id", id)
      .single();
    if (error) return null;
    return data as unknown as T;
  }

  async list(
    params: ListParams & { filters?: Record<string, unknown> } = {},
    select = "*",
  ): Promise<PaginatedResponse<T>> {
    const supabase = await this.getClient();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from(this.tableName)
      .select(select, { count: "exact" });

    // Apply equality filters
    if (params.filters) {
      for (const [key, value] of Object.entries(params.filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
    }

    // Apply search if provided (subclasses should override for specific columns)
    if (params.search) {
      query = query.or(this.buildSearchFilter(params.search));
    }

    // Sort
    const sortBy = params.sortBy ?? "created_at";
    const ascending = params.sortDir === "asc";
    query = query.order(sortBy, { ascending }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(`List ${this.tableName}: ${error.message}`);

    const totalCount = count ?? 0;
    return {
      data: (data ?? []) as unknown as T[],
      count: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  async create(
    payload: Partial<T>,
    orgId?: string,
  ): Promise<T> {
    const supabase = await this.getClient();
    const data: Record<string, unknown> = { ...payload };
    if (orgId) data.organization_id = orgId;

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Create ${this.tableName}: ${error.message}`);
    return result as unknown as T;
  }

  async update(id: string, payload: Partial<T>): Promise<T> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .update(payload as Record<string, unknown>)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Update ${this.tableName}: ${error.message}`);
    return data as unknown as T;
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Delete ${this.tableName}: ${error.message}`);
  }

  /** Override in subclasses to define which columns to search. */
  protected buildSearchFilter(_search: string): string {
    return `id.neq.00000000-0000-0000-0000-000000000000`;
  }
}
