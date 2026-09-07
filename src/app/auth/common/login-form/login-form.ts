import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { provideTranslocoScope } from '@jsverse/transloco';

import { AUTH_PASSWORD_MIN_LENGTH } from '../../../core/configs/auth.config';
import { ILoginPayload } from '../../../core/interfaces/i-auth-payloads';
import { createUserForm } from '../../../core/factories/user-form.factory';
import { AuthRecovery } from '../../../core/services/auth-recovery/auth-recovery';
import { Auth } from '../../../core/services/auth/auth';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { AuthErrorCode } from '../../../core/types/auth-error';
import { normalizeAuthError, resolveCommonAuthErrorMessage } from '../../../core/utils/auth-error';
import { createLoginFormI18n } from './login-form.i18n';

type PendingAction = 'login' | 'password-reset' | null;

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class LoginForm {
  private readonly auth = inject(Auth);
  private readonly authRecovery = inject(AuthRecovery);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);

  readonly i18n = createLoginFormI18n();
  readonly passwordMinLength = AUTH_PASSWORD_MIN_LENGTH;

  readonly form = createUserForm(this.fb, {
    includeEmail: true,
    includePassword: true,
    includeProfile: false,
  });

  private readonly pendingAction = signal<PendingAction>(null);

  readonly hasPendingAction = computed(() => this.pendingAction() !== null);
  readonly isLoginPending = computed(() => this.pendingAction() === 'login');
  readonly isResetPending = computed(
    () => this.pendingAction() === 'password-reset',
  );

  onSubmit(): void {
    if (this.hasPendingAction()) {
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

    const payload: ILoginPayload = {
      email: this.form.controls.email.getRawValue()?.trim() ?? '',
      password: this.form.controls.password.getRawValue() ?? '',
    };

    this.pendingAction.set('login');

    this.auth
      .login(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingAction.set(null)),
      )
      .subscribe({
        next: () => {
          this.toast.success({
            summary: this.i18n.toast().loginSuccessSummary,
            detail: this.i18n.toast().loginSuccessDetail,
          });

          void this.router.navigateByUrl('/');
        },
        error: (error) => {
          this.toast.danger({
            summary: this.i18n.toast().loginFailedSummary,
            detail: this.resolveAuthErrorMessage(normalizeAuthError(error).code),
          });
        },
      });
  }

  requestPasswordReset(): void {
    if (this.hasPendingAction()) {
      return;
    }

    const emailControl = this.form.controls.email;

    if (emailControl.invalid) {
      emailControl.markAsTouched();
      return;
    }

    this.pendingAction.set('password-reset');

    this.authRecovery
      .requestPasswordReset(emailControl.getRawValue()?.trim() ?? '')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.pendingAction.set(null)),
      )
      .subscribe({
        next: () => {
          this.toast.success({
            summary: this.i18n.toast().resetRequestedSummary,
            detail: this.i18n.toast().resetRequestedDetail,
          });
        },
        error: (error) => {
          this.toast.danger({
            summary: this.i18n.toast().resetRequestFailedSummary,
            detail: resolveCommonAuthErrorMessage(
              normalizeAuthError(error).code,
              this.i18n.commonErrors(),
            ),
          });
        },
      });
  }

  showEmailError(): boolean {
    const control = this.form.controls.email;

    return (
      control.touched &&
      (!!control.errors?.['required'] || !!control.errors?.['email'])
    );
  }

  showPasswordError(): boolean {
    const control = this.form.controls.password;

    return (
      control.touched &&
      (!!control.errors?.['required'] || !!control.errors?.['minlength'])
    );
  }

  private resolveAuthErrorMessage(code: AuthErrorCode): string {
    switch (code) {
      case 'invalid_credentials':
        return this.i18n.errors().invalidCredentials;
      case 'email_not_confirmed':
        return this.i18n.commonErrors().unauthorized;
      default:
        return resolveCommonAuthErrorMessage(code, this.i18n.commonErrors());
    }
  }
}
