import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ILoginPayload } from '../../../core/interfaces/i-auth-payloads';
import { createUserForm } from '../../../core/factories/user-form.factory';
import { Auth } from '../../../core/services/auth/auth';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { AppAuthError, AuthErrorCode } from '../../../core/types/auth-error';
import { createLoginFormI18n } from './login-form.i18n';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    CommonModule,
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(UiToast);

  readonly i18n = createLoginFormI18n();

  readonly form = createUserForm(this.fb, {
    includeEmail: true,
    includePassword: true,
    includeProfile: false,
  });

  readonly isSubmitting = computed(() => false);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.toast.warn({
        summary: 'Nieprawidłowy formularz',
        detail: this.i18n.commonForm().invalid,
      });

      return;
    }

    const payload: ILoginPayload = {
      email: this.form.controls.email.getRawValue()?.trim() ?? '',
      password: this.form.controls.password.getRawValue() ?? '',
    };

    this.auth
      .login(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => undefined),
      )
      .subscribe({
        next: () => {
          this.toast.success({
            summary: 'Zalogowano',
            detail: 'Logowanie zakończyło się powodzeniem.',
          });

          void this.router.navigateByUrl('/');
        },
        error: (error) => {
          const authError =
            error instanceof AppAuthError
              ? error
              : new AppAuthError('unknown', undefined, error);

          this.toast.danger({
            summary: 'Nie udało się zalogować',
            detail: this.resolveAuthErrorMessage(authError.code),
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
      case 'network_error':
        return this.i18n.commonErrors().network;
      case 'unauthorized':
        return this.i18n.commonErrors().unauthorized;
      default:
        return this.i18n.commonErrors().generic;
    }
  }
}