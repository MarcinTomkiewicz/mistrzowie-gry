import { Component, input, output } from '@angular/core';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { ISessionAddonBookingProduct } from '../../../core/interfaces/i-session-booking-product';
import {
  ISessionReservationAddonCustomerDetailsChange,
  ISessionReservationAddonQuantityChange,
  ISessionReservationFlowState,
} from '../../../core/interfaces/i-session-reservation-flow';
import { ISessionReservationViewModel } from '../../../core/interfaces/i-session-reservation-view-model';
import { SessionAddonProductSlug } from '../../../core/types/session-booking-product';
import {
  isAddonCustomerDetailsRequired,
  isAddonQuantityRequired,
} from '../../../core/domain/session-reservation/rules';
import { formatSessionBookingProductPriceLabel } from './session-reservation-labels';

@Component({
  selector: 'app-session-reservation-addons-panel',
  standalone: true,
  imports: [IftaLabelModule, InputTextModule, TextareaModule],
  templateUrl: './session-reservation-addons-panel.html',
})
export class SessionReservationAddonsPanel {
  readonly data = input.required<ISessionReservationViewModel>();
  readonly state = input.required<ISessionReservationFlowState>();

  readonly addonToggled = output<SessionAddonProductSlug>();
  readonly addonCustomerDetailsChanged =
    output<ISessionReservationAddonCustomerDetailsChange>();
  readonly addonQuantityChanged =
    output<ISessionReservationAddonQuantityChange>();
  readonly productPriceLabel = formatSessionBookingProductPriceLabel;

  toggleAddon(product: ISessionAddonBookingProduct): void {
    this.addonToggled.emit(product.slug);
  }

  setAddonCustomerDetails(
    product: ISessionAddonBookingProduct,
    value: string,
  ): void {
    this.addonCustomerDetailsChanged.emit({
      slug: product.slug,
      customerDetails: value.trim() || null,
    });
  }

  setAddonQuantity(product: ISessionAddonBookingProduct, value: number): void {
    this.addonQuantityChanged.emit({
      slug: product.slug,
      quantity: Number.isFinite(value) && value > 0 ? value : null,
    });
  }

  isAddonSelected(product: ISessionAddonBookingProduct): boolean {
    return this.state().selectedAddonSlugs.includes(product.slug);
  }

  requiresAddonDetails(product: ISessionAddonBookingProduct): boolean {
    return isAddonCustomerDetailsRequired(product.slug);
  }

  requiresAddonQuantity(product: ISessionAddonBookingProduct): boolean {
    return isAddonQuantityRequired(product.slug);
  }

  addonDetailsValue(product: ISessionAddonBookingProduct): string {
    return (
      this.state().addonDetails[product.slug]?.customerDetails ?? ''
    );
  }

  addonQuantityValue(product: ISessionAddonBookingProduct): number | null {
    return this.state().addonDetails[product.slug]?.quantity ?? null;
  }
}
