export type BillingUnit =
  | 'session'
  | 'hour'
  | 'month'
  | 'event'
  | 'package'
  | 'table'
  | 'table_hour'
  | 'facilitator'
  | 'participant'
  | 'piece'
  | 'day'
  | 'half_day'
  | 'night'
  | 'kilometer';

export type PercentageBasis =
  | 'base_service'
  | 'package'
  | 'table'
  | 'facilitator';

export type ActualCostBasis =
  | 'ticket'
  | 'accommodation'
  | 'documented_expense'
  | 'other';

export type FixedPrice = {
  type: 'fixed';
  amount: number;
  currency: 'PLN';
  unit: BillingUnit;
  note: string | null;
};

export type RangePrice = {
  type: 'range';
  minAmount: number;
  maxAmount: number;
  currency: 'PLN';
  unit: BillingUnit;
  note: string | null;
};

export type FromPrice = {
  type: 'from';
  amount: number;
  currency: 'PLN';
  unit: BillingUnit;
  note: string | null;
};

export type PercentagePrice = {
  type: 'percentage';
  value: number | null;
  minValue: number | null;
  maxValue: number | null;
  basis: PercentageBasis;
  note: string | null;
};

export type ActualCostPrice = {
  type: 'actual_cost';
  basis: ActualCostBasis;
  note: string;
};

export type CustomQuotePrice = {
  type: 'custom_quote';
  note: string;
};

export type Price =
  | FixedPrice
  | RangePrice
  | FromPrice
  | PercentagePrice
  | ActualCostPrice
  | CustomQuotePrice;

export type PriceType = Price['type'];

export type PricePresentation = {
  value: string;
  note: string | null;
};
