import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { ICustomerSessionEntitlement } from '../../../core/interfaces/i-customer-session-entitlement';
import { ISessionReservationFlowState } from '../../../core/interfaces/i-session-reservation-flow';
import {
  ISessionReservationCommonI18n,
  ISessionReservationI18nSections,
} from '../../../core/interfaces/i-session-reservation-i18n';

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
  readonly customerEntitlements =
    input.required<readonly ICustomerSessionEntitlement[]>();
  readonly requiresManualQuote = input.required<boolean>();
  readonly requiresCustomerEntitlement = input.required<boolean>();
  readonly isLoadingEntitlements = input.required<boolean>();

  readonly entitlementsRefresh = output<void>();
  readonly customerEntitlementSelected = output<string>();
}
