import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { SESSION_RESERVATION_SUBMIT_ERRORS } from '../../../core/configs/session-reservation-submit-errors.config';
import { ISessionReservationSubmitToastTranslations } from '../../../core/interfaces/i-session-reservation-finalization';
import { Auth } from '../../../core/services/auth/auth';
import { SessionReservationFacade } from '../../../core/services/session-reservation-facade/session-reservation-facade';
import { SessionReservationStore } from '../../../core/services/session-reservation-store/session-reservation-store';
import { SessionReservationSubmitService } from '../../../core/services/session-reservation-submit/session-reservation-submit';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import { SessionReservationFormController } from './session-reservation-form-controller';
import { SessionReservationWizardController } from './session-reservation-wizard-controller';

@Injectable()
export class SessionReservationSubmitController {
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(SessionReservationFacade);
  private readonly forms = inject(SessionReservationFormController);
  private readonly store = inject(SessionReservationStore);
  private readonly submit = inject(SessionReservationSubmitService);
  private readonly toast = inject(UiToast);
  private readonly wizard = inject(SessionReservationWizardController);

  readonly isSubmitting = signal(false);
  readonly submitToast =
    createScopedObjectI18n<ISessionReservationSubmitToastTranslations>(
      'sessionReservation',
      'toast',
    );

  isSubmitDisabled(): boolean {
    return (
      this.isSubmitting() ||
      this.forms.contactForm.invalid ||
      !this.facade.buildSummaryPreview()
    );
  }

  submitReservation(): void {
    this.wizard.clearLoadError();
    this.forms.markAllAsTouched();

    if (this.forms.contactForm.invalid || !this.facade.buildSummaryPreview()) {
      this.toast.warn({
        summary: this.submitToast().invalidFormSummary,
        detail: this.submitToast().invalidFormDetail,
      });
      return;
    }

    this.isSubmitting.set(true);

    this.submit
      .createReservation({
        state: this.store.state(),
        products: this.facade.products(),
        customerEntitlements: this.facade.customerEntitlements(),
        userId: this.auth.userId(),
      })
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.onSubmitSuccess(),
        error: (error: unknown) => this.onSubmitError(error),
      });
  }

  private onSubmitSuccess(): void {
    this.toast.success({
      summary: this.submitToast().saveSuccessSummary,
      detail: this.submitToast().saveSuccessDetail,
    });
    this.facade.resetReservationFlow();
    this.wizard.reset();
    this.forms.prefillContactFromAuthenticatedUser();
    this.forms.resetAfterSuccessfulReservation();
  }

  private onSubmitError(error: unknown): void {
    const message =
      error instanceof Error && error.message
        ? error.message
        : SESSION_RESERVATION_SUBMIT_ERRORS.InvalidPayload;

    if (message === SESSION_RESERVATION_SUBMIT_ERRORS.SlotUnavailable) {
      this.toast.warn({
        summary: this.submitToast().slotUnavailableSummary,
        detail: this.submitToast().slotUnavailableDetail,
      });
      return;
    }

    this.toast.danger({
      summary: this.submitToast().saveFailedSummary,
      detail: this.submitToast().saveFailedDetail,
    });
  }
}
