import { FilterDefinition } from '../interfaces/i-filter';

export type Pagination = {
  page?: number;
  pageSize?: number;
  filters?: Record<string, FilterDefinition>;
};

export type BackendFilterQuery<TQuery> = {
  eq(column: string, value: unknown): TQuery;
  gte(column: string, value: unknown): TQuery;
  lte(column: string, value: unknown): TQuery;
  gt(column: string, value: unknown): TQuery;
  lt(column: string, value: unknown): TQuery;
  like(column: string, pattern: unknown): TQuery;
  in(column: string, values: unknown): TQuery;
  is(column: string, value: unknown): TQuery;
  neq(column: string, value: unknown): TQuery;
};
