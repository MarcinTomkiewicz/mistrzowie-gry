import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  finalize,
  forkJoin,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SliderModule } from 'primeng/slider';
import { TextareaModule } from 'primeng/textarea';

import {
  createGmProfileForm,
  mapGmProfileFormToPayload,
} from '../../../core/factories/gm-profile-form.factory';
import { IChipPickerOption } from '../../../core/interfaces/i-chip-picker';
import { IFileUploadValue } from '../../../core/interfaces/i-file-upload';
import { IStorageUploadResult } from '../../../core/interfaces/i-storage';
import { Auth } from '../../../core/services/auth/auth';
import { GmProfileFacade } from '../../../core/services/gm-profile/gm-profile';
import { Storage } from '../../../core/services/storage/storage';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { normalizeText } from '../../../core/utils/normalize-text';
import { FileUpload } from '../../../public/common/file-upload/file-upload';
import { ChipPicker } from '../../../public/common/chip-picker/chip-picker';
import { LoadingOverlay } from '../../../public/common/loading-overlay/loading-overlay';
import { createGmProfileI18n } from './gm-profile.i18n';

@Component({
  selector: 'app-gm-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ChipPicker,
    FileUpload,
    IftaLabelModule,
    InputTextModule,
    LoadingOverlay,
    SliderModule,
    TextareaModule,
  ],
  templateUrl: './gm-profile.html',
  styleUrl: './gm-profile.scss',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class GmProfile {
  private readonly auth = inject(Auth);
  private readonly fb = inject(FormBuilder);
  private readonly gmProfileFacade = inject(GmProfileFacade);
  private readonly storage = inject(Storage);
  private readonly toast = inject(UiToast);

  readonly i18n = createGmProfileI18n();

  readonly form = createGmProfileForm(this.fb);

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly styleOptions = signal<IChipPickerOption[]>([]);
  readonly languageOptions = signal<IChipPickerOption[]>([]);
  readonly selectedImageFile = signal<File | null>(null);

  private readonly quoteValue = toSignal(
    this.form.controls.quote.valueChanges,
    {
      initialValue: this.form.controls.quote.getRawValue(),
    },
  );

  private readonly experienceValue = toSignal(
    this.form.controls.experience.valueChanges,
    {
      initialValue: this.form.controls.experience.getRawValue(),
    },
  );

  private readonly gmStyleIdsValue = toSignal(
    this.form.controls.gmStyleIds.valueChanges,
    {
      initialValue: this.form.controls.gmStyleIds.getRawValue(),
    },
  );

  readonly displayName = computed(() => this.auth.displayName());

  readonly storedImageUrl = computed(() => {
    const imagePath = normalizeText(this.form.controls.image.getRawValue());

    if (!imagePath) {
      return null;
    }

    return this.storage.getPublicUrl(imagePath);
  });

  readonly hasValidStyleCount = computed(() => {
    const gmStyleIds = this.gmStyleIdsValue() ?? [];
    const count = gmStyleIds.length;

    return count === 0 || (count >= 3 && count <= 5);
  });

  readonly quoteRemaining = computed(() => {
    const value = this.quoteValue() ?? '';
    return Math.max(0, 255 - value.length);
  });

  readonly isQuoteLimitReached = computed(() => this.quoteRemaining() === 0);

  readonly experienceDisplay = computed(() => this.experienceValue() ?? 0);

  constructor() {
    this.loadData();
  }

  onImageValueChange(value: IFileUploadValue): void {
    this.selectedImageFile.set(value.file);

    if (value.file) {
      this.form.markAsDirty();
    }
  }

  onRemoveStoredImage(): void {
    this.selectedImageFile.set(null);
    this.form.controls.image.setValue(null);
    this.form.controls.image.markAsDirty();
    this.form.controls.image.markAsTouched();
  }

  onSubmit(): void {
    if (this.form.invalid || !this.hasValidStyleCount()) {
      this.form.markAllAsTouched();

      this.toast.warn({
        summary: this.i18n.commonForm().invalidSummary,
        detail: !this.hasValidStyleCount()
          ? this.i18n.errors().invalidStyleCount
          : this.i18n.toast().invalidFormDetail,
      });

      return;
    }

    this.isSubmitting.set(true);

    this.uploadSelectedImageIfNeeded()
      .pipe(
        switchMap(() => {
          const payload = mapGmProfileFormToPayload(this.form);
          return this.gmProfileFacade.upsertMyGmProfile(payload);
        }),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (profile) => {
          const styleIds = profile.styles?.map((style) => style.id) ?? [];
          const languageIds =
            profile.languages?.map((language) => language.id) ?? [];

          this.selectedImageFile.set(null);

          this.form.patchValue(
            {
              experience: profile.experience,
              description: profile.description,
              image: profile.image,
              quote: profile.quote,
              gmStyleIds: styleIds,
              languageIds,
            },
            { emitEvent: true },
          );

          this.form.markAsPristine();
          this.form.markAsUntouched();

          this.toast.success({
            summary: this.i18n.toast().saveSuccessSummary,
            detail: this.i18n.toast().saveSuccessDetail,
          });
        },
        error: (error) => {
          console.error('[GM PROFILE SAVE ERROR]', error);

          this.toast.danger({
            summary: this.i18n.toast().saveFailedSummary,
            detail: this.i18n.toast().saveFailedDetail,
          });
        },
      });
  }

  onStylesChange(gmStyleIds: string[]): void {
    this.form.controls.gmStyleIds.setValue(gmStyleIds);
    this.form.controls.gmStyleIds.markAsDirty();
    this.form.controls.gmStyleIds.markAsTouched();
  }

  onLanguagesChange(languageIds: string[]): void {
    this.form.controls.languageIds.setValue(languageIds);
    this.form.controls.languageIds.markAsDirty();
    this.form.controls.languageIds.markAsTouched();
  }

  showQuoteError(): boolean {
    const control = this.form.controls.quote;
    return control.touched && !!control.errors?.['maxlength'];
  }

  showExperienceError(): boolean {
    const control = this.form.controls.experience;

    return (
      control.touched &&
      (!!control.errors?.['min'] || !!control.errors?.['max'])
    );
  }

  showStyleCountError(): boolean {
    return this.form.controls.gmStyleIds.touched && !this.hasValidStyleCount();
  }

  private loadData(): void {
    this.isLoading.set(true);

    forkJoin({
      profile: this.gmProfileFacade.getMyGmProfile(),
      styles: this.gmProfileFacade.getAvailableStyles(),
      languages: this.gmProfileFacade.getAvailableLanguages(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ profile, styles, languages }) => {
          this.styleOptions.set(
            styles.map((style) => ({
              id: style.id,
              label: style.label,
              searchText: style.slug,
              selectedClassName: 'tag-badge--arcane',
              unselectedClassName: 'tag-badge--muted',
            })),
          );

          this.languageOptions.set(
            [...languages]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((language) => ({
                id: language.id,
                label: language.label,
                searchText: `${language.code} ${language.label} ${language.flagCode}`,
                iconClassName: `fi fi-${language.flagCode.toLowerCase()}`,
                selectedClassName: 'tag-badge--arcane',
                unselectedClassName: 'tag-badge--muted',
              })),
          );

          if (!profile) {
            return;
          }

          this.form.patchValue(
            {
              experience: profile.experience,
              description: profile.description,
              image: profile.image,
              quote: profile.quote,
              gmStyleIds: profile.styles?.map((style) => style.id) ?? [],
              languageIds:
                profile.languages?.map((language) => language.id) ?? [],
            },
            { emitEvent: true },
          );

          this.form.markAsPristine();
          this.form.markAsUntouched();
        },
        error: (error) => {
          console.error('[GM PROFILE LOAD ERROR]', error);

          this.toast.danger({
            summary: this.i18n.toast().loadFailedSummary,
            detail: this.i18n.toast().loadFailedDetail,
          });
        },
      });
  }

  private uploadSelectedImageIfNeeded(): Observable<IStorageUploadResult | null> {
    const file = this.selectedImageFile();

    if (!file) {
      return of(null);
    }

    const userId = this.auth.userId();

    if (!userId) {
      return throwError(() => new Error('Unauthorized.'));
    }

    return this.storage
      .uploadImage(file, {
        folder: 'profilePhotos',
        ownerId: userId,
        currentPath: this.form.controls.image.getRawValue(),
        removePrevious: true,
        usePublicUrl: false,
      })
      .pipe(
        switchMap((result) => {
          this.form.controls.image.setValue(result.path);
          this.form.controls.image.markAsDirty();
          this.form.controls.image.markAsTouched();

          return of(result);
        }),
      );
  }

}
