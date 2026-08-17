import { inject, Injectable, PendingTasks } from '@angular/core';
import {
  FunctionInvokeOptions,
  PostgrestError,
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js';
import { defer, from, Observable, of, throwError } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { toCamelCase, toSnakeCase, toSnakeKey } from './backend-mapping';
import { applyFilters } from './backend-query';
import { Supabase } from '../supabase/supabase';

import { IFilter } from '../../interfaces/i-filter';
import { FilterOperator } from '../../enums/filter-operators';
import { Pagination } from '../../types/backend';
import { EdgeReader } from '../../types/edge-contract';
import { EdgeInvokeOptions } from '../../types/edge-http-method';
import { FilterDefinition } from '../../types/filter';
import { RpcError } from '../../types/rpc-error';
import { isEdgeFunctionSuccess } from '../../utils/edge-contract';
import { createEdgeFunctionError } from '../../utils/edge-function-error-mapping';

@Injectable({ providedIn: 'root' })
export class Backend {
  private readonly supabase = inject(Supabase).client();
  private readonly pendingTasks = inject(PendingTasks);

  rpc<TResult>(
    functionName: string,
    args?: Record<string, unknown>,
  ): Observable<TResult> {
    return this.trackedRequest<PostgrestSingleResponse<TResult>>(() =>
      this.supabase.rpc(functionName, args),
    ).pipe(
      map((res) => {
        if (res.error) {
          throw new RpcError(
            res.error.code,
            res.error.message,
            res.error.details,
            res.error.hint,
            res.error,
          );
        }

        return res.data;
      }),
    );
  }

  invokeEdge<TResult, TBody = never>(
    functionName: string,
    options: EdgeInvokeOptions<TBody>,
  ): Observable<TResult> {
    return this.trackedRequest<TResult>(async () => {
      const invokeOptions: FunctionInvokeOptions = { method: options.method };

      if (options.method !== 'GET' && options.body !== undefined) {
        Object.assign(invokeOptions, { body: options.body });
      }

      const response = await this.supabase.functions.invoke<TResult>(
        functionName,
        invokeOptions,
      );

      if (!isEdgeFunctionSuccess(response)) {
        throw await createEdgeFunctionError(response.error);
      }

      return response.data;
    });
  }

  invokeEdgeParsed<TResult, TBody = never>(
    functionName: string,
    options: EdgeInvokeOptions<TBody>,
    reader: EdgeReader<TResult>,
  ): Observable<TResult> {
    return this.invokeEdge<unknown, TBody>(functionName, options).pipe(
      map((response) => reader(response, 'response')),
    );
  }

  getAll<T extends object>(opts: {
    table: string;
    joins?: string;
    sortBy?: keyof T;
    sortOrder?: 'asc' | 'desc';
    pagination?: Pagination;
    range?: { from: number; to: number };
  }): Observable<T[]> {
    const { table, joins, sortBy, sortOrder = 'asc', pagination, range } = opts;

    return this.trackedRequest<PostgrestResponse<unknown>>(() => {
      const select = joins ? `*, ${joins}` : '*';
      let query = this.supabase.from(table).select(select);

      query = applyFilters(query, pagination?.filters);

      if (sortBy) {
        query = query.order(toSnakeKey(String(sortBy)), { ascending: sortOrder === 'asc' });
      }

      if (range) {
        query = query.range(range.from, range.to);
      } else if (pagination?.page !== undefined && pagination?.pageSize !== undefined) {
        const fromIndex = (pagination.page - 1) * pagination.pageSize;
        const toIndex = fromIndex + pagination.pageSize - 1;
        query = query.range(fromIndex, toIndex);
      } else {
        query = query.range(0, 999);
      }

      return query;
    }).pipe(
      map((res) => this.unwrapList<T>(res)),
    );
  }

  getById<T extends object>(table: string, id: string | number): Observable<T | null> {
    return this.getOneByFields<T>(table, { id });
  }

  getBySlug<T extends object>(table: string, slug: string): Observable<T | null> {
    return this.getOneByFields<T>(table, { slug });
  }

  getOneByFields<T extends object>(
    table: string,
    filters: Record<string, unknown>,
  ): Observable<T | null> {
    return this.trackedRequest<PostgrestSingleResponse<unknown>>(() => {
      let query = this.supabase.from(table).select('*');

      const iFilters: Record<string, IFilter> = {};
      for (const [key, value] of Object.entries(filters)) {
        iFilters[key] = { operator: FilterOperator.EQ, value };
      }
      query = applyFilters(query, iFilters);

      return query.maybeSingle();
    }).pipe(
      map((res) => {
        this.throwPostgrestError(res.error);
        return res.data ? toCamelCase<T>(res.data) : null;
      }),
    );
  }

  getCount(
    table: string,
    filters?: Readonly<Record<string, FilterDefinition>>,
  ): Observable<number> {
    return this.trackedRequest<PostgrestResponse<unknown>>(() => {
      let query = this.supabase.from(table).select('*', { count: 'exact', head: true });
      query = applyFilters(query, filters);
      return query;
    }).pipe(
      map((res) => {
        this.throwPostgrestError(res.error);
        return res.count ?? 0;
      }),
    );
  }

  getByIds<T extends object>(table: string, ids: Array<string | number>): Observable<T[]> {
    if (!ids.length) return of([]);
    return this.trackedRequest<PostgrestResponse<unknown>>(() =>
      this.supabase.from(table).select('*').in('id', ids),
    ).pipe(
      map((res) => this.unwrapList<T>(res)),
    );
  }

  create<TResult extends object, TPayload extends object = TResult>(
    table: string,
    data: TPayload,
  ): Observable<TResult> {
    const snake = toSnakeCase<Record<string, unknown>>(data);
    return this.trackedRequest<PostgrestSingleResponse<unknown>>(() =>
      this.supabase.from(table).insert(snake).select('*').single(),
    ).pipe(
      map((res) => this.unwrapRequired<TResult>(res)),
    );
  }

  createMany<T extends object>(table: string, data: T[]): Observable<T[]> {
    if (!data.length) return of([]);
    const snake = toSnakeCase<Record<string, unknown>[]>(data);
    return this.trackedRequest<PostgrestResponse<unknown>>(() =>
      this.supabase.from(table).insert(snake).select('*'),
    ).pipe(
      map((res) => this.unwrapList<T>(res)),
    );
  }

  update<T extends object>(table: string, id: string | number, patch: Partial<T>): Observable<T> {
    const snake = toSnakeCase<Record<string, unknown>>(patch);
    return this.trackedRequest<PostgrestSingleResponse<unknown>>(() =>
      this.supabase.from(table).update(snake).eq('id', id).select('*').single(),
    ).pipe(
      map((res) => this.unwrapRequired<T>(res)),
    );
  }

  upsert<T extends object>(table: string, data: T, conflictTarget: string = 'id'): Observable<T> {
    const snake = toSnakeCase<Record<string, unknown>>(data);
    return this.trackedRequest<PostgrestSingleResponse<unknown>>(() =>
      this.supabase.from(table).upsert(snake, { onConflict: conflictTarget }).select('*').single(),
    ).pipe(
      map((res) => this.unwrapRequired<T>(res)),
    );
  }

  upsertMany<T extends object>(table: string, data: T[], conflictTarget: string = 'id'): Observable<T[]> {
    if (!data.length) return of([]);
    const snake = toSnakeCase<Record<string, unknown>[]>(data);
    return this.trackedRequest<PostgrestResponse<unknown>>(() =>
      this.supabase.from(table).upsert(snake, { onConflict: conflictTarget }).select('*'),
    ).pipe(
      map((res) => this.unwrapList<T>(res)),
    );
  }

  delete(
    table: string,
    filters: string | number | Readonly<Record<string, FilterDefinition>>,
  ): Observable<void> {
    return this.trackedRequest<PostgrestSingleResponse<null>>(() => {
      let query = this.supabase.from(table).delete();
      query = typeof filters === 'object'
        ? applyFilters(query, filters)
        : applyFilters(query, { id: { operator: FilterOperator.EQ, value: filters } });

      return query;
    }).pipe(
      map((res) => this.throwPostgrestError(res.error)),
    );
  }

  private unwrapRequired<TResult extends object>(
    response: PostgrestSingleResponse<unknown>,
  ): TResult {
    this.throwPostgrestError(response.error);
    return toCamelCase<TResult>(response.data);
  }

  private unwrapList<TResult extends object>(
    response: PostgrestResponse<unknown>,
  ): TResult[] {
    this.throwPostgrestError(response.error);
    return (response.data ?? []).map((item) => toCamelCase<TResult>(item));
  }

  private throwPostgrestError(error: PostgrestError | null): void {
    if (error) {
      throw new Error(error.message);
    }
  }

  private trackedRequest<TResult>(
    requestFactory: () => PromiseLike<TResult>,
  ): Observable<TResult> {
    return defer(() => {
      const removePendingTask = this.pendingTasks.add();
      let released = false;
      const releasePendingTask = () => {
        if (released) return;

        released = true;
        removePendingTask();
      };

      try {
        return from(requestFactory()).pipe(finalize(releasePendingTask));
      } catch (error) {
        return throwError(() => error).pipe(finalize(releasePendingTask));
      }
    });
  }
}
