import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize, Observable, of, switchMap, throwError } from 'rxjs';

import { provideTranslocoScope } from '@jsverse/transloco';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ChipPicker } from '../../../public/common/chip-picker/chip-picker';
import { FileUpload } from '../../../public/common/file-upload/file-upload';
import { Auth } from '../../../core/services/auth/auth';
import { ISessionFormData, IUpdateSessionPayload } from '../../../core/interfaces/i-session';
import { ISystem } from '../../../core/interfaces/i-system';
import { IGmStyle } from '../../../core/interfaces/i-gm-style';
import { IContentTrigger } from '../../../core/interfaces/i-content-trigger';
import { createSessionFormI18n } from './session-form.i18n';
import { createSessionForm, mapSessionFormToPayload, mapSessionToFormData } from '../../../core/factories/session-form.factory';
import { IChipPickerOption } from '../../../core/interfaces/i-chip-picker';
import { SESSION_DIFFICULTY_LEVEL_OPTIONS, SessionDifficultyLevel } from '../../../core/types/sessions';
import { normalizeText } from '../../../core/utils/normalize-text';
import { IStorageUploadResult } from '../../../core/interfaces/i-storage';
import { Storage } from '../../../core/services/storage/storage';
import { IFileUploadValue } from '../../../core/interfaces/i-file-upload';

@Component({
  selector: 'app-session-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ChipPicker,
    FileUpload,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './session-form.html',
  styleUrl: './session-form.scss',
  providers: [provideTranslocoScope('auth', 'common')],
})
export class SessionForm {
  private readonly auth = inject(Auth);
  private readonly fb = inject(FormBuilder);
  private readonly storage = inject(Storage);

  readonly initial = input<Partial<ISessionFormData> | null>(null);
  readonly systems = input<readonly ISystem[]>([]);
  readonly styles = input<readonly IGmStyle[]>([]);
  readonly triggers = input<readonly IContentTrigger[]>([]);
  readonly submitLabel = input('');
  readonly cancelLabel = input('');
  readonly busy = input(false);

  readonly save = output<IUpdateSessionPayload>();
  readonly cancel = output<void>();

  readonly i18n = createSessionFormI18n();

  readonly form = createSessionForm(this.fb);

  readonly isUploadingImage = signal(false);
  readonly selectedImageFile = signal<File | null>(null);

  readonly isSubmitting = computed(() => this.busy() || this.isUploadingImage());

  readonly systemOptions = computed<ISystem[]>(() => [...this.systems()]);

  readonly styleOptions = computed<IChipPickerOption[]>(() =>
    this.styles().map((style) => ({
      id: style.id,
      label: style.label,
      searchText: style.slug,
      selectedClassName: 'tag-badge--arcane',
      unselectedClassName: 'tag-badge--muted',
    })),
  );

  readonly triggerOptions = computed<IChipPickerOption[]>(() =>
    this.triggers().map((trigger) => ({
      id: trigger.id,
      label: trigger.label,
      searchText: `${trigger.slug} ${trigger.aliases.join(' ')}`.trim(),
      selectedClassName: 'tag-badge--ember',
      unselectedClassName: 'tag-badge--muted',
    })),
  );

  readonly difficultyOptions = computed(() =>
    SESSION_DIFFICULTY_LEVEL_OPTIONS.map((value) => ({
      value,
      label: this.resolveDifficultyLabel(value),
    })),
  );

  readonly storedImageUrl = computed(() => {
    if (this.selectedImageFile()) {
      return null;
    }

    const imagePath = normalizeText(this.form.controls.image.getRawValue());

    if (!imagePath) {
      return null;
    }

    return this.storage.getPublicUrl(imagePath);
  });

  constructor() {
    effect(() => {
      const initial = this.initial();

      this.selectedImageFile.set(null);
      this.form.reset(mapSessionToFormData(initial ?? {}));
      this.form.markAsPristine();
      this.form.markAsUntouched();
    });

    this.auth.debugSessionClaims()
  }

  onStylesChange(gmStyleIds: string[]): void {
    this.form.controls.gmStyleIds.setValue(gmStyleIds);
    this.form.controls.gmStyleIds.markAsDirty();
    this.form.controls.gmStyleIds.markAsTouched();
  }

  onTriggersChange(triggerIds: string[]): void {
    this.form.controls.triggerIds.setValue(triggerIds);
    this.form.controls.triggerIds.markAsDirty();
    this.form.controls.triggerIds.markAsTouched();
  }

  onImageValueChange(value: IFileUploadValue): void {
    this.selectedImageFile.set(value.file);

    if (!value.file) {
      return;
    }

    this.form.controls.image.setValue(value.file.name);
    this.form.controls.image.markAsDirty();
    this.form.controls.image.markAsTouched();
  }

  onRemoveStoredImage(): void {
    this.selectedImageFile.set(null);
    this.form.controls.image.setValue(null);
    this.form.controls.image.markAsDirty();
    this.form.controls.image.markAsTouched();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isUploadingImage.set(true);

    this.uploadSelectedImageIfNeeded()
      .pipe(finalize(() => this.isUploadingImage.set(false)))
      .subscribe({
        next: () => this.save.emit(mapSessionFormToPayload(this.form)),
        error: (error) => console.error('[SESSION FORM IMAGE UPLOAD ERROR]', error),
      });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  showRequiredError(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];

    return (
      control.touched &&
      (!!control.errors?.['required'] || !!control.errors?.['requiredTrimmed'])
    );
  }

  showMinPlayersError(): boolean {
    const control = this.form.controls.minPlayers;

    return (
      control.touched &&
      (!!control.errors?.['required'] ||
        !!control.errors?.['min'] ||
        !!control.errors?.['max'])
    );
  }

  showMaxPlayersError(): boolean {
    const control = this.form.controls.maxPlayers;

    return (
      control.touched &&
      (!!control.errors?.['required'] ||
        !!control.errors?.['min'] ||
        !!control.errors?.['max'])
    );
  }

  showMinAgeError(): boolean {
    const control = this.form.controls.minAge;

    return (
      control.touched &&
      (!!control.errors?.['required'] || !!control.errors?.['min'])
    );
  }

  showSortOrderError(): boolean {
    const control = this.form.controls.sortOrder;

    return (
      control.touched &&
      (!!control.errors?.['required'] || !!control.errors?.['min'])
    );
  }

  showPlayersRangeError(): boolean {
    const minPlayers = this.form.controls.minPlayers;
    const maxPlayers = this.form.controls.maxPlayers;

    return (
      this.form.touched &&
      this.form.hasError('invalidPlayersRange') &&
      (minPlayers.touched || maxPlayers.touched)
    );
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
        folder: 'sessionTemplates',
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

  private resolveDifficultyLabel(value: SessionDifficultyLevel): string {
    switch (value) {
      case SessionDifficultyLevel.Beginner:
        return this.i18n.beginnerDifficultyLabel();
      case SessionDifficultyLevel.Intermediate:
        return this.i18n.intermediateDifficultyLabel();
      case SessionDifficultyLevel.Advanced:
        return this.i18n.advancedDifficultyLabel();
    }
  }
}