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

import {
  createSessionForm,
  mapSessionFormToPayload,
  mapSessionToFormData,
} from '../../../core/factories/session-form.factory';
import { IChipPickerOption } from '../../../core/interfaces/i-chip-picker';
import { IContentTrigger } from '../../../core/interfaces/i-content-trigger';
import { IGmStyle } from '../../../core/interfaces/i-gm-style';
import {
  ISessionFormData,
  IUpdateSessionPayload,
} from '../../../core/interfaces/i-session';
import { IStorageUploadResult } from '../../../core/interfaces/i-storage';
import { ISystem } from '../../../core/interfaces/i-system';
import { Auth } from '../../../core/services/auth/auth';
import { Storage } from '../../../core/services/storage/storage';
import {
  SESSION_DIFFICULTY_LEVEL_OPTIONS,
  SessionDifficultyLevel,
} from '../../../core/types/sessions';
import { normalizeText } from '../../../core/utils/normalize-text';
import {
  FileUploadCropConfig,
  FileUploadOptions,
  FileUploadTexts,
} from '../../../core/types/file-upload';
import { ChipPicker } from '../../../public/common/chip-picker/chip-picker';
import { FileUpload } from '../../../public/common/file-upload/file-upload';
import { SystemAutocomplete } from '../../../public/common/system-autocomplete/system-autocomplete';
import { createSessionFormI18n } from './session-form.i18n';

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
    SystemAutocomplete,
    TextareaModule,
  ],
  templateUrl: './session-form.html',
  styleUrl: './session-form.scss',
  providers: [provideTranslocoScope('sessions', 'common')],
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
  readonly storedImagePath = signal<string | null>(null);

  readonly isSubmitting = computed(() => this.busy() || this.isUploadingImage());

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

  readonly difficultyLabels = computed<Record<SessionDifficultyLevel, string>>(
    () => {
      const difficulty = this.i18n.difficulty();

      return Object.fromEntries(
        SESSION_DIFFICULTY_LEVEL_OPTIONS.map((option) => [
          option.value,
          difficulty[option.i18nKey],
        ]),
      ) as Record<SessionDifficultyLevel, string>;
    },
  );

  readonly difficultyOptions = computed(() =>
    SESSION_DIFFICULTY_LEVEL_OPTIONS.map((option) => ({
      value: option.value,
      label: this.difficultyLabels()[option.value],
    })),
  );

  readonly storedImageUrl = computed(() => {
    if (this.selectedImageFile()) {
      return null;
    }

    const imagePath = this.storedImagePath();

    if (!imagePath) {
      return null;
    }

    return this.storage.getPublicUrl(imagePath);
  });
  readonly imageUploadTexts = computed<FileUploadTexts>(() => ({
    chooseLabel: this.i18n.commonForm().fileUpload.chooseImage,
    clearLabel: this.i18n.commonActions().clear,
    dropLabel: this.i18n.commonForm().fileUpload.dropImage,
    formatsLabel: this.i18n.commonForm().fileUpload.imageFormats,
    previewAlt: this.i18n.commonForm().fileUpload.imagePreviewAlt,
    cropTitle: this.i18n.commonForm().fileUpload.cropTitle,
    cropHint: this.i18n.commonForm().fileUpload.sessionCropHint,
    cropFrameAriaLabel: this.i18n.commonForm().fileUpload.cropFrameAriaLabel,
    cropConfirmLabel: this.i18n.commonForm().fileUpload.cropConfirm,
    cropCancelLabel: this.i18n.commonActions().cancel,
    zoomLabel: this.i18n.commonForm().fileUpload.zoomLabel,
    cropPreviewLabel: this.i18n.commonForm().fileUpload.cropPreviewLabel,
    cropPreviewLandscapeLabel:
      this.i18n.commonForm().fileUpload.cropPreviewLandscapeLabel,
    cropPreviewCircleLabel:
      this.i18n.commonForm().fileUpload.cropPreviewCircleLabel,
    cropPreviewSquareLabel:
      this.i18n.commonForm().fileUpload.cropPreviewSquareLabel,
  }));
  readonly imageUploadOptions = computed<FileUploadOptions>(() => ({
    currentUrl: this.storedImageUrl(),
    disabled: this.isSubmitting(),
    previewShape: 'landscape',
    accept: 'image/png,image/jpeg,image/webp,image/avif',
    maxFileSize: 5_000_000,
  }));
  readonly imageCropConfig = computed<FileUploadCropConfig>(() => ({
    aspectRatio: 16 / 9,
    roundCropper: false,
    resizeToWidth: 1280,
    resizeToHeight: 720,
    previewShapes: ['landscape', 'circle'],
  }));

  constructor() {
    effect(() => {
      const initial = this.initial();
      const imagePath = normalizeText(initial?.image);

      this.selectedImageFile.set(null);
      this.storedImagePath.set(imagePath);
      this.form.reset(mapSessionToFormData(initial ?? {}));
      this.form.markAsPristine();
      this.form.markAsUntouched();
    });
  }

  onSystemSelect(system: ISystem | null): void {
    this.form.controls.systemId.setValue(system?.id ?? null);
    this.form.controls.systemId.markAsDirty();
    this.form.controls.systemId.markAsTouched();
  }

  onSystemClear(): void {
    this.form.controls.systemId.setValue(null);
    this.form.controls.systemId.markAsDirty();
    this.form.controls.systemId.markAsTouched();
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

  onImageValueChange(file: File | null): void {
    this.selectedImageFile.set(file);

    if (!file) {
      this.form.controls.image.setValue(this.storedImagePath());
      this.form.controls.image.markAsTouched();
      return;
    }

    this.form.controls.image.setValue(file.name);
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
        currentPath: this.storedImagePath(),
        removePrevious: true,
        usePublicUrl: false,
      })
      .pipe(
        switchMap((result) => {
          this.storedImagePath.set(result.path);
          this.form.controls.image.setValue(result.path);
          this.form.controls.image.markAsDirty();
          this.form.controls.image.markAsTouched();

          return of(result);
        }),
      );
  }
}
