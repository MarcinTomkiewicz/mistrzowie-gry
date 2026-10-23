import { Component, DestroyRef, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';

import { formatDateLabel } from '../../../core/utils/date';
import { normalizePolishPhoneNumber } from '../../../core/utils/phone';
import { formatTimeRangeLabel } from '../../../core/utils/time-format';
import { polishPhoneNumberValidator } from '../../../core/validators/polish-phone-number.validator';
import { requiredTrimmedValidator } from '../../../core/validators/required-trimmed.validator';
import { createEventPageI18n } from './event-page.i18n';
import { EventParticipantSignupFacade } from './event-participant-signup-facade';

@Component({
  selector: 'app-event-participant-signup',
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, FloatLabelModule, InputTextModule],
  templateUrl: './event-participant-signup.html',
})
export class EventParticipantSignup {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly signup = inject(EventParticipantSignupFacade);
  protected readonly i18n = createEventPageI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    guestName: ['', requiredTrimmedValidator()],
    guestPhone: ['', [Validators.required, polishPhoneNumberValidator()]],
  });

  constructor() {
    this.form.controls.guestPhone.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((phone) => this.signup.setGuestPhone(phone));
    effect(() => {
      this.signup.dialog()?.selection;
      untracked(() => this.form.reset());
    });
  }

  protected submit(): void {
    if (!this.signup.canSubmit()) return;
    if (this.signup.isAuthenticated()) {
      this.signup.register();
      return;
    }
    const guest = this.form.getRawValue();
    const guestPhone = normalizePolishPhoneNumber(guest.guestPhone);
    if (this.form.invalid || guestPhone === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.signup.register({ guestName: guest.guestName.trim(), guestPhone });
  }
}
