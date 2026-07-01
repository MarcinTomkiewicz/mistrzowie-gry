import { Component, OnInit, inject } from '@angular/core';
import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper';
import { LoadingOverlay } from '../../common/loading-overlay/loading-overlay';
import { SessionReservationAddonsPanel } from './session-reservation-addons-panel';
import { SessionReservationChoicePanel } from './session-reservation-choice-panel';
import { SessionReservationDetailsPanel } from './session-reservation-details-panel';
import { SessionReservationFormController } from './session-reservation-form-controller';
import { SessionReservationGmPanel } from './session-reservation-gm-panel';
import { SessionReservationPageController } from './session-reservation-page-controller';
import { SessionReservationSlotPanel } from './session-reservation-slot-panel';
import { SessionReservationSubmitController } from './session-reservation-submit-controller';
import { SessionReservationSummaryCard } from './session-reservation-summary-card';
import { SessionReservationSystemPanel } from './session-reservation-system-panel';
import { SessionReservationWizardController } from './session-reservation-wizard-controller';
import { GmProfileDialog } from '../gm-profile-dialog/gm-profile-dialog';

@Component({
  selector: 'app-session-reservation',
  standalone: true,
  imports: [
    ButtonModule,
    StepperModule,
    LoadingOverlay,
    SessionReservationAddonsPanel,
    SessionReservationChoicePanel,
    SessionReservationDetailsPanel,
    SessionReservationGmPanel,
    SessionReservationSlotPanel,
    SessionReservationSummaryCard,
    SessionReservationSystemPanel,
    GmProfileDialog,
  ],
  templateUrl: './session-reservation.html',
  providers: [
    provideTranslocoScope('sessionReservation', 'common'),
    SessionReservationFormController,
    SessionReservationPageController,
    SessionReservationSubmitController,
    SessionReservationWizardController,
  ],
})
export class SessionReservation implements OnInit {
  readonly forms = inject(SessionReservationFormController);
  readonly page = inject(SessionReservationPageController);
  readonly submit = inject(SessionReservationSubmitController);
  readonly wizard = inject(SessionReservationWizardController);

  ngOnInit(): void {
    this.page.initialize();
    this.forms.prefillContactFromAuthenticatedUser();
  }
}
