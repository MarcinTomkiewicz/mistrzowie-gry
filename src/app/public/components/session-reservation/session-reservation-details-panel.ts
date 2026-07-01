import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';

import { ISessionReservationFlowState } from '../../../core/interfaces/i-session-reservation-flow';
import { ISessionReservationViewModel } from '../../../core/interfaces/i-session-reservation-view-model';

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
    MessageModule,
    TextareaModule,
  ],
  templateUrl: './session-reservation-details-panel.html',
})
export class SessionReservationDetailsPanel {
  readonly data = input.required<ISessionReservationViewModel>();
  readonly state = input.required<ISessionReservationFlowState>();
  readonly contactForm = input.required<FormGroup>();
  readonly gmExtraForm = input.required<FormGroup>();
  readonly createCharactersAtTableControl =
    input.required<FormControl<boolean>>();
  readonly provideCharacterGuidelinesControl =
    input.required<FormControl<boolean>>();
  readonly playersCountControl = input.required<FormControl<number | null>>();
  readonly customServicesRequestControl = input.required<FormControl<string>>();

  readonly entitlementsRefresh = output<void>();
  readonly customerEntitlementSelected = output<string>();
}
