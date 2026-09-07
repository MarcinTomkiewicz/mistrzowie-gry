import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { PasswordModule } from 'primeng/password';

import { AUTH_PASSWORD_MIN_LENGTH } from '../../../core/configs/auth.config';
import { RESET_PASSWORD_FORM_CONFIG } from '../../../core/configs/reset-password-form.config';
import { AuthRecovery } from '../../../core/services/auth-recovery/auth-recovery';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { AuthErrorCode } from '../../../core/types/auth-error';
import { normalizeAuthError, resolveCommonAuthErrorMessage } from '../../../core/utils/auth-error';
import { createResetPasswordI18n } from './reset-password.i18n';

type PasswordControlName = 'password' | 'passwordConfirmation';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    PasswordModule,
  ],
  templateUrl: './reset-password.html',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class ResetPassword {
  private readonly authRecovery = inject(AuthRecovery);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);

  readonly form = this.fb.nonNullable.group(
    RESET_PASSWORD_FORM_CONFIG.controls,
    RESET_PASSWORD_FORM_CONFIG.options,
  );
  readonly i18n = createResetPasswordI18n();
  readonly isInvalidLink = signal(this.hasRecoveryCallbackError());
  readonly isSubmitting = signal(false);
  readonly passwordMinLength = AUTH_PASSWORD_MIN_LENGTH;

  onSubmit(): void {
    if (this.isSubmitting() || this.isInvalidLink()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.toast.warn({
        summary: this.i18n.commonForm().invalidSummary,
        detail: this.i18n.commonForm().invalid,
      });

      return;
    }

    this.isSubmitting.set(true);

    this.authRecovery
      .updatePassword(this.form.controls.password.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => {
          this.toast.success({
            summary: this.i18n.commonStatus().success,
            detail: this.i18n.toast().updateSuccessDetail,
          });

          void this.router.navigateByUrl('/');
        },
        error: (error) => this.handleUpdateError(error),
      });
  }

  showRequiredError(controlName: PasswordControlName): boolean {
    const control = this.form.controls[controlName];
    return control.touched && !!control.errors?.['required'];
  }

  showMinLengthError(controlName: PasswordControlName): boolean {
    const control = this.form.controls[controlName];
    return control.touched && !!control.errors?.['minlength'];
  }

  showPasswordMismatchError(): boolean {
    return (
      this.form.controls.passwordConfirmation.touched &&
      this.form.hasError('passwordMismatch')
    );
  }

  private handleUpdateError(error: unknown): void {
    const authError = normalizeAuthError(error);

    if (authError.code === 'session_not_found') {
      this.isInvalidLink.set(true);
      return;
    }

    this.toast.danger({
      summary: this.i18n.toast().updateFailedSummary,
      detail: this.resolveAuthErrorMessage(authError.code),
    });
  }

  private resolveAuthErrorMessage(code: AuthErrorCode): string {
    switch (code) {
      case 'weak_password':
        return this.i18n.profileErrors().weakPassword;
      default:
        return resolveCommonAuthErrorMessage(code, this.i18n.commonErrors());
    }
  }

  private hasRecoveryCallbackError(): boolean {
    const snapshot = this.route.snapshot;
    const fragmentParams = new URLSearchParams(snapshot.fragment ?? '');

    return (
      snapshot.queryParamMap.has('error') ||
      snapshot.queryParamMap.has('error_code') ||
      fragmentParams.has('error') ||
      fragmentParams.has('error_code')
    );
  }
}
