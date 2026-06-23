import {
  CustomerSessionEntitlementKind,
  CustomerSessionEntitlementStatus,
} from '../types/customer-session-entitlement';
import { SessionEntitlementProductSlug } from '../types/session-booking-product';

interface ICustomerSessionEntitlementBase {
  id: string;
  userId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  productId: string;
  kind: CustomerSessionEntitlementKind;
  status: CustomerSessionEntitlementStatus;
  validFrom: string;
  validTo: string | null;
  priceSnapshotJson: ICustomerSessionEntitlementPriceSnapshot;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ICustomerSessionEntitlement =
  | (ICustomerSessionEntitlementBase & {
      kind: Extract<CustomerSessionEntitlementKind, 'package'>;
      sessionsTotal: number;
      sessionsPerMonth: null;
    })
  | (ICustomerSessionEntitlementBase & {
      kind: Extract<CustomerSessionEntitlementKind, 'subscription'>;
      sessionsTotal: number | null;
      sessionsPerMonth: number;
    });

export interface ICustomerSessionEntitlementPriceSnapshot {
  productSlug: SessionEntitlementProductSlug;
  productName: string;
  grossPricePln: number | null;
  currency: 'PLN';
  sessionsTotal?: number | null;
  sessionsPerMonth?: number | null;
  validFrom: string;
  validTo?: string | null;
  note?: string | null;
}

export type ICustomerSessionEntitlementLookup =
  | {
      userId: string;
      customerEmail?: null;
    }
  | {
      userId?: null;
      customerEmail: string;
    };
