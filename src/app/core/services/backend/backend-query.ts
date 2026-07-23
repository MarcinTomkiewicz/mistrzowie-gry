import { FilterOperator } from '../../enums/filter-operators';
import { BackendFilterQuery } from '../../types/backend';
import { FilterDefinition } from '../../types/filter';
import { toSnakeKey } from './backend-mapping';

export function applyFilters<TQuery extends BackendFilterQuery<TQuery>>(
  query: TQuery,
  filters?: Readonly<Record<string, FilterDefinition>>,
): TQuery {
  if (!filters) return query;

  let filteredQuery = query;

  for (const [key, filterDefinition] of Object.entries(filters)) {
    const normalizedFilters = Array.isArray(filterDefinition)
      ? filterDefinition
      : [filterDefinition];

    for (const filter of normalizedFilters) {
      if (filter.value === undefined) continue;

      const operator = filter.operator ?? FilterOperator.EQ;
      const snakeKey = toSnakeKey(key);

      switch (operator) {
        case FilterOperator.EQ:
          filteredQuery = filteredQuery.eq(snakeKey, filter.value);
          break;
        case FilterOperator.GTE:
          filteredQuery = filteredQuery.gte(snakeKey, filter.value);
          break;
        case FilterOperator.LTE:
          filteredQuery = filteredQuery.lte(snakeKey, filter.value);
          break;
        case FilterOperator.GT:
          filteredQuery = filteredQuery.gt(snakeKey, filter.value);
          break;
        case FilterOperator.LT:
          filteredQuery = filteredQuery.lt(snakeKey, filter.value);
          break;
        case FilterOperator.LIKE:
          filteredQuery = filteredQuery.like(snakeKey, filter.value);
          break;
        case FilterOperator.IN:
          filteredQuery = filteredQuery.in(snakeKey, filter.value);
          break;
        case FilterOperator.IS:
          filteredQuery = filteredQuery.is(snakeKey, filter.value);
          break;
        case FilterOperator.NE:
          filteredQuery = filteredQuery.neq(snakeKey, filter.value);
          break;
        default:
          throw new Error(`Unsupported filter operator: ${operator}`);
      }
    }
  }

  return filteredQuery;
}
