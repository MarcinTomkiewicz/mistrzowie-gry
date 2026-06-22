export type SessionPriceStatus =
  | 'fixed'
  | 'estimated'
  | 'manual_quote_required';

export const SESSION_PRICE_STATUSES = {
  Fixed: 'fixed',
  Estimated: 'estimated',
  ManualQuoteRequired: 'manual_quote_required',
} as const satisfies Record<string, SessionPriceStatus>;

