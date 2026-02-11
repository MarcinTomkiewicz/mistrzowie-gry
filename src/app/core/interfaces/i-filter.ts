import { FilterOperator } from "../enums/filter-operators";

export interface IFilter {
    operator: FilterOperator;
    value: any;
  }
  
  export interface IFilters {
    [key: string]: IFilter;
  }