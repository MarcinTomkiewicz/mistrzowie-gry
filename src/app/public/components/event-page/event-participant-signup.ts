import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, afterRenderEffect, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';

import { formatDateLabel } from '../../../core/utils/date';
import { formatTimeRangeLabel } from '../../../core/utils/time-format';
import { requiredTrimmedValidator } from '../../../core/validators/required-trimmed.validator';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { createEventPageI18n } from './event-page.i18n';
import { EventParticipantSignupFacade } from './event-participant-signup-facade';

@Component({
  selector: 'app-event-participant-signup',
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, FloatLabelModule, InputTextModule],
  templateUrl: './event-participant-signup.html',
})
export class EventParticipantSignup {
  private readonly document = inject(DOCUMENT);
  private readonly toast = inject(UiToast);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly signup = inject(EventParticipantSignupFacade);
  protected readonly i18n = createEventPageI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;
  protected readonly isCopying = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    guestName: ['', requiredTrimmedValidator()],
    guestPhone: ['', [Validators.required, Validators.pattern(/^\+[1-9]\d{1,14}$/)]],
  });

  constructor() {
    this.form.controls.guestPhone.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((phone) => this.signup.setGuestPhone(phone));
    effect(() => {
      this.signup.dialog()?.selection;
      untracked(() => this.form.reset());
    });
    afterRenderEffect(() => this.signup.markReceiptPresented());
  }

  protected async copyConfirmationCode(): Promise<void> {
    const code = this.signup.confirmationCode();
    if (!code || this.isCopying()) return;
    this.isCopying.set(true);
    try {
      const clipboard = this.document.defaultView?.navigator.clipboard;
      if (!clipboard) throw new Error('Clipboard API is unavailable.');
      await clipboard.writeText(code);
      if (!this.destroyRef.destroyed) this.toast.success({ summary: this.i18n.status().success });
    } catch {
      if (!this.destroyRef.destroyed) this.toast.warn({ summary: this.i18n.signup().copyCodeFailed });
    } finally {
      this.isCopying.set(false);
    }
  }

  protected submit(): void {
    if (!this.signup.canSubmit()) return;
    const { guestName, guestPhone } = this.form.getRawValue();
    this.form.setValue({ guestName: guestName.trim(), guestPhone: guestPhone.trim() });
    if (!this.signup.isAuthenticated() && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.signup.register(this.form.getRawValue());
  }
}
