import { ICustomerSessionEntitlement } from './i-customer-session-entitlement';
import { IGmPublicProfile } from './i-gm-public-profile';
import { ISessionBookingProduct } from './i-session-booking-product';
import { ISessionReservationAvailableSlot } from './i-session-reservation-availability';
import { ISessionReservationSummaryPreview } from './i-session-reservation-flow';
import {
  ISessionReservationCommonI18n,
  ISessionReservationI18nSections,
} from './i-session-reservation-i18n';
import { ISystem } from './i-system';

export interface ISessionReservationViewModel {
  hero: ISessionReservationI18nSections['hero'];
  sections: ISessionReservationI18nSections['sections'];
  labels: ISessionReservationI18nSections['labels'];
  states: ISessionReservationI18nSections['states'];
  commonActions: ISessionReservationCommonI18n['commonActions'];
  commonStatus: ISessionReservationCommonI18n['commonStatus'];
  addonProducts: readonly ISessionBookingProduct[];
  gmOptions: readonly IGmPublicProfile[];
  systemOptions: readonly ISystem[];
  availableSlots: readonly ISessionReservationAvailableSlot[];
  customerEntitlements: readonly ICustomerSessionEntitlement[];
  selectedGm: IGmPublicProfile | null;
  selectedSystem: ISystem | null;
  summary: ISessionReservationSummaryPreview | null;
  isLoadingInitial: boolean;
  isLoadingSystems: boolean;
  isLoadingSlots: boolean;
  isLoadingGms: boolean;
  isLoadingEntitlements: boolean;
  loadError: string | null;
  requiresCustomerEntitlement: boolean;
  requiresManualQuote: boolean;
}
