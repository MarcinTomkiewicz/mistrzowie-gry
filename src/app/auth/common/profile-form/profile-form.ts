import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';

import { createUserForm, mapUserFormToProfilePayload } from '../../../core/factories/user-form.factory';
import { IRegisterPayload } from '../../../core/interfaces/i-auth-payloads';
import { Auth } from '../../../core/services/auth/auth';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { AppAuthError, AuthErrorCode } from '../../../core/types/auth-error';
import { ProfileFormMode } from '../../../core/types/profile-form';
import { createProfileFormI18n } from './profile-form.i18n';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    PasswordModule,
    TextareaModule,
    ToggleSwitch,
  ],
  templateUrl: './profile-form.html',
  styleUrl: './profile-form.scss',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class ProfileForm {
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(UiToast);

  readonly mode = input<ProfileFormMode>('register');

  readonly i18n = createProfileFormI18n();

  readonly form = createUserForm(this.fb, {
    includeEmail: true,
    includePassword: true,
    includeProfile: true,
  });

  readonly isExpanded = signal(false);

  readonly isRegisterMode = computed(() => this.mode() === 'register');
  readonly isSubmitting = computed(() => false);
  readonly showExtendedFields = computed(
    () => !this.isRegisterMode() || this.isExpanded(),
  );

  private readonly syncModeEffect = effect(() => {
    const isRegisterMode = this.isRegisterMode();
    const emailControl = this.form.controls.email;
    const passwordControl = this.form.controls.password;

    if (isRegisterMode) {
      emailControl.setValidators([Validators.required, Validators.email]);
      passwordControl.setValidators([Validators.required, Validators.minLength(8)]);
      emailControl.enable({ emitEvent: false });
      passwordControl.enable({ emitEvent: false });
      return;
    }

    emailControl.clearValidators();
    passwordControl.clearValidators();
    emailControl.setValue(null, { emitEvent: false });
    passwordControl.setValue(null, { emitEvent: false });
    emailControl.disable({ emitEvent: false });
    passwordControl.disable({ emitEvent: false });
    this.isExpanded.set(false);

    emailControl.updateValueAndValidity({ emitEvent: false });
    passwordControl.updateValueAndValidity({ emitEvent: false });
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.toast.warn({
        summary: this.i18n.toast().invalidFormSummary,
        detail: this.i18n.commonForm().invalid,
      });

      return;
    }

    if (this.isRegisterMode()) {
      this.register();
      return;
    }

    this.updateProfile();
  }

  toggleExpanded(): void {
    this.isExpanded.update((value) => !value);
  }

  showEmailError(): boolean {
    const control = this.form.controls.email;

    return (
      this.isRegisterMode() &&
      control.touched &&
      (!!control.errors?.['required'] || !!control.errors?.['email'])
    );
  }

  showPasswordError(): boolean {
    const control = this.form.controls.password;

    return (
      this.isRegisterMode() &&
      control.touched &&
      (!!control.errors?.['required'] || !!control.errors?.['minlength'])
    );
  }

  showShortDescriptionError(): boolean {
    const control = this.form.controls.shortDescription;

    return control.touched && !!control.errors?.['maxlength'];
  }

  showLongDescriptionError(): boolean {
    const control = this.form.controls.longDescription;

    return control.touched && !!control.errors?.['maxlength'];
  }

  showDisplayNameRequiredError(): boolean {
    const firstName = this.form.controls.firstName;
    const nickname = this.form.controls.nickname;

    return (
      this.form.hasError('displayNameRequired') &&
      (firstName.touched || nickname.touched)
    );
  }

  showDisplayPreferenceError(): boolean {
    const firstName = this.form.controls.firstName;
    const nickname = this.form.controls.nickname;
    const useNickname = this.form.controls.useNickname;

    return (
      this.form.hasError('invalidDisplayPreference') &&
      (firstName.touched || nickname.touched || useNickname.touched)
    );
  }

  private register(): void {
    const payload: IRegisterPayload = {
      email: this.form.controls.email.getRawValue()?.trim() ?? '',
      password: this.form.controls.password.getRawValue() ?? '',
      profile: mapUserFormToProfilePayload(this.form),
    };

    this.auth
      .register(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => undefined),
      )
      .subscribe({
        next: (user) => {
          this.resetForm();

          if (user) {
            this.toast.success({
              summary: this.i18n.toast().registerSuccessSummary,
              detail: this.i18n.success().registered,
            });
            return;
          }

          this.toast.success({
            summary: this.i18n.toast().confirmationRequiredSummary,
            detail: this.i18n.success().confirmationRequired,
          });
        },
        error: (error) => {
          const authError =
            error instanceof AppAuthError
              ? error
              : new AppAuthError('unknown', undefined, error);

          this.toast.danger({
            summary: this.i18n.toast().registerFailedSummary,
            detail: this.resolveAuthErrorMessage(authError.code),
          });
        },
      });
  }

  private updateProfile(): void {
    this.auth
      .updateProfile(mapUserFormToProfilePayload(this.form))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => undefined),
      )
      .subscribe({
        next: () => {
          this.toast.success({
            summary: this.i18n.toast().updateSuccessSummary,
            detail: this.i18n.success().updated,
          });
        },
        error: (error) => {
          const authError =
            error instanceof AppAuthError
              ? error
              : new AppAuthError('unknown', undefined, error);

          this.toast.danger({
            summary: this.i18n.toast().updateFailedSummary,
            detail: this.resolveAuthErrorMessage(authError.code),
          });
        },
      });
  }

  private resetForm(): void {
    this.form.reset({
      email: null,
      password: null,
      firstName: null,
      nickname: null,
      useNickname: false,
      phoneNumber: null,
      city: null,
      street: null,
      houseNumber: null,
      apartmentNumber: null,
      postalCode: null,
      age: null,
      shortDescription: null,
      longDescription: null,
      extendedDescription: null,
    });

    this.isExpanded.set(false);

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private resolveAuthErrorMessage(code: AuthErrorCode): string {
    switch (code) {
      case 'invalid_credentials':
        return this.i18n.errors().invalidCredentials;
      case 'email_already_registered':
        return this.i18n.errors().emailAlreadyRegistered;
      case 'email_not_confirmed':
        return this.i18n.errors().emailNotConfirmed;
      case 'weak_password':
        return this.i18n.errors().weakPassword;
      case 'profile_not_found':
        return this.i18n.errors().profileNotFound;
      case 'network_error':
        return this.i18n.commonErrors().network;
      case 'unauthorized':
        return this.i18n.commonErrors().unauthorized;
      default:
        return this.i18n.commonErrors().generic;
    }
  }
}