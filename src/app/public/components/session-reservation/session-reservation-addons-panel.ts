import { Component, input, output } from '@angular/core';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { SESSION_RESERVATION_CONFIG } from '../../../core/configs/session-reservation.config';
import { ISessionBookingProduct } from '../../../core/interfaces/i-session-booking-product';
import {
  ISessionReservationAddonCustomerDetailsChange,
  ISessionReservationAddonQuantityChange,
  ISessionReservationFlowState,
} from '../../../core/interfaces/i-session-reservation-flow';
import { ISessionReservationI18nSections } from '../../../core/interfaces/i-session-reservation-i18n';
import { SessionAddonProductSlug } from '../../../core/types/session-booking-product';
import { formatSessionBookingProductPriceLabel } from '../../../core/utils/session-pricing';

@Component({
  selector: 'app-session-reservation-addons-panel',
  standalone: true,
  imports: [IftaLabelModule, InputTextModule, TextareaModule],
  templateUrl: './session-reservation-addons-panel.html',
})
export class SessionReservationAddonsPanel {
  readonly sections = input.required<ISessionReservationI18nSections['sections']>();
  readonly labels = input.required<ISessionReservationI18nSections['labels']>();
  readonly states = input.required<ISessionReservationI18nSections['states']>();
  readonly state = input.required<ISessionReservationFlowState>();
  readonly addonProducts = input.required<readonly ISessionBookingProduct[]>();

  readonly addonToggled = output<SessionAddonProductSlug>();
  readonly addonCustomerDetailsChanged =
    output<ISessionReservationAddonCustomerDetailsChange>();
  readonly addonQuantityChanged =
    output<ISessionReservationAddonQuantityChange>();
  readonly productPriceLabel = formatSessionBookingProductPriceLabel;

  toggleAddon(product: ISessionBookingProduct): void {
    this.addonToggled.emit(product.slug as SessionAddonProductSlug);
  }

  setAddonCustomerDetails(product: ISessionBookingProduct, value: string): void {
    this.addonCustomerDetailsChanged.emit({
      slug: product.slug as SessionAddonProductSlug,
      customerDetails: value.trim() || null,
    });
  }

  setAddonQuantity(product: ISessionBookingProduct, value: number): void {
    this.addonQuantityChanged.emit({
      slug: product.slug as SessionAddonProductSlug,
      quantity: Number.isFinite(value) && value > 0 ? value : null,
    });
  }

  isAddonSelected(product: ISessionBookingProduct): boolean {
    return this.state().selectedAddonSlugs.includes(
      product.slug as SessionAddonProductSlug,
    );
  }

  requiresAddonDetails(product: ISessionBookingProduct): boolean {
    return (
      SESSION_RESERVATION_CONFIG.addonProductSlugsRequiringCustomerDetails as readonly string[]
    ).includes(product.slug);
  }

  requiresAddonQuantity(product: ISessionBookingProduct): boolean {
    return (
      SESSION_RESERVATION_CONFIG.addonProductSlugsRequiringQuantity as readonly string[]
    ).includes(product.slug);
  }

  addonDetailsValue(product: ISessionBookingProduct): string {
    return (
      this.state().addonDetails[product.slug as SessionAddonProductSlug]
        ?.customerDetails ?? ''
    );
  }

  addonQuantityValue(product: ISessionBookingProduct): number | null {
    return (
      this.state().addonDetails[product.slug as SessionAddonProductSlug]
        ?.quantity ?? null
    );
  }
}
