import { SESSION_RESERVATION_CONFIG } from '../../../core/configs/session-reservation.config';
import { ISessionBookingProduct } from '../../../core/interfaces/i-session-booking-product';
import { ISessionReservationAvailableSlot } from '../../../core/interfaces/i-session-reservation-availability';
import { formatDateLabel } from '../../../core/utils/date';
import { formatMoney } from '../../../core/utils/pricing';
import {
  formatDateTimeAsTimeLabel,
  formatTimeRangeLabel,
} from '../../../core/utils/time-format';

export function formatSessionBookingProductPriceLabel(
  product: ISessionBookingProduct,
  manualQuoteRequired: string,
): string {
  if (product.requiresManualQuote) return manualQuoteRequired;
  if (product.pricePercent !== null) return `+${product.pricePercent}%`;

  return (
    formatMoney(product.grossPricePln, SESSION_RESERVATION_CONFIG.currency) ??
    manualQuoteRequired
  );
}

export function formatSessionReservationSlotDateLabel(
  slot: ISessionReservationAvailableSlot,
): string {
  return formatDateLabel(slot.date, 'pl-PL', true);
}

export function formatSessionReservationSlotTimeRangeLabel(
  slot: ISessionReservationAvailableSlot,
): string {
  return formatTimeRangeLabel(
    slot.startTime,
    formatDateTimeAsTimeLabel(new Date(slot.endsAt)),
  );
}
