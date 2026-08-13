import type {
  ActualCostBasis,
  BillingUnit,
  PercentageBasis,
  PriceType,
} from '../types/price';

export const PRICE_TYPES = [
  'fixed',
  'range',
  'from',
  'percentage',
  'actual_cost',
  'custom_quote',
] as const satisfies readonly PriceType[];

export const BILLING_UNITS = [
  'session',
  'hour',
  'month',
  'event',
  'package',
  'table',
  'table_hour',
  'facilitator',
  'participant',
  'piece',
  'day',
  'half_day',
  'night',
  'kilometer',
] as const satisfies readonly BillingUnit[];

export const PERCENTAGE_BASES = [
  'base_service',
  'package',
  'table',
  'facilitator',
] as const satisfies readonly PercentageBasis[];

export const ACTUAL_COST_BASES = [
  'ticket',
  'accommodation',
  'documented_expense',
  'other',
] as const satisfies readonly ActualCostBasis[];
