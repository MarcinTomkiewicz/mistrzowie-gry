import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';

import { ICoworkerProfile } from '../../../core/interfaces/i-coworker-profile';
import { Auth } from '../../../core/services/auth/auth';
import { CoworkerProfile } from '../../../core/services/coworker-profile/coworker-profile';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { LoadingOverlay } from '../../../public/common/loading-overlay/loading-overlay';
import { createCoworkerProfileI18n } from './coworker-profile.i18n';

@Component({
  selector: 'app-coworker-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    LoadingOverlay,
  ],
  templateUrl: './coworker-profile.html',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class CoworkerProfileComponent {
  private readonly auth = inject(Auth);
  private readonly fb = inject(FormBuilder);
  private readonly coworkerProfile = inject(CoworkerProfile);
  private readonly toast = inject(UiToast);

  protected readonly i18n = createCoworkerProfileI18n();
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);

  private readonly hydratedUserId = signal<string | null>(null);

  protected readonly form = this.fb.group({
    firstName: this.fb.control('', {
      validators: [Validators.required, Validators.maxLength(100)],
      nonNullable: true,
    }),
    lastName: this.fb.control('', {
      validators: [Validators.required, Validators.maxLength(100)],
      nonNullable: true,
    }),
    pesel: this.fb.control({ value: '', disabled: true }, { nonNullable: true }),
    bankAccount: this.fb.control({ value: '', disabled: true }, { nonNullable: true }),
    street: this.fb.control({ value: '', disabled: true }, { nonNullable: true }),
    houseNumber: this.fb.control({ value: '', disabled: true }, { nonNullable: true }),
    apartmentNumber: this.fb.control({ value: '', disabled: true }, { nonNullable: true }),
    postalCode: this.fb.control({ value: '', disabled: true }, { nonNullable: true }),
    city: this.fb.control({ value: '', disabled: true }, { nonNullable: true }),
  });

  protected readonly isSaveDisabled = computed(
    () => this.isSaving() || this.isLoading() || this.form.invalid || !this.form.dirty,
  );

  constructor() {
    effect(() => {
      if (!this.auth.isReady()) {
        return;
      }

      const userId = this.auth.userId();

      if (!userId) {
        this.hydratedUserId.set(null);
        this.resetForm();
        this.isLoading.set(false);
        return;
      }

      if (this.hydratedUserId() === userId) {
        return;
      }

      this.hydratedUserId.set(userId);
      this.loadProfile();
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.coworkerProfile
      .upsertMyProfile({
        firstName: this.form.controls.firstName.value,
        lastName: this.form.controls.lastName.value,
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (profile) => {
          this.patchForm(profile);
          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.toast().saveSuccessDetail,
          });
        },
        error: () => {
          this.toast.danger({
            summary: this.i18n.toast().saveFailedSummary,
            detail: this.i18n.toast().saveFailedDetail,
          });
        },
      });
  }

  private loadProfile(): void {
    this.isLoading.set(true);
    this.coworkerProfile
      .getMyProfile()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (profile) => {
          this.patchForm(profile);
        },
        error: () => {
          this.resetForm();
          this.toast.danger({
            summary: this.i18n.toast().loadFailedSummary,
            detail: this.i18n.toast().loadFailedDetail,
          });
        },
      });
  }

  private patchForm(profile: ICoworkerProfile | null): void {
    this.form.patchValue(
      {
        firstName: profile?.firstName ?? this.auth.user()?.firstName?.trim() ?? '',
        lastName: profile?.lastName ?? '',
        street: profile?.street ?? '',
        houseNumber: profile?.houseNumber ?? '',
        apartmentNumber: profile?.apartmentNumber ?? '',
        postalCode: profile?.postalCode ?? '',
        city: profile?.city ?? '',
        pesel: '',
        bankAccount: '',
      },
      { emitEvent: false },
    );

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private resetForm(): void {
    this.form.reset(
      {
        firstName: this.auth.user()?.firstName?.trim() ?? '',
        lastName: '',
        pesel: '',
        bankAccount: '',
        street: '',
        houseNumber: '',
        apartmentNumber: '',
        postalCode: '',
        city: '',
      },
      { emitEvent: false },
    );
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
