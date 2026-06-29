import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { SESSION_RESERVATION_CONFIG } from '../../../core/configs/session-reservation.config';
import { ICustomerSessionEntitlement } from '../../../core/interfaces/i-customer-session-entitlement';
import { ISessionBookingProduct } from '../../../core/interfaces/i-session-booking-product';
import {
  ISessionReservationAddonCustomerDetailsChange,
  ISessionReservationAddonQuantityChange,
  ISessionReservationFlowState,
} from '../../../core/interfaces/i-session-reservation-flow';
import {
  ISessionReservationCommonI18n,
  ISessionReservationI18nSections,
} from '../../../core/interfaces/i-session-reservation-i18n';
import { SessionAddonProductSlug } from '../../../core/types/session-booking-product';
import { formatSessionBookingProductPriceLabel } from '../../../core/utils/session-pricing';

@Component({
  selector: 'app-session-reservation-details-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CheckboxModule,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
  ],
  templateUrl: './session-reservation-details-panel.html',
})
export class SessionReservationDetailsPanel {
  readonly sections = input.required<ISessionReservationI18nSections['sections']>();
  readonly labels = input.required<ISessionReservationI18nSections['labels']>();
  readonly states = input.required<ISessionReservationI18nSections['states']>();
  readonly commonActions = input.required<ISessionReservationCommonI18n['commonActions']>();
  readonly state = input.required<ISessionReservationFlowState>();
  readonly contactForm = input.required<FormGroup>();
  readonly gmExtraForm = input.required<FormGroup>();
  readonly provideCharacterGuidelinesControl =
    input.required<FormControl<boolean>>();
  readonly playersCountControl = input.required<FormControl<number | null>>();
  readonly customServicesRequestControl = input.required<FormControl<string>>();
  readonly addonProducts = input.required<readonly ISessionBookingProduct[]>();
  readonly customerEntitlements =
    input.required<readonly ICustomerSessionEntitlement[]>();
  readonly requiresManualQuote = input.required<boolean>();
  readonly requiresCustomerEntitlement = input.required<boolean>();
  readonly isLoadingEntitlements = input.required<boolean>();

  readonly entitlementsRefresh = output<void>();
  readonly customerEntitlementSelected = output<string>();
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
