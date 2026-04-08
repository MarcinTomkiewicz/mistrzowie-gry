import { FilterOperator } from "../enums/filter-operators";

export interface IFilter {
    operator: FilterOperator;
    value: any;
  }

export type FilterDefinition = IFilter | IFilter[];
  
  export interface IFilters {
    [key: string]: FilterDefinition;
  }
