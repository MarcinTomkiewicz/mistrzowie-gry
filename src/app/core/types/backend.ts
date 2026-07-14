import { FilterDefinition } from '../interfaces/i-filter';

export type Pagination = {
  page?: number;
  pageSize?: number;
  filters?: Record<string, FilterDefinition>;
};
