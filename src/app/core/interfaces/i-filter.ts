import { FilterOperator } from '../enums/filter-operators';

export interface IFilter {
  operator?: FilterOperator;
  value: unknown;
}
