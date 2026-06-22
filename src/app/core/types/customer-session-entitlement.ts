export type CustomerSessionEntitlementKind = 'package' | 'subscription';

export type CustomerSessionEntitlementStatus =
  | 'pending'
  | 'active'
  | 'suspended'
  | 'expired'
  | 'cancelled';

export const CUSTOMER_SESSION_ENTITLEMENT_KINDS = {
  Package: 'package',
  Subscription: 'subscription',
} as const satisfies Record<string, CustomerSessionEntitlementKind>;

export const CUSTOMER_SESSION_ENTITLEMENT_STATUSES = {
  Pending: 'pending',
  Active: 'active',
  Suspended: 'suspended',
  Expired: 'expired',
  Cancelled: 'cancelled',
} as const satisfies Record<string, CustomerSessionEntitlementStatus>;

