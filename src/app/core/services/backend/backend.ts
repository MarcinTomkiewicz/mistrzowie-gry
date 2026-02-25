// path: src/core/services/backend/backend.ts
import { inject, Injectable } from '@angular/core';
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { applyFilters } from '../../utils/query';
import { toCamelCase, toSnakeCase, toSnakeKey } from '../../utils/type-mappings';
import { Supabase } from '../supabase/supabase';

import { IFilter } from '../../interfaces/i-filter';
import { FilterOperator } from '../../enums/filter-operators';

export type Pagination = {
  page?: number;
  pageSize?: number;
  filters?: Record<string, IFilter>;
};

@Injectable({ providedIn: 'root' })
export class Backend {
  private readonly supabase = inject(Supabase).client();

  getAll<T extends object>(opts: {
    table: string;
    joins?: string;
    sortBy?: keyof T;
    sortOrder?: 'asc' | 'desc';
    pagination?: Pagination;
    range?: { from: number; to: number };
  }): Observable<T[]> {
    const { table, joins, sortBy, sortOrder = 'asc', pagination, range } = opts;

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

    return from(query).pipe(
      map((res: PostgrestResponse<any>) => {
        if (res.error) throw new Error(res.error.message);
        return (res.data ?? []).map((x) => toCamelCase<T>(x));
      }),
    );
  }

  getById<T extends object>(table: string, id: string | number): Observable<T | null> {
    let query = this.supabase.from(table).select('*');
    query = applyFilters(query, {
      id: { operator: FilterOperator.EQ, value: id },
    });
    return from(query.maybeSingle()).pipe(
      map((res: PostgrestSingleResponse<any>) => {
        if (res.error) throw new Error(res.error.message);
        return res.data ? toCamelCase<T>(res.data) : null;
      }),
    );
  }

  getBySlug<T extends object>(table: string, slug: string): Observable<T | null> {
    let query = this.supabase.from(table).select('*');
    query = applyFilters(query, {
      slug: { operator: FilterOperator.EQ, value: slug },
    });
    return from(query.maybeSingle()).pipe(
      map((res: PostgrestSingleResponse<any>) => {
        if (res.error) throw new Error(res.error.message);
        return res.data ? toCamelCase<T>(res.data) : null;
      }),
    );
  }

  getOneByFields<T extends object>(
    table: string,
    filters: Record<string, unknown>,
  ): Observable<T | null> {
    let query = this.supabase.from(table).select('*');

    const iFilters: Record<string, IFilter> = {};
    for (const [key, value] of Object.entries(filters)) {
      iFilters[key] = { operator: FilterOperator.EQ, value };
    }
    query = applyFilters(query, iFilters);

    return from(query.maybeSingle()).pipe(
      map((res: PostgrestSingleResponse<any>) => {
        if (res.error) throw new Error(res.error.message);
        return res.data ? toCamelCase<T>(res.data) : null;
      }),
    );
  }

  getCount(table: string, filters?: Record<string, IFilter>): Observable<number> {
    let query = this.supabase.from(table).select('*', { count: 'exact', head: true });
    query = applyFilters(query, filters);
    return from(query).pipe(
      map((res: PostgrestResponse<any>) => {
        if (res.error) throw new Error(res.error.message);
        return res.count ?? 0;
      }),
    );
  }

  getByIds<T extends object>(table: string, ids: Array<string | number>): Observable<T[]> {
    if (!ids.length) return of([]);
    return from(this.supabase.from(table).select('*').in('id', ids as any)).pipe(
      map((res: PostgrestResponse<any>) => {
        if (res.error) throw new Error(res.error.message);
        return (res.data ?? []).map((x) => toCamelCase<T>(x));
      }),
    );
  }

  create<T extends object>(table: string, data: T): Observable<T> {
    const snake = toSnakeCase(data);
    return from(this.supabase.from(table).insert(snake).select('*').single()).pipe(
      map((res: PostgrestSingleResponse<any>) => {
        if (res.error) throw new Error(res.error.message);
        return toCamelCase<T>(res.data);
      }),
    );
  }

  createMany<T extends object>(table: string, data: T[]): Observable<T[]> {
    if (!data.length) return of([]);
    const snake = toSnakeCase(data);
    return from(this.supabase.from(table).insert(snake).select('*')).pipe(
      map((res: PostgrestResponse<any>) => {
        if (res.error) throw new Error(res.error.message);
        return (res.data ?? []).map((x) => toCamelCase<T>(x));
      }),
    );
  }

  update<T extends object>(table: string, id: string | number, patch: Partial<T>): Observable<T> {
    const snake = toSnakeCase(patch);
    return from(this.supabase.from(table).update(snake).eq('id', id).select('*').single()).pipe(
      map((res: PostgrestSingleResponse<any>) => {
        if (res.error) throw new Error(res.error.message);
        return toCamelCase<T>(res.data);
      }),
    );
  }

  upsert<T extends object>(table: string, data: T, conflictTarget: string = 'id'): Observable<T> {
    const snake = toSnakeCase(data);
    return from(
      this.supabase.from(table).upsert(snake, { onConflict: conflictTarget }).select('*').single(),
    ).pipe(
      map((res: PostgrestSingleResponse<any>) => {
        if (res.error) throw new Error(res.error.message);
        return toCamelCase<T>(res.data);
      }),
    );
  }

  upsertMany<T extends object>(table: string, data: T[], conflictTarget: string = 'id'): Observable<T[]> {
    if (!data.length) return of([]);
    const snake = toSnakeCase(data);
    return from(this.supabase.from(table).upsert(snake, { onConflict: conflictTarget }).select('*')).pipe(
      map((res: PostgrestResponse<any>) => {
        if (res.error) throw new Error(res.error.message);
        return (res.data ?? []).map((x) => toCamelCase<T>(x));
      }),
    );
  }

  delete(table: string, filters: string | number | Record<string, IFilter>): Observable<void> {
    let query = this.supabase.from(table).delete();
    query = typeof filters === 'object'
      ? applyFilters(query, filters)
      : applyFilters(query, { id: { operator: FilterOperator.EQ, value: filters } });

    return from(query).pipe(
      map((res: any) => {
        if (res.error) throw new Error(res.error.message);
        return void 0;
      }),
    );
  }
}
