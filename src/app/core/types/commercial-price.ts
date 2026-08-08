export type CommercialBillingUnit =
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

export type CommercialPercentageBasis =
  | 'base_service'
  | 'package'
  | 'table'
  | 'facilitator';

export type CommercialActualCostBasis =
  | 'ticket'
  | 'accommodation'
  | 'documented_expense'
  | 'other';

export type CommercialFixedPrice = {
  type: 'fixed';
  amount: number;
  currency: 'PLN';
  unit: CommercialBillingUnit;
  note: string | null;
};

export type CommercialRangePrice = {
  type: 'range';
  minAmount: number;
  maxAmount: number;
  currency: 'PLN';
  unit: CommercialBillingUnit;
  note: string | null;
};

export type CommercialFromPrice = {
  type: 'from';
  amount: number;
  currency: 'PLN';
  unit: CommercialBillingUnit;
  note: string | null;
};

export type CommercialPercentagePrice = {
  type: 'percentage';
  value: number | null;
  minValue: number | null;
  maxValue: number | null;
  basis: CommercialPercentageBasis;
  note: string | null;
};

export type CommercialActualCostPrice = {
  type: 'actual_cost';
  basis: CommercialActualCostBasis;
  note: string;
};

export type CommercialCustomQuotePrice = {
  type: 'custom_quote';
  note: string;
};

export type CommercialPrice =
  | CommercialFixedPrice
  | CommercialRangePrice
  | CommercialFromPrice
  | CommercialPercentagePrice
  | CommercialActualCostPrice
  | CommercialCustomQuotePrice;

export type CommercialPriceType = CommercialPrice['type'];
