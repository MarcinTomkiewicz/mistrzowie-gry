export type SessionBookingMode =
  | 'single_session'
  | 'package_credit'
  | 'subscription_credit'
  | 'custom_quote';

export const SESSION_BOOKING_MODES = {
  SingleSession: 'single_session',
  PackageCredit: 'package_credit',
  SubscriptionCredit: 'subscription_credit',
  CustomQuote: 'custom_quote',
} as const satisfies Record<string, SessionBookingMode>;
