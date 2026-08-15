import { ICustomerSessionEntitlement } from './i-customer-session-entitlement';
import { IGmPublicProfile } from './i-gm-public-profile';
import { ISessionAddonBookingProduct } from './i-session-booking-product';
import {
  ISessionReservationAvailableSlot,
  ISessionReservationGmSlot,
} from './i-session-reservation-availability';
import { ISessionReservationFinalSummaryPreview } from './i-session-reservation-finalization';
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
  commonLabels: ISessionReservationCommonI18n['commonLabels'];
  commonAppRoles: ISessionReservationCommonI18n['commonAppRoles'];
  commonStatus: ISessionReservationCommonI18n['commonStatus'];
  addonProducts: readonly ISessionAddonBookingProduct[];
  gmOptions: readonly IGmPublicProfile[];
  systemOptions: readonly ISystem[];
  availableSlots: readonly ISessionReservationAvailableSlot[];
  nearestSystemSlots: readonly ISessionReservationGmSlot[];
  otherGmsForSelectedSlot: readonly IGmPublicProfile[];
  customerEntitlements: readonly ICustomerSessionEntitlement[];
  selectedGm: IGmPublicProfile | null;
  selectedSystem: ISystem | null;
  summary: ISessionReservationFinalSummaryPreview | null;
  isLoadingInitial: boolean;
  isLoadingSystems: boolean;
  isLoadingSlots: boolean;
  isLoadingGms: boolean;
  isLoadingEntitlements: boolean;
  loadError: string | null;
  requiresCustomerEntitlement: boolean;
  requiresManualQuote: boolean;
}
